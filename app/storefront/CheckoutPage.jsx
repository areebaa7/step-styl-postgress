/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowLeft, ShieldCheck, Truck, CreditCard, X, Percent } from 'lucide-react';
import './CheckoutPage.css';

const regionsList = [
  'Azad Jammu and Kashmir',
  'Balochistan',
  'Gilgit Baltistan',
  'Islamabad Capital Territory',
  'KPK',
  'Punjab',
  'Sindh',
];

/**
 * @param {{ cartItems: any[], setCurrentPage: Function, onOrderSuccess: Function }} props
 */
export default function CheckoutPage({ cartItems = [], setCurrentPage, onOrderSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    region: 'Punjab',
    postalCode: '',
    saveInfo: false,
    paymentMethod: 'COD', // 'COD' or 'ONLINE'
    receiptUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [showBankOfferModal, setShowBankOfferModal] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Show the 5% bank transfer offer popup automatically when loading checkout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBankOfferModal(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Ensure view smoothly scrolls to top when order completes or success state mounts
  useEffect(() => {
    if (successOrder) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [successOrder]);

  // Dynamic cart calculations
  const subtotal = cartItems.reduce((acc, item) => {
    const cleanPrice = Number(item.price) || 0;
    return acc + cleanPrice * (Number(item.quantity) || 1);
  }, 0);

  const discountAmount = formData.paymentMethod === 'ONLINE' ? (subtotal * 0.05) : 0;
  const shippingCost = formData.paymentMethod === 'ONLINE' ? 0 : 350.00; // Free shipping + 5% off for online
  const total = Math.max(0, subtotal - discountAmount) + shippingCost;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (formData.paymentMethod === 'ONLINE' && !formData.receiptUrl) {
      setError('Please upload your payment receipt to continue.');
      return;
    }

    setLoading(true);

    try {
      const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.random().toString(36).substring(2, 9)}`;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          shippingAddress: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            postalCode: formData.postalCode,
            newsletters: formData.saveInfo,
          },
          shippingRegion: formData.region,
          shippingCity: formData.city,
          paymentMethod: formData.paymentMethod === 'ONLINE' ? 'direct' : 'cod',
          receiptUrl: formData.paymentMethod === 'ONLINE' ? formData.receiptUrl : undefined,
          items: cartItems.map(item => ({
            id: String(item.id || item.productId || ''),
            name: item.title || item.name || 'Product',
            price: Number(String(item.price).replace(/[^0-9.]/g, '')),
            quantity: Math.min(100, Math.max(1, parseInt(item.quantity, 10) || 1)),
            size: item.selectedSize || item.size || null,
            color: item.selectedColor || item.color || null,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order. Please verify your details.');
      }

      setSuccessOrder(data.data || data.order || { id: 'SUCCESS' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (onOrderSuccess) onOrderSuccess(data.data || data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setTimeout(() => {
        const errorBanner = document.querySelector('.checkout-alert-error');
        if (errorBanner) {
          errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setError('');
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/uploads/receipt', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload receipt');
      }
      setFormData(prev => ({ ...prev, receiptUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingReceipt(false);
    }
  };

  if (successOrder) {
    return (
      <div className="checkout-page-container success-state">
        <motion.div 
          className="order-success-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle size={64} className="success-icon" />
          <h1>Thank you for your order!</h1>
          <p>Your order has been placed successfully.</p>
          <div className="success-actions">
            <button className="btn-return-home" onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); setCurrentPage('home'); }}>
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-header-nav">
        <button className="back-to-shop-btn" onClick={() => setCurrentPage('shop')}>
          <ArrowLeft size={16} /> Return to cart
        </button>
        <span className="checkout-brand-title">Step &amp; Styl Secure Checkout</span>
      </div>

      <div className="checkout-content-grid">
        {/* Left Column: Shipping & Payment Form */}
        <div className="checkout-form-column">
          <form onSubmit={handleSubmitOrder} className="dedicated-checkout-form">
            
            {error && <div className="checkout-alert-error">{error}</div>}

            {/* Contact Section */}
            <div className="checkout-section-block">
              <div className="block-title-row">
                <h3>Contact</h3>
                <span className="signin-link" onClick={() => setCurrentPage('home')}>Sign in</span>
              </div>
              <input 
                type="email" 
                placeholder="Email address (for tracking & updates)" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <label className="checkbox-news-label">
                <input type="checkbox" defaultChecked /> Email me with news and offers
              </label>
            </div>

            {/* Delivery Section */}
            <div className="checkout-section-block">
              <h3>Delivery</h3>
              
              <div className="form-group-full">
                <label>Select Region / Province</label>
                <select 
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  required
                >
                  {regionsList.map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              <div className="form-row-grid">
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
                placeholder="Street Address, Apartment, Suite, etc. *" 
                required 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />

              <div className="form-row-grid triplet">
                <input 
                  type="text" 
                  placeholder="City *" 
                  required 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Postal Code (Optional)" 
                  value={formData.postalCode}
                  onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                />
              </div>

              <label className="checkbox-news-label">
                <input 
                  type="checkbox" 
                  checked={formData.saveInfo}
                  onChange={(e) => setFormData({...formData, saveInfo: e.target.checked})}
                /> Save this information for next time
              </label>
            </div>

            {/* Delivery Cost Method */}
            <div className="checkout-section-block">
              <h3>Delivery Cost</h3>
              <div className="delivery-method-card selected">
                <div className="method-info">
                  <Truck size={20} />
                  <div>
                    <strong>Standard Delivery</strong>
                    <p>Usually 3-5 business days (Open Parcel Inspection)</p>
                  </div>
                </div>
                <span className="method-price">
                  {formData.paymentMethod === 'ONLINE' ? 'Free' : 'Rs.350.00'}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-section-block">
              <h3>Payment Method</h3>
              <p className="payment-secure-note">All transactions are secure and encrypted.</p>
              
              <div className="payment-options-group">
                <div className={`payment-option-card ${formData.paymentMethod === 'COD' ? 'active' : ''}`} onClick={() => setFormData({...formData, paymentMethod: 'COD'})} style={{ cursor: 'pointer' }}>
                  <div className="radio-flex">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={formData.paymentMethod === 'COD'}
                      onChange={() => setFormData({...formData, paymentMethod: 'COD'})}
                    />
                    <span>Cash on Delivery</span>
                  </div>
                  <p className="payment-subtext">Please have the exact amount ready. Open parcel check allowed before paying.</p>
                </div>

                <div className={`payment-option-card ${formData.paymentMethod === 'ONLINE' ? 'active' : ''}`} onClick={() => setFormData({...formData, paymentMethod: 'ONLINE'})} style={{ cursor: 'pointer' }}>
                  <div className="radio-flex" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={formData.paymentMethod === 'ONLINE'}
                        onChange={() => setFormData({...formData, paymentMethod: 'ONLINE'})}
                      />
                      <span>Online Payment (Bank Transfer / Easy Paisa / Jazz Cash)</span>
                    </div>
                    <span className="bank-discount-badge" style={{ backgroundColor: '#7C3AED', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      <Percent size={10} style={{ display: 'inline' }} /> 5% OFF & FREE SHIPPING
                    </span>
                  </div>
                  
                  {formData.paymentMethod === 'ONLINE' && (
                    <div className="manual-payment-details" onClick={(e) => e.stopPropagation()}>
                      <div className="bank-info-box">
                        <h4>Meezan Bank</h4>
                        <p><strong>Title:</strong> ANISA SHAHID</p>
                        <p><strong>Account No:</strong> 9814 0112796881</p>
                        <p><strong>IBAN:</strong> PK66 MEZN 0098 1401 1279 6881</p>
                        <hr />
                        <h4>EasyPaisa / JazzCash</h4>
                        <p><strong>Number:</strong> +92-332-9822592</p>
                      </div>

                      <div className="receipt-upload-box">
                        <p className="upload-label">Upload Payment Receipt *</p>
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/webp" 
                          onChange={handleReceiptUpload} 
                          disabled={uploadingReceipt}
                        />
                        {uploadingReceipt && <span className="uploading-text">Uploading...</span>}
                        {formData.receiptUrl && <div className="upload-success">✓ Receipt uploaded successfully!</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="checkout-alert-error mb-4" style={{ marginTop: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button type="submit" className="complete-order-btn flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white inline-block mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Processing Order...</span>
                </>
              ) : (
                'Complete Order'
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Dynamic Cart Summary Sidebar */}
        <div className="checkout-summary-column">
          <div className="summary-sticky-box">
            <h3>Order Summary ({cartItems.length} items)</h3>
            
            <div className="summary-items-scroll">
              {cartItems.map((item, idx) => {
                const itemSize = item.selectedSize || item.size;
                const itemColor = item.selectedColor || item.color;
                return (
                  <div key={idx} className="summary-item-row">
                    <div className="item-img-wrap">
                      <img src={item.image} alt={item.title || item.name} />
                      <span className="item-qty-badge">{item.quantity || 1}</span>
                    </div>
                    <div className="item-details-wrap">
                      <h4>{item.title || item.name}</h4>
                      <p>
                        {itemSize ? `Size: ${itemSize}` : ''} 
                        {itemSize && itemColor ? ' | ' : ''}
                        {itemColor ? `Color` : ''}
                      </p>
                    </div>
                    <span className="item-total-price">
                      Rs.{((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="summary-totals-breakdown">
              <div className="line"><span>Subtotal</span> <span>Rs.{subtotal.toLocaleString()}</span></div>
              {formData.paymentMethod === 'ONLINE' && (
                <div className="line" style={{ color: '#059669', fontWeight: '600' }}>
                  <span>Online Discount (5%)</span> 
                  <span>- Rs.{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="line">
                <span>Shipping</span> 
                <span>{shippingCost === 0 ? 'Free' : `Rs.${shippingCost.toLocaleString()}`}</span>
              </div>
              <div className="line total-row"><span>Total</span> <span className="grand-total">Rs.{total.toLocaleString()}</span></div>
            </div>

            <div className="checkout-trust-badge">
              <ShieldCheck size={18} />
              <span>Secure 256-Bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5% Bank Transfer Popup Modal */}
      <AnimatePresence>
        {showBankOfferModal && (
          <div className="bank-offer-modal-overlay" onClick={() => setShowBankOfferModal(false)}>
            <motion.div 
              className="bank-offer-modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <button className="bank-offer-close-btn" onClick={() => setShowBankOfferModal(false)}>
                <X size={20} />
              </button>

              <div className="bank-offer-icon-box">
                <CreditCard size={32} />
              </div>

              <span className="bank-offer-badge">Special Checkout Offer</span>
              <h3>Get 5% OFF & Free Shipping!</h3>
              <p>
                Select <strong>Online Payment (Bank Transfer / Easy Paisa / Jazz Cash)</strong> to instantly save <strong>5% extra</strong> and unlock <strong>Free Delivery</strong> on your order.
              </p>

              <button 
                className="bank-offer-cta-btn" 
                onClick={() => {
                  setFormData(prev => ({ ...prev, paymentMethod: 'ONLINE' }));
                  setShowBankOfferModal(false);
                }}
              >
                Apply 5% Off Now
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
