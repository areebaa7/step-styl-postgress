/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './KidsBanner.css';

export default function KidsBanner({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchKidsProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const kidsItems = json.data.filter((item: any) => {
            const cat = (item.category || item.tag || '').toLowerCase();
            const name = (item.name || item.title || '').toLowerCase();
            const gender = (item.gender || '').toLowerCase();
            return (
              cat.includes('kid') ||
              gender.includes('kid') ||
              name.includes('kid') ||
              cat.includes('child') ||
              cat.includes('boy') ||
              cat.includes('junior')
            );
          });

          const displayItems = kidsItems.length > 0 ? kidsItems : json.data.slice(0, 6);

          const formatted = displayItems.map((item: any) => {
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
              title: item.name || item.title || 'Kids Footwear',
              price: item.salePrice || item.price || '0',
              image: rawImage,
              badge: item.badge || 'KIDS PICK'
            };
          });
          setProducts(formatted);
        }
      } catch (err) {
        console.error('Failed to load products for Kids Carousel:', err);
      }
    }
    fetchKidsProducts();
  }, []);

  const formatPrice = (val: string | number) => Number(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const loopingProducts = products.length > 0 ? [...products, ...products, ...products] : [];

  return (
    <section className="kids-banner-section">
      {/* Full Screen Width Editorial Banner Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="kids-editorial-card group"
        onClick={() => {
          setCurrentPage('kids');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
      >
        {/* Desktop Banner Image */}
        <img 
          src="/assets/kids-banner.jpg" 
          alt="Kids Favorites Trending Styles" 
          className="kids-editorial-img desktop-banner-bg"
          onError={(e) => {
            e.currentTarget.src = '/logo_main.png';
          }}
        />

        {/* Mobile Banner Image */}
        <img 
          src="/assets/kids-mobile.jpg" 
          alt="Kids Favorites Trending Styles" 
          className="kids-editorial-img mobile-banner-bg"
          onError={(e) => {
            e.currentTarget.src = '/assets/kids-mobile.jpg';
          }}
        />

        {/* Dark cinematic overlay for maximum clarity and contrast */}
        <div className="kids-editorial-overlay"></div>

        <div className="kids-editorial-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button 
              className="kids-shop-btn"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage('kids');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
            >
              <span>Shop Kids</span>
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>

      </motion.div>

      {/* Auto-Moving Infinite Carousel Track for Kids' Footwear */}
      {products.length > 0 && (
        <div className="kids-fav-carousel-container mt-6 px-4 md:px-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Kids' Trending Footwear
            </h3>
            <button 
              onClick={() => setCurrentPage('kids')}
              className="text-xs font-bold uppercase tracking-wider text-purple-700 hover:text-black transition-colors"
            >
              View Kids' Collection &rarr;
            </button>
          </div>
          <div className="kids-fav-carousel-wrapper">
            <div className="kids-ticker-track">
              {loopingProducts.map((item, index) => (
                <motion.div 
                  key={`${item.id}-${index}`} 
                  className="kids-product-card"
                  onClick={() => setCurrentPage('kids')}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.badge && <span className="kids-product-badge">{item.badge}</span>}
                  <div className="kids-product-img-wrap">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="kids-product-img"
                      onError={(e) => {
                        e.currentTarget.src = '/logo_main.png';
                      }}
                    />
                  </div>
                  <div className="kids-product-details">
                    <h3 className="kids-product-title">{item.title}</h3>
                    <p className="kids-product-price">Rs. {formatPrice(item.price)}</p>
                    <span className="kids-product-link">Shop Kids &rarr;</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
