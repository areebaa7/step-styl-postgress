/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Percent } from 'lucide-react';
import './CheckoutModal.css';

export default function CheckoutModal({ isOpen, onClose, cartItems, onOrderSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    paymentMethod: 'COD', // 'COD' or 'BANK'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => {
    const cleanPrice = Number(item.price) || 0;
    return acc + cleanPrice * (item.quantity || 1);
  }, 0);

  const shippingCost = 0; // Free delivery

  // Apply 5% discount if Bank Transfer is selected
  const isBankTransfer = formData.paymentMethod === 'BANK';
  const discountAmount = isBankTransfer ? subtotal * 0.05 : 0;
  const total = subtotal - discountAmount + shippingCost;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          region: formData.region,
          postalCode: formData.postalCode,
          paymentMethod: formData.paymentMethod,
          discountApplied: discountAmount,
          totalAmount: total,
          items: cartItems.map(item => ({
            productId: item.id,
            name: item.title,
            price: Number(String(item.price).replace(/[^0-9.]/g, '')),
            quantity: item.quantity || 1,
            size: item.selectedSize,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order. Please check your details.');
      }

      setSuccessOrder(data.order || { id: 'SUCCESS' });
      const modalBox = document.querySelector('.checkout-modal-content');
      if (modalBox) modalBox.scrollTo({ top: 0, behavior: 'smooth' });
      if (onOrderSuccess) onOrderSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="checkout-close-btn" onClick={onClose}><X size={20} /></button>
        
        {successOrder ? (
          <div className="order-success-box">
            <CheckCircle size={50} color="#10B981" />
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for shopping with Step & Styl. Your order is confirmed with Open Parcel inspection enabled.</p>
            <button className="btn-close-success" onClick={onClose}>Continue Shopping</button>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="checkout-form">
            <h2>Checkout & Shipping Details</h2>
            <p className="checkout-sub">Open Parcel Then Pay enabled on all orders!</p>

            {error && <div className="checkout-error">{error}</div>}

            <div className="form-row">
              <input 
                type="text" 
                placeholder="Full Name *" 
                required 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
              />
              <input 
                type="tel" 
                placeholder="Phone Number (e.g. 03001234567) *" 
                required 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              />
            </div>

            <input 
              type="text" 
              placeholder="Complete Street Address *" 
              required 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
            />

            <div className="form-row">
              <input 
                type="text" 
                placeholder="City *" 
                required 
                value={formData.city} 
                onChange={(e) => setFormData({...formData, city: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="Region / Province *" 
                required 
                value={formData.region} 
                onChange={(e) => setFormData({...formData, region: e.target.value})} 
              />
            </div>

            {/* Payment Method Selector with 5% Discount Option */}
            <div className="payment-methods-selection">
              <label className={`payment-method-card ${formData.paymentMethod === 'COD' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={formData.paymentMethod === 'COD'}
                  onChange={() => setFormData({...formData, paymentMethod: 'COD'})}
                />
                <div className="payment-method-info">
                  <strong>Cash on Delivery (Open Parcel)</strong>
                  <span>Inspect order before paying</span>
                </div>
              </label>

              <label className={`payment-method-card bank-transfer-card ${formData.paymentMethod === 'BANK' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={formData.paymentMethod === 'BANK'}
                  onChange={() => setFormData({...formData, paymentMethod: 'BANK'})}
                />
                <div className="payment-method-info">
                  <div className="bank-title-row">
                    <strong>Direct Bank Transfer</strong>
                    <span className="bank-discount-badge"><Percent size={12} /> 5% OFF</span>
                  </div>
                  <span>Get extra discount on direct payment</span>
                </div>
              </label>
            </div>

            <div className="checkout-summary-box">
              <div className="summary-line"><span>Subtotal:</span> <span>Rs.{subtotal.toLocaleString()}</span></div>
              {isBankTransfer && (
                <div className="summary-line discount-line">
                  <span>Bank Transfer Discount (5%):</span> 
                  <span className="discount-val">-Rs.{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="summary-line"><span>Shipping:</span> <span className="free-text">FREE</span></div>
              <div className="summary-line total"><span>Total Amount:</span> <span>Rs.{total.toLocaleString()}</span></div>
            </div>

            <button type="submit" className="place-order-btn" disabled={loading}>
              {loading ? 'Processing Order...' : `Place Order (Rs.${total.toLocaleString()})`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
