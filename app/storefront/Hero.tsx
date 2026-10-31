/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Hero.css';

const heroMedia = [
  {
    type: 'image',
    url: '/assets/banner.jpg',
    mobileUrl: '/assets/mobile-banner.jpg',
    target: 'shop',
    btnLabel: 'EXPLORE FOOTWEAR',
  },
  {
    type: 'image',
    url: '/assets/mens-banner.jpg',
    mobileUrl: '/assets/mens-mobile.jpg',
    target: 'men',
    btnLabel: 'SHOP MEN',
  },
  {
    type: 'image',
    url: '/assets/women-banner.jpg',
    mobileUrl: '/assets/mobile-banner2.jpg',
    target: 'women',
    btnLabel: 'SHOP WOMEN',
  },
  {
    type: 'image',
    url: '/assets/kids-banner.jpg',
    mobileUrl: '/assets/kids-mobile.jpg',
    target: 'kids',
    btnLabel: 'SHOP KIDS',
  },
];

interface HeroProps {
  setCurrentPage: (page: string) => void;
}

export default function Hero({ setCurrentPage }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Robust auto-slide timer that cycles through items seamlessly
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMedia.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentMedia = heroMedia[currentIndex];

  return (
    <section className="hero-section">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          className="hero-slide active cursor-pointer"
          onClick={() => setCurrentPage(currentMedia.target || 'shop')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Desktop Banner Image */}
          <img src={currentMedia.url} alt="Hero Banner Desktop" className="hero-media desktop-banner" />
          
          {/* Dedicated Mobile Banner Image */}
          <img src={currentMedia.mobileUrl || currentMedia.url} alt="Hero Banner Mobile" className="hero-media mobile-banner" />

          <div className="hero-overlay">
            <div className="hero-content">
              <div className="hero-text-group">
                <div className="hero-buttons">
                  <motion.button 
                    className="btn-shop-now" 
                    onClick={() => setCurrentPage('shop')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    SHOP NOW
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Carousel Indicator Dots */}
      <div className="carousel-dots">
        {heroMedia.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`dot ${currentIndex === index ? 'active' : ''}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}