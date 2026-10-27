/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/app/context/CartContext';
import { AnimatePresence } from 'framer-motion';
import Navbar from './storefront/Navbar';
import SplashScreen from './storefront/SplashScreen';
import Hero from './storefront/Hero';
import TrustBadge from './storefront/TrustBadge';
import TrustBenefits from './storefront/TrustBenefits';
import KidsBanner from './storefront/KidsBanner';
import NewArrivals from './storefront/NewArrivals';
import WomenFavorites from './storefront/WomenFavorites';
import DynamicSaleBanner from './storefront/DynamicSaleBanner';
import MensCollectionBanner from './storefront/MensCollectionBanner';
import MensStylesCarousel from './storefront/MensStylesCarousel';
// import WhyStepAndStyl from './storefront/WhyStepAndStyl';
import DiscoverMore from './storefront/DiscoverMore';
import CustomerReviews from './storefront/CustomerReviews';
import FollowUsSection from './storefront/FollowUsSection';
import AffiliateSection from './storefront/AffiliateSection';
import AffiliatePage from './storefront/AffiliatePage';
import ShopPage from './storefront/ShopPage';
import WomenShopPage from './storefront/WomenShopPage';
import MenShopPage from './storefront/MenShopPage';
import KidsShopPage from './storefront/KidsShopPage';
import CheckoutPage from './storefront/CheckoutPage'; 
import Footer from './storefront/Footer';
import CartDrawer from './storefront/CartDrawer';
import AuthModal from './storefront/AuthModal';
import WhatsAppButton from './components/WhatsAppButton'; 
import ShippingDeliveryPage from './storefront/ShippingDeliveryPage';
import ReturnsExchangesPage from './storefront/ReturnsExchangesPage';
import WishlistPage from './storefront/WishlistPage';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('home');

  // Synchronize initial page from URL query params or restore view
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const view = searchParams.get('view');
    if (view && ['home', 'shop', 'women', 'men', 'kids', 'checkout', 'affiliate', 'shipping-delivery', 'returns-exchanges', 'wishlist'].includes(view)) {
      setCurrentPage(view);
    }

    const handlePopState = (e: PopStateEvent) => {
      const stateView = e.state?.view;
      if (stateView) {
        setCurrentPage(stateView);
      } else {
        const params = new URLSearchParams(window.location.search);
        const currentView = params.get('view');
        if (currentView && ['home', 'shop', 'women', 'men', 'kids', 'checkout', 'affiliate', 'shipping-delivery', 'returns-exchanges', 'wishlist'].includes(currentView)) {
          setCurrentPage(currentView);
        } else {
          setCurrentPage('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // History-aware page navigation
  const handleNavigatePage = (page: string) => {
    setCurrentPage(page);
    try {
      if (typeof window !== 'undefined') {
        const newUrl = page === 'home' ? window.location.pathname : `?view=${page}`;
        window.history.pushState({ view: page }, '', newUrl);
      }
    } catch {
      // Fallback
    }
  };
  const [showSplash, setShowSplash] = useState(true);
  
  const { items: cartItems, addItem, removeItem, updateQuantity, clearCart, isCartOpen, setIsCartOpen } = useCart();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'signup'>('login');

  // Automatically reset scroll to top on every page view transition using requestAnimationFrame to ensure DOM is fully ready
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 0);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const handleOpenAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  const handleAddToCart = (productWithSpecs: any) => {
    addItem({
      id: productWithSpecs.id,
      title: productWithSpecs.title,
      price: productWithSpecs.price,
      image: productWithSpecs.image || productWithSpecs.images?.[0] || '',
      size: productWithSpecs.size || productWithSpecs.selectedSize || undefined,
      color: productWithSpecs.color || productWithSpecs.selectedColor || undefined
    }, productWithSpecs.quantity || 1);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const item = cartItems[index];
    if (item) {
      updateQuantity(item.id, newQty, item.size, item.color);
    }
  };

  const handleRemoveItem = (index: number) => {
    const item = cartItems[index];
    if (item) {
      removeItem(item.id, item.size, item.color);
    }
  };

  useEffect(() => {
    const splashSeen = sessionStorage.getItem('splashSeen');
    if (splashSeen) setShowSplash(false);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashSeen', 'true');
  };

  return (
    <div className="relative overflow-x-hidden font-sans">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      {/* Top announcement bar & Nav bar sequence */}
      <Navbar 
        setCurrentPage={handleNavigatePage} 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenSearch={() => {}}
      />

      <main className="flex flex-col">
        {currentPage === 'home' ? (
          <>
            {/* 1. Hero section */}
            <Hero setCurrentPage={handleNavigatePage} />
            
            {/* 2. Trust badge (purple ticker) */}
            <TrustBadge />

            {/* 3. Women favorite */}
            <WomenFavorites setCurrentPage={handleNavigatePage} />

            {/* 4. Affiliate program */}
            <AffiliateSection setCurrentPage={handleNavigatePage} />

            {/* 5. Flash sale */}
            <DynamicSaleBanner setCurrentPage={handleNavigatePage} />

            {/* 6. Kids favorite */}
            <KidsBanner setCurrentPage={handleNavigatePage} />

            {/* 7. Trust Benefits banner placed right under Kids Banner with clean spacing */}
            <div className="mt-4">
              <TrustBenefits setCurrentPage={handleNavigatePage} />
            </div>

            {/* 8. Men Collection & styles carousel */}
            <MensCollectionBanner setCurrentPage={handleNavigatePage} />
            <MensStylesCarousel setCurrentPage={handleNavigatePage} />

            {/* 9. High demand products */}
            <div id="new-arrivals-section">
              <NewArrivals setCurrentPage={handleNavigatePage} />
            </div>

            {/* 10. Costumer review */}
            <CustomerReviews />
            <DiscoverMore setCurrentPage={handleNavigatePage} />

            {/* 11. Follow us */}
            <FollowUsSection />
          </>
        ) : currentPage === 'shop' ? (
          <ShopPage setCurrentPage={handleNavigatePage} onAddToCart={handleAddToCart} />
        ) : currentPage === 'women' ? (
          <WomenShopPage onAddToCart={handleAddToCart} setCurrentPage={handleNavigatePage} />
        ) : currentPage === 'men' ? (
          <MenShopPage onAddToCart={handleAddToCart} setCurrentPage={handleNavigatePage} />
        ) : currentPage === 'kids' ? (
          <KidsShopPage onAddToCart={handleAddToCart} setCurrentPage={handleNavigatePage} />
        ) : currentPage === 'checkout' ? (
          <CheckoutPage 
            cartItems={cartItems} 
            setCurrentPage={handleNavigatePage} 
            onOrderSuccess={() => {
              clearCart(); 
            }}
          />
        ) : currentPage === 'affiliate' ? (
          <AffiliatePage />
        ) : currentPage === 'shipping-delivery' ? (
          <ShippingDeliveryPage setCurrentPage={handleNavigatePage} />
        ) : currentPage === 'returns-exchanges' ? (
          <ReturnsExchangesPage setCurrentPage={handleNavigatePage} />
        ) : currentPage === 'wishlist' ? (
          <WishlistPage setCurrentPage={handleNavigatePage} onAddToCart={handleAddToCart} />
        ) : (
          <div className="dynamic-page-view px-6 py-20 text-center">
            <h1 className="text-3xl font-bold">{currentPage.toUpperCase()} COLLECTION</h1>
            <p className="mt-2 text-gray-600">Explore premium luxury items curated for {currentPage}.</p>
            <button className="mt-6 rounded-full bg-black px-6 py-2.5 text-white" onClick={() => handleNavigatePage('home')}>
              Back to Home
            </button>
          </div>
        )}
      </main>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        setCurrentPage={handleNavigatePage}
      />

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
      />

      {/* WhatsApp button only renders when splash screen is done */}
      {!showSplash && <WhatsAppButton />}

      {/* Footer */}
      <Footer setCurrentPage={handleNavigatePage} />
    </div>
  );
}