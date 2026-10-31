/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { getOrderStatusLabel, StoredOrderStatus } from '@/lib/orderStatus';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from './AdminAsyncState';
import AdminPagination from './AdminPagination';

const ORDERS_PAGE_SIZE = 20;

type PaymentMethod = 'CARD' | 'DIRECT' | 'COD';
type PaymentStatus = 'PENDING' | 'APPROVED' | 'DISAPPROVED';

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  size?: string | null;
  color?: string | null;
}

interface AdminOrder {
  id: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: StoredOrderStatus;
  paymentProofScreenshotUrl?: string | null;
  affiliateAttributionRef?: string | null;
  paymentIntentId?: string | null;
  receiptUrl?: string | null;
  directAccount?: string | null;
  subtotal: string | number;
  discountAmount: string | number;
  shippingCost: string | number;
  total: string | number;
  items: OrderItem[];
  promoCode?: {
    code: string;
    discountPercent: number;
  } | null;
  user?: {
    email: string | null;
    name: string | null;
  } | null;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [actionStatus, setActionStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | StoredOrderStatus>('ALL');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [undeliveredModalOrder, setUndeliveredModalOrder] = useState<AdminOrder | null>(null);
  const [undeliveredReason, setUndeliveredReason] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const formatDisplayOrderId = (id: string) => {
    if (!id) return '';
    if (id.startsWith('STS-')) return id;
    return `ORD-${id.slice(-8).toUpperCase()}`;
  };

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const response = await fetch('/api/orders?scope=all', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.data) {
          throw new Error(data.error || 'Failed to load orders');
        }
        const normalized = (data.data as AdminOrder[]).map((order) => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
        }));
        setOrders(normalized);
        if (normalized.length > 0) {
          setSelectedOrderId((prev) => prev ?? normalized[0].id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load orders';
        setLoadError(message);
        setActionStatus({
          type: 'error',
          message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderIdFilter) {
        const query = orderIdFilter.trim().toLowerCase();
        const displayId = formatDisplayOrderId(order.id).toLowerCase();
        const rawId = order.id.toLowerCase();
        const customerName = (order.shippingName || '').toLowerCase();
        const customerEmail = (order.shippingEmail || '').toLowerCase();
        if (
          !displayId.includes(query) &&
          !rawId.includes(query) &&
          !customerName.includes(query) &&
          !customerEmail.includes(query)
        ) {
          return false;
        }
      }
      if (paymentFilter !== 'ALL' && order.paymentStatus !== paymentFilter) {
        return false;
      }
      if (deliveryFilter !== 'ALL') {
        if (deliveryFilter === 'DELIVERED' || deliveryFilter === 'COMPLETED') {
          if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') return false;
        } else if (deliveryFilter === 'PAID') {
          if (order.status !== 'PAID' && order.status !== 'PROCESSING') return false;
        } else if (deliveryFilter === 'SHIPPED') {
          if (order.status !== 'SHIPPED' && order.status !== 'OUT_FOR_DELIVERY') return false;
        } else if (deliveryFilter === 'RETURNED') {
          if (order.status !== 'RETURNED') return false;
        } else if (order.status !== deliveryFilter) {
          return false;
        }
      }
      return true;
    });
  }, [orders, orderIdFilter, paymentFilter, deliveryFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PAGE_SIZE,
    currentPage * ORDERS_PAGE_SIZE,
  );

  const activeOrderId = useMemo(() => {
    if (!paginatedOrders.length) return null;
    return paginatedOrders.some((order) => order.id === selectedOrderId)
      ? selectedOrderId
      : paginatedOrders[0].id;
  }, [paginatedOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => paginatedOrders.find((order) => order.id === activeOrderId) ?? null,
    [activeOrderId, paginatedOrders],
  );

  const resetSelectionDraft = () => {
    setActionStatus({ type: 'idle', message: '' });
    setNote('');
  };

  const selectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    resetSelectionDraft();
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    const amount = Number(value) || 0;
    return `Rs. ${amount.toFixed(2)}`;
  };

  const paidAmount = (order: AdminOrder) => {
    const total = Number(order.total) || 0;
    // For pre-paid methods (CARD, DIRECT), we display the total as the paid amount
    // since the user has already sent the funds (or card intent).
    if (order.paymentMethod === 'CARD' || order.paymentMethod === 'DIRECT') {
      return total;
    }
    
    // For COD, only show as paid if the admin has approved the payment (e.g. after delivery)
    if (order.paymentMethod === 'COD' && order.paymentStatus === 'APPROVED') {
      return total;
    }
    
    return 0;
  };

  const remainingAmount = (order: AdminOrder) => {
    // For pre-paid methods, nothing is ever collected on delivery
    if (order.paymentMethod === 'CARD' || order.paymentMethod === 'DIRECT') {
      return 0;
    }
    
    const total = Number(order.total);
    return Math.max(0, total - paidAmount(order));
  };

  const promoDiscountValue = (order: AdminOrder) => {
    if (!order.promoCode) return 0;
    const subtotal = Number(order.subtotal);
    return (subtotal * order.promoCode.discountPercent) / 100;
  };

  const shippingCostValue = (order: AdminOrder) => {
    const sCost = Number(order.shippingCost) || 0;
    if (sCost > 0) return sCost;
    
    // Fallback calculation for old orders: Total - (Subtotal - Discount)
    // Note: discountAmount in our DB currently only stores the promo discount
    const total = Number(order.total);
    const subtotal = Number(order.subtotal);
    const discount = Number(order.discountAmount);
    
    return Math.max(0, total - (subtotal - discount));
  };

  const renderActionControls = () => {
    if (!selectedOrder) {
      return null;
    }

    const isPendingPayment = selectedOrder.paymentStatus === 'PENDING';
    const isDelivered = selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'COMPLETED';
    const isCancelled = selectedOrder.status === 'CANCELLED' || selectedOrder.paymentStatus === 'DISAPPROVED';
    const isReturned = selectedOrder.status === 'RETURNED';

    return (
      <div className="space-y-4 w-full max-w-full min-w-0 box-border">
        {isPendingPayment && (
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 w-full max-w-full min-w-0 box-border">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">1. Payment Decision</p>
            <div className="flex flex-wrap gap-2.5 w-full max-w-full min-w-0 box-border">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusUpdate('APPROVED')}
                className="w-full sm:flex-1 sm:min-w-[150px] rounded-lg bg-green-600 py-2.5 px-3 font-bold text-xs text-white transition hover:bg-green-700 disabled:opacity-60 shadow-sm"
              >
                {isUpdating ? 'Updating...' : selectedOrder.paymentMethod === 'COD' ? '✓ Record Payment Received' : '✓ Approve Payment & Order'}
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusUpdate('DISAPPROVED')}
                className="w-full sm:flex-1 sm:min-w-[150px] rounded-lg bg-red-600 py-2.5 px-3 font-bold text-xs text-white transition hover:bg-red-700 disabled:opacity-60 shadow-sm"
              >
                {isUpdating ? 'Updating...' : '✕ Disapprove Payment'}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 w-full max-w-full min-w-0 box-border">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-700">2. Order Lifecycle & Fulfillment</p>
          <div className="flex flex-wrap gap-2 w-full max-w-full min-w-0 box-border">
            {/* Mark Confirmed / Paid */}
            {['PENDING', 'NEW', 'PAYMENT_PENDING'].includes(selectedOrder.status) && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleLifecycleUpdate('PAID')}
                className="flex-1 min-w-[130px] rounded-lg bg-purple-600 py-2.5 px-3 text-xs font-bold text-white transition hover:bg-purple-700 disabled:opacity-50 shadow-sm"
              >
                ✓ Confirm Order
              </button>
            )}

            {/* Mark Shipped */}
            {['PAID', 'PROCESSING', 'PAYMENT_VERIFIED', 'PACKED', 'PENDING'].includes(selectedOrder.status) && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleLifecycleUpdate('SHIPPED')}
                className="flex-1 min-w-[130px] rounded-lg bg-blue-600 py-2.5 px-3 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                🚚 Mark Shipped
              </button>
            )}

            {/* Mark Delivered */}
            {['SHIPPED', 'OUT_FOR_DELIVERY', 'PROCESSING', 'PAID'].includes(selectedOrder.status) && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleLifecycleUpdate('DELIVERED')}
                className="flex-1 min-w-[140px] rounded-lg bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                title="Updates order status and triggers customer review request email"
              >
                📦 Mark Delivered
              </button>
            )}

            {/* Mark Undelivered / Return */}
            {!isCancelled && !isReturned && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => {
                  setUndeliveredModalOrder(selectedOrder);
                  setUndeliveredReason(note || '');
                }}
                className="flex-1 min-w-[140px] rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 py-2.5 px-3 text-xs font-bold transition disabled:opacity-50 shadow-sm"
              >
                ⚠️ Undelivered / Return
              </button>
            )}

            {/* Cancel Order */}
            {!isCancelled && !isDelivered && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => {
                  if (!note.trim()) {
                    setActionStatus({ type: 'error', message: 'Please provide a cancellation reason in the Admin Note below.' });
                    return;
                  }
                  handleLifecycleUpdate('CANCELLED');
                }}
                className="flex-1 min-w-[110px] rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 py-2.5 px-3 text-xs font-bold transition disabled:opacity-50 shadow-sm"
              >
                Cancel Order
              </button>
            )}
          </div>

          {isDelivered && (
            <p className="mt-3 text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 break-words">
              ✓ Order delivered. Review request email has been dispatched to customer.
            </p>
          )}

          {isReturned && (
            <p className="mt-3 text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 break-words">
              ⚠️ Marked as Return Shipment / Undelivered. Delivery failure reason recorded in Admin Note.
            </p>
          )}

          {isCancelled && (
            <p className="mt-3 text-xs font-semibold text-red-800 bg-red-50 p-2.5 rounded-lg border border-red-200 break-words">
              ✕ Order cancelled / payment rejected.
            </p>
          )}
        </section>
      </div>
    );
  };

  const handleStatusUpdate = async (status: PaymentStatus, targetOrderId?: string) => {
    const orderToUpdateId = targetOrderId || selectedOrder?.id;
    if (!orderToUpdateId) return;

    if (status === 'DISAPPROVED' && !note.trim()) {
      setActionStatus({ type: 'error', message: 'Please provide a reason for disapproval in the Admin Note.' });
      return;
    }

    try {
      setIsUpdating(true);
      setActionStatus({ type: 'idle', message: '' });

      const bodyData: Record<string, any> = {
        paymentStatus: status,
        adminNote: note.trim(),
      };
      if (status === 'APPROVED') {
        bodyData.status = 'PAID';
      } else if (status === 'DISAPPROVED') {
        bodyData.status = 'CANCELLED';
      }

      const response = await fetch(`/api/orders/${orderToUpdateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (!response.ok || !data.order) {
        throw new Error(data.error || 'Failed to update order');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.order.id
            ? { ...data.order, items: Array.isArray(data.order.items) ? data.order.items : [] }
            : order,
        ),
      );

      setActionStatus({
        type: 'success',
        message: `Order #${formatDisplayOrderId(orderToUpdateId)} payment ${status === 'APPROVED' ? 'approved' : 'disapproved'} successfully.${data.warning ? ` ${data.warning}` : ''}`,
      });
      setNote('');
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update order.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickPaymentAction = async (orderId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setIsUpdating(true);
      const isApproved = action === 'APPROVED';
      const paymentStatus = isApproved ? 'APPROVED' : 'DISAPPROVED';
      const status = isApproved ? 'PAID' : 'CANCELLED';
      const note = isApproved ? 'Payment approved by admin' : 'Payment rejected by admin';

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus,
          status,
          adminNote: note,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus, status } : o))
      );
      setActionStatus({
        type: 'success',
        message: `Order #${formatDisplayOrderId(orderId)} payment ${isApproved ? 'approved' : 'rejected'} successfully.`,
      });
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: err?.message || 'Failed to update order payment',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete order');
      
      setOrders(prev => prev.filter(o => o.id !== id));
      if (selectedOrderId === id) setSelectedOrderId(null);
      setActionStatus({ type: 'success', message: 'Order deleted successfully.' });
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOrderAction = async (action: 'CONFIRM' | 'SHIP' | 'DELIVER' | 'CANCEL') => {
    let newStatus = '';
    if (action === 'CONFIRM') newStatus = 'PAID';
    if (action === 'SHIP') newStatus = 'SHIPPED';
    if (action === 'DELIVER') newStatus = 'DELIVERED';
    if (action === 'CANCEL') newStatus = 'CANCELLED';
    await handleLifecycleUpdate(newStatus);
  };

  const handleLifecycleUpdate = async (newStatus: string, targetOrderId?: string, customNote?: string) => {
    const orderToUpdateId = targetOrderId || selectedOrder?.id;
    if (!orderToUpdateId) return;

    const noteToUse = customNote !== undefined ? customNote : note.trim();

    if ((newStatus === 'CANCELLED' || newStatus === 'DISAPPROVED' || newStatus === 'RETURNED') && !noteToUse) {
      setActionStatus({
        type: 'error',
        message:
          newStatus === 'RETURNED'
            ? 'Please provide a mandatory reason for marking the order as undelivered / return shipment.'
            : 'Please provide a reason in the admin note.',
      });
      return;
    }

    try {
      setIsUpdating(true);
      setActionStatus({ type: 'idle', message: '' });

      const bodyData: Record<string, any> = { status: newStatus, adminNote: noteToUse };
      if (newStatus === 'PAID') {
        bodyData.paymentStatus = 'APPROVED';
      }

      const response = await fetch(`/api/orders/${orderToUpdateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (!response.ok || !data.order) {
        throw new Error(data.error || 'Failed to update order status.');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.order.id
            ? { ...data.order, items: Array.isArray(data.order.items) ? data.order.items : [] }
            : order,
        ),
      );
      
      const newLabel = getOrderStatusLabel(newStatus);
      setActionStatus({
        type: 'success',
        message: `Order #${formatDisplayOrderId(orderToUpdateId)} status updated to ${newLabel}.${data.warning ? ` ${data.warning}` : ''}`,
      });
      setNote('');
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update order.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <AdminLoadingState label="Loading orders..." />;
  }

  if (loadError && !orders.length) {
    return <AdminErrorState message={loadError} />;
  }

  if (!orders.length) {
    return (
      <AdminEmptyState
        title="No orders yet"
        description="Customer orders will appear here after checkout is completed."
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 w-full max-w-full min-w-0 box-border">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-full min-w-0 box-border overflow-hidden">
        <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 border-b border-gray-100 w-full max-w-full min-w-0 box-border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {filteredOrders.length} shown
              </span>
            </div>
            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Fluid Cards (Zero Horizontal Scroll)"
              >
                Cards View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  viewMode === 'table'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table View"
              >
                Table View
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center w-full min-w-0">
            <input
              type="text"
              placeholder="Search ID, customer, email..."
              value={orderIdFilter}
              onChange={(e) => {
                setOrderIdFilter(e.target.value);
                setPage(1);
                resetSelectionDraft();
              }}
              className="flex-1 min-w-[170px] bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-500 hover:border-slate-400"
            />
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value as any);
                setPage(1);
                resetSelectionDraft();
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white outline-none transition-all hover:border-slate-400"
            >
              <option value="ALL">All payments</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DISAPPROVED">Disapproved</option>
            </select>
            <select
              value={deliveryFilter}
              onChange={(e) => {
                setDeliveryFilter(e.target.value as any);
                setPage(1);
                resetSelectionDraft();
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white outline-none transition-all hover:border-slate-400"
            >
              <option value="ALL">All delivery statuses</option>
              <option value="PENDING">Pending / New</option>
              <option value="PAID">Confirmed / Processing</option>
              <option value="SHIPPED">Shipped / In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="RETURNED">Return Shipments / Undelivered</option>
              <option value="CANCELLED">Cancelled / Disapproved</option>
            </select>
          </div>
        </div>

        <div className="w-full max-w-full min-w-0 box-border overflow-x-hidden">
          {filteredOrders.length === 0 ? (
            <div className="py-12 px-4 text-center text-gray-500 text-sm">
              No orders match the selected filters.
            </div>
          ) : viewMode === 'cards' ? (
            /* Responsive Fluid Card List: ZERO horizontal scrollbar */
            <div className="divide-y divide-gray-100 w-full max-w-full min-w-0 box-border overflow-x-hidden">
              {paginatedOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => selectOrder(order.id)}
                  className={`p-3.5 sm:p-4 transition-all cursor-pointer w-full max-w-full min-w-0 box-border border-l-4 ${
                    activeOrderId === order.id
                      ? 'bg-purple-50/80 border-purple-600 shadow-2xs'
                      : 'border-transparent hover:bg-gray-50/80 hover:border-gray-200'
                  }`}
                >
                  {/* Row 1: ID, Copy, Date, Status Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2 w-full min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-200 shrink-0">
                        #{formatDisplayOrderId(order.id)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(e, order.id)}
                        className="p-1 text-gray-400 hover:text-purple-600 transition rounded hover:bg-purple-50 shrink-0"
                        title={copiedOrderId === order.id ? 'Copied full ID!' : 'Copy full order ID'}
                      >
                        {copiedOrderId === order.id ? (
                          <span className="text-[10px] text-green-600 font-bold">✓</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                      </button>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                        order.paymentStatus === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : order.paymentStatus === 'DISAPPROVED'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full whitespace-nowrap ${
                        order.status === 'COMPLETED' || order.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'CANCELLED' || order.status === 'DISAPPROVED'
                            ? 'bg-red-100 text-red-700'
                          : order.status === 'RETURNED'
                            ? 'bg-amber-100 text-amber-800'
                          : order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-blue-100 text-blue-700'
                          : order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'PAYMENT_VERIFIED'
                            ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Customer info + Total */}
                  <div className="flex items-start justify-between gap-3 mb-2.5 w-full min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {order.shippingName}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={order.shippingEmail}>
                        {order.shippingEmail}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-[11px] font-medium text-gray-500 uppercase">
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Quick Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100/80 w-full min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {order.paymentStatus !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate('APPROVED', order.id);
                          }}
                          disabled={isUpdating}
                          className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-bold transition shadow-2xs whitespace-nowrap disabled:opacity-50"
                          title="Approve Payment"
                        >
                          Approve
                        </button>
                      )}
                      {['PAID', 'PROCESSING', 'PAYMENT_VERIFIED', 'PACKED', 'PENDING'].includes(order.status) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLifecycleUpdate('SHIPPED', order.id);
                          }}
                          disabled={isUpdating}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition shadow-2xs whitespace-nowrap disabled:opacity-50"
                          title="Mark as Shipped"
                        >
                          Ship
                        </button>
                      )}
                      {['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLifecycleUpdate('DELIVERED', order.id);
                          }}
                          disabled={isUpdating}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition shadow-2xs whitespace-nowrap disabled:opacity-50"
                          title="Mark as Delivered"
                        >
                          Deliver
                        </button>
                      )}
                      {order.status !== 'CANCELLED' && order.status !== 'RETURNED' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUndeliveredModalOrder(order);
                            setUndeliveredReason('');
                          }}
                          disabled={isUpdating}
                          className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-bold transition shadow-2xs whitespace-nowrap disabled:opacity-50"
                          title="Mark as Undelivered / Return"
                        >
                          Return
                        </button>
                      )}
                      {order.paymentStatus !== 'DISAPPROVED' && order.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Cancel Order #${formatDisplayOrderId(order.id)}?`)) {
                              handleQuickPaymentAction(order.id, 'REJECTED');
                            }
                          }}
                          disabled={isUpdating}
                          className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-bold transition shadow-2xs whitespace-nowrap disabled:opacity-50"
                          title="Cancel Order"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to permanently delete this order?')) {
                          handleDeleteOrder(order.id);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition rounded shrink-0 ml-auto"
                      title="Delete Order"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table Mode: Full detail table with horizontal scrolling */
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[680px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Order ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Delivery</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={`cursor-pointer hover:bg-purple-50 transition-colors ${activeOrderId === order.id ? 'bg-purple-50/70' : ''}`}
                      onClick={() => selectOrder(order.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-200">
                            #{formatDisplayOrderId(order.id)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(e, order.id)}
                            className="p-1 text-gray-400 hover:text-purple-600 transition rounded hover:bg-purple-50"
                            title={copiedOrderId === order.id ? 'Copied full ID!' : 'Copy full order ID'}
                          >
                            {copiedOrderId === order.id ? (
                              <span className="text-[10px] text-green-600 font-bold">✓</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="font-medium text-gray-900 truncate max-w-[140px]">{order.shippingName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[140px]">{order.shippingEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{order.paymentMethod.toLowerCase()}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            order.paymentStatus === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : order.paymentStatus === 'DISAPPROVED'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                            order.status === 'COMPLETED' || order.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'CANCELLED' || order.status === 'DISAPPROVED'
                                ? 'bg-red-100 text-red-700'
                              : order.status === 'RETURNED'
                                ? 'bg-amber-100 text-amber-800'
                              : order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-blue-100 text-blue-700'
                              : order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'PAYMENT_VERIFIED'
                                ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.paymentStatus !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate('APPROVED', order.id);
                              }}
                              disabled={isUpdating}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition shadow-xs whitespace-nowrap disabled:opacity-50"
                              title="Approve Payment"
                            >
                              Approve
                            </button>
                          )}
                          {['PAID', 'PROCESSING', 'PAYMENT_VERIFIED', 'PACKED', 'PENDING'].includes(order.status) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLifecycleUpdate('SHIPPED', order.id);
                              }}
                              disabled={isUpdating}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-xs whitespace-nowrap disabled:opacity-50"
                              title="Mark as Shipped"
                            >
                              Ship
                            </button>
                          )}
                          {['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLifecycleUpdate('DELIVERED', order.id);
                              }}
                              disabled={isUpdating}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition shadow-xs whitespace-nowrap disabled:opacity-50"
                              title="Mark as Delivered"
                            >
                              Deliver
                            </button>
                          )}
                          {order.status !== 'CANCELLED' && order.status !== 'RETURNED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUndeliveredModalOrder(order);
                                setUndeliveredReason('');
                              }}
                              disabled={isUpdating}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-bold transition shadow-xs whitespace-nowrap disabled:opacity-50"
                              title="Mark as Undelivered / Return"
                            >
                              Return
                            </button>
                          )}
                          {order.paymentStatus !== 'DISAPPROVED' && order.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Cancel Order #${formatDisplayOrderId(order.id)}?`)) {
                                  handleQuickPaymentAction(order.id, 'REJECTED');
                                }
                              }}
                              disabled={isUpdating}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold transition shadow-xs whitespace-nowrap disabled:opacity-50"
                              title="Cancel Order"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to permanently delete this order?')) {
                                handleDeleteOrder(order.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition rounded"
                            title="Delete Order"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AdminPagination page={currentPage} pageSize={ORDERS_PAGE_SIZE} totalItems={filteredOrders.length} itemLabel="orders" onPageChange={(nextPage) => { setPage(nextPage); resetSelectionDraft(); }} />
      </div>

      {selectedOrder && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 w-full max-w-full min-w-0 box-border overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 pb-4 border-b border-gray-100 w-full max-w-full min-w-0 box-border">
            <div className="flex-1 min-w-0 max-w-full">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Reference</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <h3 className="text-lg font-extrabold text-gray-900 font-mono tracking-tight break-all">
                  #{formatDisplayOrderId(selectedOrder.id)}
                </h3>
                <button
                  type="button"
                  onClick={(e) => handleCopyId(e, selectedOrder.id)}
                  className="px-2 py-0.5 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded font-medium flex items-center gap-1 transition whitespace-nowrap"
                  title="Copy full order ID"
                >
                  {copiedOrderId === selectedOrder.id ? 'Copied!' : 'Copy ID'}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1.5 max-w-full text-[11px] text-gray-500 font-mono break-all" title={selectedOrder.id}>
                <span className="text-gray-400 select-none shrink-0">System ID:</span>
                <span className="font-semibold text-gray-700 break-all select-all">{selectedOrder.id}</span>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 flex flex-col sm:items-end gap-2 min-w-0">
              <div>
                <p className="text-xs text-gray-400">Placed on</p>
                <p className="text-xs font-semibold text-gray-900">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const invoiceWindow = window.open('', '_blank');
                  if (!invoiceWindow) return;
                  const itemsHtml = selectedOrder.items
                    .map(
                      (item) => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>${item.name}</strong>
                        ${item.size || item.color ? `<br/><small style="color: #666;">Variant: ${[item.size, item.color].filter(Boolean).join(', ')}</small>` : ''}
                      </td>
                      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${Number(item.price).toLocaleString()}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${(Number(item.price) * item.quantity).toLocaleString()}</td>
                    </tr>
                  `,
                    )
                    .join('');

                  invoiceWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Invoice #${selectedOrder.id} - Step & Styl</title>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #111; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #9b4de0; padding-bottom: 15px; margin-bottom: 25px; }
                        .brand { font-size: 24px; font-weight: 800; color: #9b4de0; text-transform: uppercase; }
                        .invoice-title { font-size: 16px; color: #666; font-weight: 600; }
                        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
                        .box { background: #f9f9fc; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.6; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
                        th { background: #f4f0fa; color: #444; padding: 10px; text-align: left; }
                        .totals { width: 300px; margin-left: auto; font-size: 14px; line-height: 1.8; }
                        .totals-row { display: flex; justify-content: space-between; }
                        .total-grand { font-size: 16px; font-weight: bold; border-top: 2px solid #ddd; padding-top: 8px; color: #9b4de0; }
                        .print-btn { background: #9b4de0; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px; }
                        @media print { .print-btn { display: none; } }
                      </style>
                    </head>
                    <body>
                      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
                      <div class="header">
                        <div>
                          <div class="brand">STEP & STYL</div>
                          <div class="invoice-title">Official Customer Invoice</div>
                        </div>
                        <div style="text-align: right;">
                          <strong>Invoice: #${selectedOrder.id}</strong><br/>
                          <small>Date: ${new Date(selectedOrder.createdAt).toLocaleDateString()}</small>
                        </div>
                      </div>
                      <div class="meta-grid">
                        <div class="box">
                          <strong>Billed To:</strong><br/>
                          ${selectedOrder.shippingName}<br/>
                          ${selectedOrder.shippingEmail}<br/>
                          ${selectedOrder.shippingPhone}
                        </div>
                        <div class="box">
                          <strong>Shipping Destination:</strong><br/>
                          ${selectedOrder.shippingAddress}<br/>
                          ${selectedOrder.shippingCity} ${selectedOrder.shippingPostalCode}<br/>
                          <strong>Payment Method:</strong> ${selectedOrder.paymentMethod}
                        </div>
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>Item Description</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                      </table>
                      <div class="totals">
                        <div class="totals-row"><span>Subtotal:</span> <span>Rs. ${Number(selectedOrder.subtotal).toLocaleString()}</span></div>
                        ${Number(selectedOrder.discountAmount) > 0 ? `<div class="totals-row" style="color: #16a34a;"><span>Discount:</span> <span>-Rs. ${Number(selectedOrder.discountAmount).toLocaleString()}</span></div>` : ''}
                        <div class="totals-row"><span>Shipping:</span> <span>Rs. ${Number(selectedOrder.shippingCost).toLocaleString()}</span></div>
                        <div class="totals-row total-grand"><span>Total Amount:</span> <span>Rs. ${Number(selectedOrder.total).toLocaleString()}</span></div>
                      </div>
                    </body>
                    </html>
                  `);
                  invoiceWindow.document.close();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors border border-purple-200"
                title="Print or Save Order Invoice as PDF"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Download PDF Invoice
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-6 w-full max-w-full min-w-0 box-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-full min-w-0 box-border">
              <section className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 min-w-0 w-full max-w-full box-border">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Customer Details</h4>
                <p className="text-sm text-gray-900 font-bold break-words">{selectedOrder.shippingName}</p>
                <p className="text-xs text-gray-600 break-all mt-0.5">{selectedOrder.shippingEmail}</p>
                <p className="text-xs text-gray-600 mt-0.5 font-mono">{selectedOrder.shippingPhone}</p>
              </section>

              <section className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 min-w-0 w-full max-w-full box-border">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Shipping Destination</h4>
                <p className="text-xs text-gray-700 leading-relaxed break-words">
                  {selectedOrder.shippingAddress}
                </p>
                <p className="text-xs font-bold text-gray-900 mt-1">
                  {selectedOrder.shippingCity} {selectedOrder.shippingPostalCode}
                </p>
              </section>
            </div>

            <section className="w-full max-w-full min-w-0 box-border">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Items ({selectedOrder.items.length})</h4>
              <div className="space-y-2 w-full max-w-full min-w-0 box-border">
                {selectedOrder.items.map((item, index) => (
                  <div key={`${item.id ?? index}-${item.name}`} className="flex justify-between items-start gap-3 text-sm p-2.5 rounded-lg bg-gray-50/70 border border-gray-100 w-full max-w-full min-w-0 box-border">
                    <span className="text-gray-700 min-w-0 break-words flex-1">
                      <strong className="text-gray-900">{item.name}</strong>
                      {(item.size || item.color) && (
                        <span className="text-xs text-gray-500 block sm:inline sm:ml-1">
                          ({[item.size, item.color].filter(Boolean).join(', ')})
                        </span>
                      )}
                      {" "}<span className="text-xs text-gray-500 font-semibold">× {item.quantity}</span>
                    </span>
                    <span className="font-bold text-gray-900 whitespace-nowrap shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {promoDiscountValue(selectedOrder) > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Promo Discount ({selectedOrder.promoCode?.code})</span>
                  <span>-{formatCurrency(promoDiscountValue(selectedOrder))}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold text-gray-900">{formatCurrency(shippingCostValue(selectedOrder))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold text-gray-900">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Status</span>
                <span className="font-semibold text-gray-900">
                  {getOrderStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid Amount</span>
                <span className="font-semibold text-gray-900">{formatCurrency(paidAmount(selectedOrder))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining on Delivery</span>
                <span className="font-semibold text-gray-900">{formatCurrency(remainingAmount(selectedOrder))}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </section>

            {selectedOrder.receiptUrl && (
              <section>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Payment Receipt (Initial)</h4>
                <div className="relative h-64 rounded-xl border border-gray-200 overflow-hidden cursor-pointer" onClick={() => setFullscreenImage(selectedOrder.receiptUrl || null)}>
                  <Image
                    src={selectedOrder.receiptUrl}
                    alt="Payment receipt"
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-contain hover:opacity-90 transition-opacity"
                  />
                </div>
              </section>
            )}
            
            {selectedOrder.paymentProofScreenshotUrl && (
              <section className="mt-4">
                <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-2">Bank Transfer Proof</h4>
                <div className="relative h-64 rounded-xl border border-purple-200 overflow-hidden cursor-pointer" onClick={() => setFullscreenImage(selectedOrder.paymentProofScreenshotUrl || null)}>
                  <Image
                    src={selectedOrder.paymentProofScreenshotUrl}
                    alt="Bank Transfer Proof"
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-contain hover:opacity-90 transition-opacity"
                  />
                </div>
              </section>
            )}
            
            {selectedOrder.affiliateAttributionRef && (
              <div className="mt-4 bg-purple-50 text-purple-800 p-3 rounded-lg border border-purple-200 w-full max-w-full min-w-0 box-border break-words">
                <span className="font-semibold">Affiliate Referral:</span> {selectedOrder.affiliateAttributionRef}
              </div>
            )}

            <section className="w-full max-w-full min-w-0 box-border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add payment, cancellation, or internal note..."
                rows={3}
                className="w-full max-w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-500 hover:border-slate-400 resize-none box-border"
              />
              {selectedOrder.adminNote && (
                <p className="text-xs text-gray-500 mt-2 break-words">
                  Last note: <span className="font-medium text-gray-700 break-words">{selectedOrder.adminNote}</span>
                </p>
              )}
            </section>
          </div>

          {actionStatus.type !== 'idle' && (
            <p
              className={`text-sm mb-3 break-words ${
                actionStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {actionStatus.message}
            </p>
          )}

          {renderActionControls()}
        </div>
      )}

      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-4xl w-full h-[85vh] flex flex-col items-center">
            <button
              className="absolute -top-10 right-0 z-10 text-white hover:text-gray-300 font-bold text-xl"
              onClick={() => setFullscreenImage(null)}
            >
              Close
            </button>
            <Image
              src={fullscreenImage}
              alt="Full Payment Receipt"
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Undelivered / Return Shipment Modal */}
      {undeliveredModalOrder && (
        <div 
          className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setUndeliveredModalOrder(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Mark as Undelivered / Return</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Order #{formatDisplayOrderId(undeliveredModalOrder.id)}</p>
              </div>
              <button
                type="button"
                onClick={() => setUndeliveredModalOrder(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              A mandatory reason is required to mark this order as undelivered / return shipment. This will be recorded in the order history and a customer-safe delivery update notice will be dispatched.
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Quick Reason Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Customer unavailable after multiple attempts',
                  'Incorrect / unreachable shipping address',
                  'Customer refused delivery at doorstep',
                  'Package damaged in transit',
                  'Customer cancelled at time of delivery'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setUndeliveredReason(preset)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border text-left transition ${
                      undeliveredReason === preset
                        ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Reason / Delivery Failure Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={undeliveredReason}
                  onChange={(e) => setUndeliveredReason(e.target.value)}
                  placeholder="Enter specific delivery failure details..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setUndeliveredModalOrder(null)}
                disabled={isUpdating}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating || !undeliveredReason.trim()}
                onClick={async () => {
                  if (!undeliveredReason.trim()) return;
                  await handleLifecycleUpdate('RETURNED', undeliveredModalOrder.id, undeliveredReason.trim());
                  setUndeliveredModalOrder(null);
                  setUndeliveredReason('');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Confirm Undelivered / Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

