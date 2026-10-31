/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Package, 
  MapPin, 
  ShieldCheck, 
  User, 
  LogOut, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatPKR } from '@/lib/currency';
import { getOrderStatusLabel } from '@/lib/orderStatus';
import './CustomerDashboard.css';

export interface CustomerDashboardProps {
  customer: {
    id: string;
    email: string;
    name?: string | null;
    emailVerified?: boolean;
    role?: string;
  };
  initialOrders?: any[];
  initialAddresses?: any[];
  onLogout: () => void;
}

/**
 * Modern luxury customer dashboard for Step & Styl
 */
export default function CustomerDashboard({
  customer,
  initialOrders = [],
  initialAddresses = [],
  onLogout,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'security'>('overview');
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [addresses, setAddresses] = useState<any[]>(initialAddresses);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Address form state
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: customer?.name || '',
    phone: '',
    address: '',
    city: '',
    region: 'Punjab',
    postalCode: '',
    isDefault: false,
  });

  // Profile and Password states
  const [profile, setProfile] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    currentPassword: '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch real-time orders securely from /api/orders/my-orders
  const refreshOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders/my-orders', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders();
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'ALL') return orders;
    if (orderFilter === 'PROCESSING') {
      return orders.filter(o => ['PROCESSING', 'PENDING', 'NEW', 'PAYMENT_PENDING', 'PAYMENT_VERIFIED', 'PACKED'].includes(o.status));
    }
    if (orderFilter === 'DELIVERED') {
      return orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status));
    }
    if (orderFilter === 'CANCELLED') {
      return orders.filter(o => ['CANCELLED', 'DISAPPROVED', 'RETURNED'].includes(o.status));
    }
    return orders;
  }, [orders, orderFilter]);

  // Quick stats
  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => !['DELIVERED', 'COMPLETED', 'CANCELLED', 'DISAPPROVED', 'RETURNED'].includes(o.status)).length;
  }, [orders]);

  const deliveredOrdersCount = useMemo(() => {
    return orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
  }, [orders]);

  const latestOrder = orders[0] || null;

  // Real-time status styling
  const renderStatusPill = (status: any) => {
    const s = String(status).toUpperCase();
    if (['DELIVERED', 'COMPLETED'].includes(s)) {
      return (
        <span className="status-pill status-pill-delivered">
          <CheckCircle2 size={12} /> Delivered
        </span>
      );
    }
    if (['SHIPPED', 'OUT_FOR_DELIVERY'].includes(s)) {
      return (
        <span className="status-pill status-pill-shipped">
          <Truck size={12} /> {s === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'Shipped'}
        </span>
      );
    }
    if (['PROCESSING', 'PACKED', 'PAYMENT_VERIFIED'].includes(s)) {
      return (
        <span className="status-pill status-pill-processing">
          <span className="pulse-dot" /> {s === 'PACKED' ? 'Packed' : 'Processing'}
        </span>
      );
    }
    if (['CANCELLED', 'DISAPPROVED', 'RETURNED'].includes(s)) {
      return (
        <span className="status-pill status-pill-cancelled">
          <AlertCircle size={12} /> Cancelled
        </span>
      );
    }
    return (
      <span className="status-pill status-pill-pending">
        <Clock size={12} /> {getOrderStatusLabel(s)}
      </span>
    );
  };

  // Helper for timeline step active index
  const getTimelineStepIndex = (status: any) => {
    const s = String(status).toUpperCase();
    if (['DELIVERED', 'COMPLETED'].includes(s)) return 4;
    if (s === 'OUT_FOR_DELIVERY') return 3;
    if (s === 'SHIPPED') return 2;
    if (['PROCESSING', 'PACKED', 'PAYMENT_VERIFIED'].includes(s)) return 1;
    return 0; // Order placed
  };

  // Profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setProfile(prev => ({ ...prev, currentPassword: '' }));
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error updating profile.' });
    } finally {
      setSaving(false);
    }
  };

  // Password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: data.message || 'Password changed successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error changing password.' });
    } finally {
      setSaving(false);
    }
  };

  // Resend verification
  const handleResendVerification = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send verification email.');
      setMessage({ type: 'success', text: data.message || 'Verification email sent.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error sending verification email.' });
    } finally {
      setSaving(false);
    }
  };

  // Save address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const endpoint = editingAddressId 
        ? `/api/account/addresses/${editingAddressId}` 
        : '/api/account/addresses';
      const res = await fetch(endpoint, {
        method: editingAddressId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save address.');
      
      setAddressForm({
        label: 'Home',
        fullName: customer?.name || '',
        phone: '',
        address: '',
        city: '',
        region: 'Punjab',
        postalCode: '',
        isDefault: false,
      });
      setEditingAddressId(null);

      // Refresh addresses
      const addrRes = await fetch('/api/account/addresses', { cache: 'no-store' });
      const addrData = await addrRes.json();
      if (addrRes.ok) setAddresses(addrData.addresses || []);

      setMessage({ type: 'success', text: 'Address saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error saving address.' });
    } finally {
      setSaving(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete address.');
      setAddresses(prev => prev.filter(a => a.id !== id));
      setMessage({ type: 'success', text: 'Address removed successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error deleting address.' });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        
        {/* Welcome Header */}
        <header className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="dashboard-eyebrow">
              <Sparkles size={14} /> Official Customer Portal
            </span>
            <h1 className="dashboard-title">
              Welcome back, {customer?.name || customer?.email?.split('@')[0] || 'Customer'}
            </h1>
            <p className="dashboard-subtitle">
              {customer?.email} {customer?.emailVerified ? '• Verified Member' : '• Verification Pending'}
            </p>
          </div>

          <div className="dashboard-header-actions">
            <Link href="/?view=shop" className="btn-primary" style={{ textDecoration: 'none' }}>
              <ShoppingBag size={16} /> Explore Footwear
            </Link>
            <button onClick={onLogout} className="btn-signout" title="Sign out of your account">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>

        {/* Verification Alert if not verified */}
        {!customer?.emailVerified && (
          <div className="dashboard-alert alert-warning">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-sm">Verify your email address</p>
                <p className="text-xs text-amber-700">Verification protects your orders and allows seamless guest order linking.</p>
              </div>
            </div>
            <button 
              onClick={handleResendVerification} 
              disabled={saving}
              className="btn-secondary"
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              Resend Link
            </button>
          </div>
        )}

        {/* Global Success / Error Message Banner */}
        {message && (
          <div className={`dashboard-alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          
          {/* Left Navigation Sidebar */}
          <aside className="dashboard-sidebar-nav">
            <button
              onClick={() => { setActiveTab('overview'); setMessage(null); }}
              className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <User size={18} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setMessage(null); }}
              className={`nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            >
              <Package size={18} />
              <span>My Orders</span>
              <span className="tab-badge">{orders.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('addresses'); setMessage(null); }}
              className={`nav-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
            >
              <MapPin size={18} />
              <span>Saved Addresses</span>
              <span className="tab-badge">{addresses.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('security'); setMessage(null); }}
              className={`nav-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            >
              <ShieldCheck size={18} />
              <span>Profile & Security</span>
            </button>
          </aside>

          {/* Right Main Content */}
          <main className="dashboard-content-area">

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                {/* 4 Metric Stats Cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">Total Orders</span>
                      <div className="stat-icon bg-purple-50 text-purple-600">
                        <ShoppingBag size={18} />
                      </div>
                    </div>
                    <span className="stat-value">{orders.length}</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">Active Orders</span>
                      <div className="stat-icon bg-amber-50 text-amber-600">
                        <Clock size={18} />
                      </div>
                    </div>
                    <span className="stat-value">{activeOrdersCount}</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">Delivered</span>
                      <div className="stat-icon bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                    <span className="stat-value">{deliveredOrdersCount}</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">Saved Addresses</span>
                      <div className="stat-icon bg-blue-50 text-blue-600">
                        <MapPin size={18} />
                      </div>
                    </div>
                    <span className="stat-value">{addresses.length}</span>
                  </div>
                </div>

                {/* Latest Order Real-Time Status Card */}
                {latestOrder ? (
                  <div className="dashboard-card">
                    <div className="dashboard-card-header">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Latest Order Spotlight</span>
                        <h2 className="dashboard-card-title mt-0.5">Order #{latestOrder.orderNumber || latestOrder.id?.slice(-8).toUpperCase()}</h2>
                        <p className="text-xs text-gray-500 mt-1">
                          Placed on {new Date(latestOrder.createdAt).toLocaleDateString()} • {formatPKR(latestOrder.total)}
                        </p>
                      </div>
                      <div>
                        {renderStatusPill(latestOrder.status)}
                      </div>
                    </div>

                    {/* Interactive 5-Step Order Tracker */}
                    <div className="order-tracker-box">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                        <span>Real-Time Status Tracker</span>
                        <Link href="/track-order" className="text-purple-700 hover:underline flex items-center gap-1">
                          Full Tracking <ExternalLink size={12} />
                        </Link>
                      </div>

                      <div className="tracker-steps">
                        <div className="tracker-line">
                          <div 
                            className="tracker-line-fill" 
                            style={{ width: `${(getTimelineStepIndex(latestOrder.status) / 4) * 100}%` }}
                          />
                        </div>

                        {[
                          { title: 'Placed', step: 0 },
                          { title: 'Processing', step: 1 },
                          { title: 'Shipped', step: 2 },
                          { title: 'Out for Delivery', step: 3 },
                          { title: 'Delivered', step: 4 },
                        ].map((s) => {
                          const currentStep = getTimelineStepIndex(latestOrder.status);
                          const isCompleted = currentStep > s.step;
                          const isActive = currentStep === s.step;
                          return (
                            <div 
                              key={s.step} 
                              className={`tracker-step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                            >
                              <div className="tracker-dot">
                                {isCompleted ? '✓' : s.step + 1}
                              </div>
                              <span className="tracker-step-label">{s.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition"
                      >
                        View all orders in history <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-card text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-purple-300 mb-3" />
                    <h3 className="text-lg font-bold text-gray-800">No orders placed yet</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-5">
                      Explore our handcrafted luxury footwear collection and place your first order with Open Parcel Inspection.
                    </p>
                    <Link href="/?view=shop" className="btn-primary" style={{ textDecoration: 'none' }}>
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h2 className="dashboard-card-title">Order History & Real-Time Status</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Securely fetched from /api/orders/my-orders</p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['ALL', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setOrderFilter(filter)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition ${
                          orderFilter === filter 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter.charAt(0) + filter.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    <Clock size={32} className="mx-auto text-purple-400 animate-spin mb-2" />
                    <p className="text-sm">Loading your latest orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Package size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold">No {orderFilter !== 'ALL' ? orderFilter.toLowerCase() : ''} orders found.</p>
                    <p className="text-xs text-gray-400 mt-1">Orders connected to your account will show here.</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {filteredOrders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      const items = Array.isArray(order.items) ? order.items : [];

                      return (
                        <article key={order.id} className="order-card">
                          {/* Order Summary Clickable Bar */}
                          <div 
                            className="order-card-summary-row"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          >
                            <div className="order-meta-info">
                              <div className="order-num-text">
                                <span>Order #{order.orderNumber || order.id?.slice(-8).toUpperCase()}</span>
                                <span className="text-xs font-semibold text-gray-500">
                                  ({items.length} {items.length === 1 ? 'item' : 'items'})
                                </span>
                              </div>
                              <p className="order-date-text">
                                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Total: <strong className="text-gray-900">{formatPKR(order.total)}</strong>
                              </p>
                            </div>

                            <div className="order-badges-wrapper">
                              {renderStatusPill(order.status)}
                              <button 
                                className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition"
                                aria-label="Toggle details"
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </div>
                          </div>

                          {/* Expandable Order Details */}
                          {isExpanded && (
                            <div className="order-details-expanded">
                              
                              {/* Order Items Table */}
                              <div className="order-items-list">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                  Purchased Footwear
                                </span>
                                {items.map((item: any, idx: number) => (
                                  <div key={idx} className="order-item-row">
                                    <div className="order-item-title">
                                      <span>{item.name || item.title || 'Handcrafted Footwear'}</span>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Qty: {item.quantity || 1}
                                        {item.size ? ` • Size: ${item.size}` : ''}
                                        {item.color ? ` • Color: ${item.color}` : ''}
                                      </div>
                                    </div>
                                    <div className="text-right text-xs font-bold text-gray-900 whitespace-nowrap">
                                      {formatPKR((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Order Delivery & Financial Breakdown */}
                              <div className="order-financials-box">
                                <div className="order-address-info">
                                  <span className="font-bold text-gray-800 text-xs uppercase tracking-wide block mb-1">
                                    Delivery Address
                                  </span>
                                  <p className="font-semibold text-gray-900">{order.shippingName}</p>
                                  <p>{order.shippingAddress}</p>
                                  <p>{order.shippingCity}, {order.shippingRegion} {order.shippingPostalCode || ''}</p>
                                  <p className="text-xs text-gray-500 mt-1">Phone: {order.shippingPhone}</p>
                                  <p className="text-xs font-bold text-purple-700 mt-2">
                                    Payment Method: {order.paymentMethod === 'direct' ? 'Bank Transfer (5% OFF)' : 'Cash on Delivery (Open Parcel)'}
                                  </p>
                                </div>

                                <div className="order-breakdown-table">
                                  <span className="font-bold text-gray-800 text-xs uppercase tracking-wide block mb-1">
                                    Payment Summary
                                  </span>
                                  <div className="flex justify-between sm:justify-end gap-4 text-xs text-gray-600">
                                    <span>Subtotal:</span>
                                    <span>{formatPKR(order.subtotal)}</span>
                                  </div>
                                  {order.discountAmount > 0 && (
                                    <div className="flex justify-between sm:justify-end gap-4 text-xs text-green-600 font-semibold">
                                      <span>Discount Applied:</span>
                                      <span>−{formatPKR(order.discountAmount)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between sm:justify-end gap-4 text-xs text-gray-600">
                                    <span>Shipping Fee:</span>
                                    <span>{order.shippingCost > 0 ? formatPKR(order.shippingCost) : 'FREE'}</span>
                                  </div>
                                  <div className="flex justify-between sm:justify-end gap-4 text-sm font-bold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                                    <span>Total Amount:</span>
                                    <span className="text-purple-700">{formatPKR(order.total)}</span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAVED ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h2 className="dashboard-card-title">Saved Delivery Addresses</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your shipping destinations for fast 1-click checkout</p>
                  </div>
                </div>

                <div className="dashboard-form-grid">
                  {/* Address Form (Add / Edit) */}
                  <form onSubmit={handleSaveAddress} className="border border-gray-200 rounded-xl p-5 bg-gray-50/60">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                      {editingAddressId ? <Edit2 size={16} /> : <Plus size={16} />}
                      {editingAddressId ? 'Edit Delivery Address' : 'Add New Address'}
                    </h3>

                    <div className="form-group">
                      <label className="form-label">Address Nickname</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Home, Office, Apartment"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Recipient Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Full Name"
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Contact Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="03XXXXXXXXX"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Street Address & House / Flat #</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Complete street address"
                        value={addressForm.address}
                        onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="City"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Province / Region</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Punjab, Sindh, etc."
                          value={addressForm.region}
                          onChange={(e) => setAddressForm({ ...addressForm, region: e.target.value })}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Postal Code (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="Postal code"
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-4 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      />
                      <span>Set as my default shipping address</span>
                    </label>

                    <div className="flex gap-2">
                      <button type="submit" disabled={saving} className="btn-primary">
                        {editingAddressId ? 'Update Address' : 'Save Address'}
                      </button>
                      {editingAddressId && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingAddressId(null);
                            setAddressForm({
                              label: 'Home',
                              fullName: customer?.name || '',
                              phone: '',
                              address: '',
                              city: '',
                              region: 'Punjab',
                              postalCode: '',
                              isDefault: false,
                            });
                          }} 
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Saved Addresses List */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Current Saved Addresses ({addresses.length})
                    </span>

                    {addresses.length === 0 ? (
                      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs">
                        No saved delivery addresses yet. Add one using the form.
                      </div>
                    ) : (
                      addresses.map((addr) => (
                        <div key={addr.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:border-purple-300 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-900 text-sm">{addr.label}</h4>
                                {addr.isDefault && (
                                  <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-800 font-semibold mt-1">{addr.fullName} • {addr.phone}</p>
                              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                                {addr.address}, {addr.city}, {addr.region} {addr.postalCode || ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setEditingAddressId(addr.id);
                                  setAddressForm({
                                    label: addr.label,
                                    fullName: addr.fullName,
                                    phone: addr.phone,
                                    address: addr.address,
                                    city: addr.city,
                                    region: addr.region,
                                    postalCode: addr.postalCode || '',
                                    isDefault: addr.isDefault,
                                  });
                                }}
                                className="p-1.5 text-gray-500 hover:text-purple-700 rounded-md transition"
                                title="Edit Address"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition"
                                title="Delete Address"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PROFILE & SECURITY */}
            {activeTab === 'security' && (
              <div className="dashboard-form-grid">
                
                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="dashboard-card">
                  <h2 className="dashboard-card-title mb-1">Customer Profile</h2>
                  <p className="text-xs text-gray-500 mb-4">Manage your personal identification details</p>

                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  {profile.email !== customer?.email && (
                    <div className="form-group">
                      <label className="form-label">Current Password (Required to change email)</label>
                      <input 
                        type="password" 
                        required 
                        value={profile.currentPassword}
                        onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  )}

                  <button type="submit" disabled={saving} className="btn-primary mt-2">
                    Save Profile Changes
                  </button>
                </form>

                {/* Password Change Form */}
                <form onSubmit={handleChangePassword} className="dashboard-card">
                  <h2 className="dashboard-card-title mb-1">Update Security Password</h2>
                  <p className="text-xs text-gray-500 mb-4">Ensure your account is protected with a strong password</p>

                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <button type="submit" disabled={saving} className="btn-secondary mt-2">
                    Update Password
                  </button>
                </form>

              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
}
