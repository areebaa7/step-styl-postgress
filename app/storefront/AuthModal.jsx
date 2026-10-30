/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasAdminKey, setHasAdminKey] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResetMessage('');
    if (!email) {
      setErrorMessage('Please enter your email first.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send reset email.');
      setResetMessage(data.message || 'Password reset email sent.');
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (activeTab === 'signup' && password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'login' || activeTab === 'admin') {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          throw new Error('Server returned an unexpected response (Status ' + response.status + '). Please try again.');
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Invalid email or password.');
        }

        if (activeTab === 'login' && data.user && data.user.role === 'ADMIN') {
          await fetch('/api/auth/logout', { method: 'POST' });
          throw new Error('Please use the Admin Login form for administrative access.');
        }
        if (activeTab === 'admin' && data.user && data.user.role !== 'ADMIN') {
          await fetch('/api/auth/logout', { method: 'POST' });
          throw new Error('Access denied. Administrator privileges required.');
        }

        if (data.user && data.user.role === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/account';
        }
      } else {
        const payload = {
          email: email.trim(),
          password,
          name: fullName.trim(),
          ...(hasAdminKey && adminKey.trim() ? { adminKey: adminKey.trim() } : {}),
        };

        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          throw new Error('Server returned an unexpected response (Status ' + response.status + '). Please try again.');
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to create account.');
        }

        if (hasAdminKey || (data.user && data.user.role === 'ADMIN')) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/account';
        }
      }

      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <motion.div 
        className="auth-modal-content w-full max-w-full box-border"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-tabs w-full">
          <button 
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('login'); setErrorMessage(''); setIsForgotPassword(false); }}
          >
            Login
          </button>
          <button 
            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('signup'); setErrorMessage(''); setIsForgotPassword(false); }}
          >
            Sign Up
          </button>
          <button 
            className={`auth-tab-btn ${activeTab === 'admin' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('admin'); setErrorMessage(''); setIsForgotPassword(false); }}
          >
            Admin
          </button>
        </div>

        <div className="auth-form-scroll-area w-full box-border">
          {errorMessage && (
            <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '10px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500, boxSizing: 'border-box', width: '100%' }}>
              {errorMessage}
            </div>
          )}
          {resetMessage && (
            <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '10px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500, boxSizing: 'border-box', width: '100%' }}>
              {resetMessage}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleSubmit} className="auth-form w-full">
              <h2>Customer Sign In</h2>
              <p className="auth-subtitle">Access your account to complete purchases or manage orders.</p>
              
              <div className="form-group w-full">
                <label>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {!isForgotPassword ? (
                <>
                  <div className="form-group w-full">
                    <label>Password</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="Enter your password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setIsForgotPassword(true)} style={{ background: 'none', border: 'none', color: '#A855F7', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer', textAlign: 'right', display: 'block', width: '100%' }}>
                      Forgot password?
                    </button>
                  </div>
                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? 'Logging in...' : 'Customer Sign In'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={handleForgotPassword} className="auth-submit-btn" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Email'}
                  </button>
                  <button type="button" onClick={() => { setIsForgotPassword(false); setResetMessage(''); setErrorMessage(''); }} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'center' }}>
                    Back to Login
                  </button>
                </>
              )}
              
              <p className="auth-terms">
                By continuing you agree to our <strong>terms of service</strong>. Users can browse products without logging in, but an account is required for purchases.
              </p>
            </form>
          ) : activeTab === 'admin' ? (
            <form onSubmit={handleSubmit} className="auth-form w-full">
              <h2>Admin Sign In</h2>
              <p className="auth-subtitle">Log in to access the store management dashboard.</p>
              
              <div className="form-group w-full">
                <label>Admin Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="admin@stepandstyl.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group w-full">
                <label>Admin Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Enter admin password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading} style={{ backgroundColor: '#DC2626' }}>
                {loading ? 'Logging in...' : 'Admin Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form w-full">
              <h2>Create Account</h2>
              <p className="auth-subtitle">Join Step &amp; Styl for checkout and exclusive offers.</p>

              <div className="form-group w-full">
                <label>Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="john doe" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group w-full">
                <label>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group w-full">
                <label>Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Create a strong password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="password-hint">Use at least 8 characters combining letters and numbers.</span>
              </div>

              <div className="form-group w-full">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Re-enter your password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="form-group checkbox-group w-full">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={hasAdminKey} 
                    onChange={(e) => setHasAdminKey(e.target.checked)} 
                  />
                  <span>I have an administrative key</span>
                </label>
              </div>

              {hasAdminKey && (
                <div className="form-group admin-key-box w-full box-border">
                  <label><Shield size={14} /> Administrative Key</label>
                  <input 
                    type="password" 
                    placeholder="Enter admin secret key" 
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                  />
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>

              <p className="auth-terms">
                By continuing you agree to our <strong>terms of service</strong>. Users can browse products without logging in, but an account is required for purchases or admin access.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}