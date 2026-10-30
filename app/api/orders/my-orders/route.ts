import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get(AUTH_COOKIE_NAME)?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    // Securely query orders belonging to this authenticated customer
    // Also include any guest orders matching user's email
    const userEmail = payload.email?.toLowerCase().trim();
    const whereClause: any = {
      OR: [
        { userId: payload.userId },
        ...(userEmail ? [{ shippingEmail: { equals: userEmail, mode: 'insensitive' } }] : []),
      ],
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        promoCode: {
          select: {
            code: true,
            discountPercent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serializedOrders = orders.map((order) => {
      let parsedItems: any[] = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch {
        parsedItems = [];
      }

      return {
        id: order.id,
        orderNumber: order.id.slice(-8).toUpperCase(),
        subtotal: Number(order.subtotal) || 0,
        discountAmount: Number(order.discountAmount) || 0,
        shippingCost: Number(order.shippingCost) || 0,
        total: Number(order.total) || 0,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        receiptUrl: order.receiptUrl || order.paymentProofScreenshotUrl || null,
        shippingName: order.shippingName,
        shippingEmail: order.shippingEmail,
        shippingPhone: order.shippingPhone,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingRegion: order.shippingRegion,
        shippingPostalCode: order.shippingPostalCode,
        items: parsedItems,
        promoCode: order.promoCode?.code || null,
        discountPercent: order.promoCode?.discountPercent || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: serializedOrders,
      totalOrders: serializedOrders.length,
    });
  } catch (error: any) {
    console.error('Error fetching customer orders in /api/orders/my-orders:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to retrieve order history.' },
      { status: 500 }
    );
  }
}
