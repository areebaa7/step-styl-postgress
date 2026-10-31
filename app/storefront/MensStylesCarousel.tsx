/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './MensStylesCarousel.css';

export default function MensStylesCarousel({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMenProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const json = await res.json();
        
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Precise filter to capture Men's products from the admin panel database
          const menItems = json.data.filter((item: any) => {
            const cat = (item.category || item.tag || '').toLowerCase();
            const name = (item.name || item.title || '').toLowerCase();
            const gender = (item.gender || '').toLowerCase();

            // Explicitly check for women's keywords to filter them out
            const isWomenProduct = 
              cat.includes('women') || 
              cat.includes('female') || 
              cat.includes('ladies') || 
              cat.includes('girl') || 
              name.includes('women') || 
              name.includes('ladies') || 
              name.includes('pink') || 
              gender.includes('women') ||
              gender.includes('female');

            if (isWomenProduct) return false;

            // Match explicit men indicators or general footwear styles
            const isMenProduct = 
              cat.includes('men') || 
              gender.includes('men') || 
              name.includes('men') ||
              cat.includes('gents') ||
              cat.includes('oxford') || 
              cat.includes('derby') || 
              cat.includes('loafer') ||
              cat.includes('sneaker') ||
              cat.includes('formal');

            return isMenProduct;
          });

          if (menItems.length > 0) {
            const formatted = menItems.map((item: any) => {
              let rawImage = item.image || item.imageUrl || '/logo_main.png';
              if (typeof rawImage === 'string') {
                rawImage = rawImage.replace(/\\/g, '/');
                if (rawImage.includes('placeholder') || rawImage.trim() === '') {
                  rawImage = '/logo_main.png';
                } else if (!rawImage.startsWith('http') && !rawImage.startsWith('/')) {
                  rawImage = '/' + rawImage;
                }
              }

              return {
                id: item.id,
                title: item.name || item.title || 'Men Footwear',
                price: item.salePrice || item.price || '0',
                image: rawImage
              };
            });
            setProducts(formatted);
          }
        }
      } catch (err) {
        console.error('Failed to load products for Men styles carousel:', err);
      }
    }
    fetchMenProducts();
  }, []);

  const formatPrice = (val: string | number) => Number(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Triple the array to create a smooth, seamless infinite loop animation track only if products exist
  const loopingProducts = products.length > 0 ? [...products, ...products, ...products] : [];

  return (
    <section className="mens-styles-section">
      <div className="mens-styles-container">
        
        {/* Section Header */}
        <div className="mens-styles-header flex justify-between items-end">
          <div>
            <span className="mens-styles-eyebrow">Curated Selection</span>
            <h2 className="mens-styles-title">Shop Men's Styles</h2>
          </div>
          <button 
            type="button" 
            onClick={() => setCurrentPage('men')} 
            className="text-xs font-bold uppercase tracking-wider text-purple-700 hover:text-black transition-colors pb-1 cursor-pointer"
          >
            View All Men's &rarr;
          </button>
        </div>

        {/* Auto-Moving Infinite Carousel Track (Only renders if products exist) */}
        {products.length > 0 && (
          <div className="mens-carousel-container">
            <div className="mens-carousel-wrapper">
              <div className="mens-ticker-track">
                {loopingProducts.map((item, index) => (
                  <motion.div 
                    key={`${item.id}-${index}`} 
                    className="mens-category-card"
                    onClick={() => setCurrentPage('men')}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mens-category-img-box">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="mens-category-img"
                        onError={(e) => { e.currentTarget.src = '/logo_main.png'; }}
                      />
                      <div className="mens-category-overlay"></div>
                    </div>
                    <div className="mens-category-details">
                      <h3 className="mens-category-name">{item.title}</h3>
                      <span className="mens-category-count">Rs. {formatPrice(item.price)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}