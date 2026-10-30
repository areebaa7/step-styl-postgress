/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './NewArrivals.css';

export default function NewArrivals({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [products, setProducts] = useState<any[]>([]);

  // Fetch all products added from the admin panel API (Men, Women, Kids)
  useEffect(() => {
    async function fetchAdminProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const formatted = json.data.map((item: any) => {
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
              title: item.name || item.title || 'Product',
              price: item.salePrice || item.price || '0',
              image: rawImage,
              badge: item.badge || 'NEW'
            };
          });
          setProducts(formatted);
        }
      } catch (err) {
        console.error('Failed to load admin products for new arrivals:', err);
      }
    }
    fetchAdminProducts();
  }, []);

  const formatPrice = (val: string | number) => Number(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Duplicate the product array to create an infinite seamless loop effect
  const loopingProducts = products.length > 0 ? [...products, ...products, ...products] : [];

  return (
    <section id="new-arrivals-section" className="new-arrivals-section">
      <div className="arrivals-header-container">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          New Arrivals
        </motion.h2>
        <div className="w-12 h-0.5 bg-purple-600 mx-auto mt-2"></div>
      </div>

      {/* Infinite Running Ticker Carousel Track (Only renders if products exist) */}
      {products.length > 0 && (
        <div className="arrivals-ticker-container">
          <div className="arrivals-ticker-track">
            {loopingProducts.map((item, index) => (
              <motion.div 
                key={`${item.id}-${index}`} 
                className="arrival-product-card" 
                onClick={() => setCurrentPage('shop')}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {item.badge && (
                  <span className="arrival-badge">{item.badge}</span>
                )}
                <div className="arrival-image-container">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="arrival-product-image"
                    onError={(e) => {
                      e.currentTarget.src = '/logo_main.png';
                    }}
                  />
                </div>
                <div className="arrival-card-details">
                  <h3 className="arrival-product-title">{item.title}</h3>
                  <p className="arrival-product-price">Rs. {formatPrice(item.price)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}