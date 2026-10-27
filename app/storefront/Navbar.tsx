/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '@/app/context/WishlistContext';
import LiveSearchBar from '@/app/components/LiveSearchBar';
import './Navbar.css';

export default function Navbar({ 
  setCurrentPage, 
  cartCount = 0, 
  wishlistCount = 0, 
  onOpenCart, 
  onOpenAuthModal,
  onOpenSearch 
}: {
  setCurrentPage: (page: string) => void;
  cartCount?: number;
  wishlistCount?: number;
  onOpenCart: () => void;
  onOpenAuthModal: (tab: 'login' | 'signup') => void;
  onOpenSearch?: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const { totalCount: liveWishlistCount } = useWishlist();
  const effectiveWishlistCount = liveWishlistCount ?? wishlistCount;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (data.user) {
          setAuthUser(data.user);
        }
      } catch {
        // Ignore
      }
    };
    fetchCurrentUser();
  }, []);

  const handleNavClick = (page: string, sectionId?: string) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);

    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 250);
    }
  };

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
    if (onOpenSearch) onOpenSearch();
  };

  return (
    <header className="navbar-wrapper">
      {/* Top Announcement Bar */}
      <div className="promo-ticker-strip">
        <div className="ticker-track">
          <span>Nationwide Fast Delivery &bull; 5% OFF on Bank Transfer</span>
          <span>Nationwide Fast Delivery &bull; 5% OFF on Bank Transfer</span>
          <span>Nationwide Fast Delivery &bull; 5% OFF on Bank Transfer</span>
        </div>
      </div>

      <nav className="navbar">
        <div className="navbar-container">
          
          {/* LEFT: Logo & Mobile Toggle */}
          <div className="nav-left">
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="nav-brand" onClick={() => handleNavClick('home')}>
              <img src="/assets/step&styl-newlogo.png" alt="Step & Styl Logo" className="brand-logo-img" />
              <span className="brand-name">Step & Styl</span>
            </div> 
          </div>

          {/* CENTER: Navigation Links */}
          <div className="nav-center desktop-nav">
            <button onClick={() => handleNavClick('women')} className="nav-link-btn">Women</button>
            <button onClick={() => handleNavClick('men')} className="nav-link-btn">Men</button>
            <button onClick={() => handleNavClick('kids')} className="nav-link-btn">Kids</button>
            <button onClick={() => handleNavClick('home', 'new-arrivals-section')} className="nav-link-btn">New Arrivals</button>
            <button onClick={() => handleNavClick('home', 'flash-sale-section')} className="sale-link">Sale</button>
          </div>

          {/* RIGHT: Search, Account, Wishlist, Cart Icons */}
          <div className="nav-right">
            <button className="icon-btn" aria-label="Search" onClick={handleSearchToggle} title="Search">
              <Search size={20} />
            </button>
            <button className="icon-btn" aria-label="Account" onClick={() => onOpenAuthModal('login')} title="Account">
              <User size={20} />
            </button>
            <button className="icon-btn" aria-label="Wishlist" onClick={() => handleNavClick('wishlist')} title="Wishlist">
              <Heart size={20} />
              {effectiveWishlistCount > 0 && <span className="badge">{effectiveWishlistCount}</span>}
            </button>
            
            <button id="cart-icon" className="icon-btn cart-wrapper" aria-label="Cart" onClick={onOpenCart} title="Cart">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </button>
          </div>

        </div>

        {/* Live Global Search Modal Overlay */}
        <LiveSearchBar 
          isOpen={searchOpen} 
          onClose={() => setSearchOpen(false)} 
        />

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-menu-drawer"
              initial={{ opacity: 0, x: '-100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '-100%' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Top Drawer Header with Close Button */}
              <div className="mobile-drawer-header">
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="mobile-close-icon-btn"
                  aria-label="Close Menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Login Button Placed at the TOP of the Mobile Drawer */}
              <div className="mobile-drawer-top-login">
                <button 
                  onClick={() => { onOpenAuthModal('login'); setMobileMenuOpen(false); }} 
                  className="mobile-drawer-login-btn-top"
                >
                  <User size={18} />
                  <span>Login / Register</span>
                </button>
              </div>

              {/* Navigation Links List */}
              <div className="mobile-drawer-links">
                <button onClick={() => handleNavClick('home', 'new-arrivals-section')} className="mobile-drawer-row">
                  <span>New Arrivals</span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
                
                <button onClick={() => handleNavClick('men')} className="mobile-drawer-row">
                  <span>Men</span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>

                <button onClick={() => handleNavClick('women')} className="mobile-drawer-row">
                  <span>Women</span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>

                <button onClick={() => handleNavClick('kids')} className="mobile-drawer-row">
                  <span>Kids</span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>

                <button onClick={() => handleNavClick('home', 'flash-sale-section')} className="mobile-drawer-row sale-row">
                  <span>Sale</span>
                  <ChevronRight size={18} className="text-red-400" />
                </button>

                <button onClick={() => handleNavClick('affiliate')} className="mobile-drawer-row">
                  <span>Affiliate Program</span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
