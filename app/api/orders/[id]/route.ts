import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import {
  sendOrderApprovedEmail,
  sendOrderRejectedEmail,
  sendOrderDeliveredEmail,
  sendOrderUndeliveredEmail,
} from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
    }

    // Handle both Next.js 14 (sync) and Next.js 15 (async) params safely
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const orderId = resolvedParams?.id;
    
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is missing.' }, { status: 400 });
    }

    const rawBody = await request.json().catch(() => null);
    console.log('--- INCOMING ORDER UPDATE REQUEST ---');
    console.log('Order ID:', orderId);
    console.log('Request Body:', rawBody);

    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const body = rawBody as Record<string, unknown>;
    
    let statusInput = body.status || body.action || body.state || body.newStatus || '';
    let cleanStatus = typeof statusInput === 'string' ? statusInput.trim().toUpperCase() : '';

    // Map actions to your schema's OrderStatus enum: PENDING, PAID, SHIPPED, COMPLETED, CANCELLED, RETURNED, etc.
    if (cleanStatus === 'CONFIRM' || cleanStatus === 'CONFIRMED' || cleanStatus === 'APPROVE') {
      cleanStatus = 'PAID'; 
    }
    if (cleanStatus === 'DISAPPROVE' || cleanStatus === 'REJECT' || cleanStatus === 'CANCEL') {
      cleanStatus = 'CANCELLED';
    }
    if (cleanStatus === 'SHIP') cleanStatus = 'SHIPPED';
    if (cleanStatus === 'DELIVER') cleanStatus = 'DELIVERED';
    if (cleanStatus === 'UNDELIVERED' || cleanStatus === 'RETURN' || cleanStatus === 'RETURN_SHIPMENT') {
      cleanStatus = 'RETURNED';
    }

    const paymentStatusInput = body.paymentStatus;
    let cleanPaymentStatus = typeof paymentStatusInput === 'string' ? paymentStatusInput.trim().toUpperCase() : undefined;
    
    // Map payment status if needed (schema uses: PENDING, APPROVED, DISAPPROVED)
    if (cleanPaymentStatus === 'CONFIRM') cleanPaymentStatus = 'APPROVED';
    if (cleanPaymentStatus === 'DISAPPROVE') cleanPaymentStatus = 'DISAPPROVED';

    const noteInput = typeof body.adminNote === 'string' ? body.adminNote.trim() : (typeof body.reason === 'string' ? body.reason.trim() : '');

    // Enforce mandatory reason for Undelivered / Return Shipment, Cancellation, or Disapproval
    if ((cleanStatus === 'RETURNED' || cleanStatus === 'CANCELLED' || cleanPaymentStatus === 'DISAPPROVED') && !noteInput) {
      return NextResponse.json(
        {
          success: false,
          error:
            cleanStatus === 'RETURNED'
              ? 'Please provide a mandatory reason for marking the order as undelivered / return shipment.'
              : 'Please provide a reason in the admin note.',
        },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentStatus: true, shippingEmail: true, shippingName: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    const validOrderStatuses = ['NEW', 'PAYMENT_PENDING', 'PAYMENT_VERIFIED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'REJECTED_FAILED', 'PENDING', 'PAID', 'COMPLETED', 'APPROVED', 'DISAPPROVED'];
    const validPaymentStatuses = ['PENDING', 'APPROVED', 'DISAPPROVED'];

    if (cleanStatus && validOrderStatuses.includes(cleanStatus)) {
      updateData.status = cleanStatus;
    }
    
    if (cleanPaymentStatus && validPaymentStatuses.includes(cleanPaymentStatus)) {
      updateData.paymentStatus = cleanPaymentStatus;
      
      if (cleanPaymentStatus === 'APPROVED') {
        updateData.approvedAt = new Date();
        // If payment approved and status was pending, advance order to PAID/processing
        if (!cleanStatus && ['PENDING', 'PAYMENT_PENDING', 'NEW'].includes(existingOrder.status)) {
          updateData.status = 'PAID';
        }
      } else if (cleanPaymentStatus === 'DISAPPROVED') {
        updateData.disapprovedAt = new Date();
        if (!cleanStatus && existingOrder.status !== 'CANCELLED') {
          updateData.status = 'CANCELLED';
        }
      }
    }

    if (noteInput) {
      updateData.adminNote = noteInput;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid status, paymentStatus, or adminNote provided in request body.' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Trigger emails on Payment Approval, Rejection, Delivery, or Return/Undelivered
    if (existingOrder.shippingEmail) {
      const isApproved =
        (updateData.paymentStatus === 'APPROVED' && existingOrder.paymentStatus !== 'APPROVED') ||
        (['PAID', 'PROCESSING', 'PAYMENT_VERIFIED', 'APPROVED'].includes(updateData.status) &&
          !['PAID', 'PROCESSING', 'PAYMENT_VERIFIED', 'APPROVED'].includes(existingOrder.status));

      const isRejected =
        (updateData.paymentStatus === 'DISAPPROVED' && existingOrder.paymentStatus !== 'DISAPPROVED') ||
        (['CANCELLED', 'REJECTED_FAILED', 'DISAPPROVED'].includes(updateData.status) &&
          !['CANCELLED', 'REJECTED_FAILED', 'DISAPPROVED'].includes(existingOrder.status));

      const isDelivered =
        ['DELIVERED', 'COMPLETED'].includes(updateData.status) &&
        !['DELIVERED', 'COMPLETED'].includes(existingOrder.status);

      const isReturned =
        updateData.status === 'RETURNED' && existingOrder.status !== 'RETURNED';

      try {
        if (isApproved) {
          await sendOrderApprovedEmail(existingOrder.shippingEmail, existingOrder.shippingName || 'Customer', orderId);
          console.log(`Approval email sent to ${existingOrder.shippingEmail}`);
        } else if (isRejected) {
          await sendOrderRejectedEmail(existingOrder.shippingEmail, existingOrder.shippingName || 'Customer', orderId);
          console.log(`Rejection email sent to ${existingOrder.shippingEmail}`);
        } else if (isDelivered) {
          await sendOrderDeliveredEmail(existingOrder.shippingEmail, existingOrder.shippingName || 'Customer', orderId);
          console.log(`Delivered success email sent to ${existingOrder.shippingEmail}`);
        } else if (isReturned) {
          await sendOrderUndeliveredEmail(existingOrder.shippingEmail, existingOrder.shippingName || 'Customer', orderId, noteInput);
          console.log(`Undelivered / return email sent to ${existingOrder.shippingEmail}`);
        }
      } catch (emailErr) {
        console.error('Failed to send status update email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully.',
      data: updatedOrder,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('SERVER CRASH IN ORDER UPDATE:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Internal Server Error',
        code: error?.code 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  return PATCH(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
    }

    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const orderId = resolvedParams?.id;
    
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is missing.' }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    // Delete related OrderItem records first if they aren't cascading
    // Assuming cascading is on, but just to be safe:
    try {
      // Assuming prisma schema defines order items as OrderItem
      // if it fails we catch and ignore because cascade deletion might be on.
      if ((prisma as any).orderItem) { await (prisma as any).orderItem.deleteMany({ where: { orderId } }); }
    } catch(e) {}

    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Order deletion error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
