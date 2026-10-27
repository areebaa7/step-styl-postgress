/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { MessageCircle, CreditCard, ShieldCheck } from 'lucide-react';
import './Footer.css';

export default function Footer({ setCurrentPage }) {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        {/* Column 1 — Brand Info & Socials */}
        <div className="footer-column">
          <div className="footer-brand-header" onClick={() => setCurrentPage('home')}>
            <img src="/assets/step&styl-newlogo.png" alt="Step & Styl Logo" className="footer-logo-img" />
            <span className="footer-brand-title">
              <span className="footer-brand-purple">Step</span>
              <span className="footer-brand-purple"> & Styl</span>
            </span>
          </div>
          <p className="footer-description">
            Modern footwear for every style, occasion and step.
          </p>
          <div className="footer-socials">
            {/* Instagram */}
            <a 
              href="https://www.instagram.com/step_andstyl?igsh=dHZ0dG1qdjFoaG55" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram" 
              className="social-icon-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            {/* TikTok */}
            <a 
              href="https://www.tiktok.com/@stepandstyl?_r=1&_t=ZN-97XWqWqSZnu" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="TikTok" 
              className="social-icon-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
              </svg>
            </a>

            {/* Facebook */}
            <a 
              href="https://www.facebook.com/profile.php?id=61588784750967" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Facebook" 
              className="social-icon-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>

            {/* WhatsApp */}
            <a 
              href="https://wa.me/923329822592" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="WhatsApp" 
              className="social-icon-btn"
            >
              <MessageCircle size={16} />
            </a>
          </div>
        </div>

        {/* Column 2 — Shop */}
        <div className="footer-column">
          <h3 className="footer-heading">Shop</h3>
          <ul className="footer-links">
            <li onClick={() => setCurrentPage('women')}>Women</li>
            <li onClick={() => setCurrentPage('men')}>Men</li>
            <li onClick={() => setCurrentPage('kids')}>Kids</li>
            <li onClick={() => setCurrentPage('home')}>New Arrivals</li>
            <li onClick={() => setCurrentPage('shop')}>Sale</li>
          </ul>
        </div>

        {/* Column 3 — Customer Care */}
        <div className="footer-column">
          <h3 className="footer-heading">Customer Care</h3>
          <ul className="footer-links">
            <li onClick={() => window.open('https://wa.me/923329822592', '_blank')}>Contact Us</li>
            <li onClick={() => setCurrentPage('shipping-delivery')}>Shipping Information</li>
            <li onClick={() => setCurrentPage('returns-exchanges')}>Returns & Exchange</li>
            <li onClick={() => setCurrentPage('shop')}>FAQs</li>
            <li onClick={() => setCurrentPage('shop')}>Size Guide</li>
          </ul>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© 2026 Step & Styl. All rights reserved.</p>
          
          <div className="footer-payment-methods">
            <span className="payment-badge"><CreditCard size={14} /> Direct Bank Transfer (5% Off)</span>
            <span className="payment-badge"><ShieldCheck size={14} /> Cash on Delivery (Check Before Payment)</span>
          </div>

          <div className="footer-support-info">
            <span>Support: +92 332 9822592</span>
          </div>
        </div>
      </div>
    </footer>
  );
}