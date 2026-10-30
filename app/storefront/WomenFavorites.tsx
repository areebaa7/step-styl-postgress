/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './WomenFavorites.css';

export default function WomenFavorites({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [products, setProducts] = useState<any[]>([]);

  // Fetch products from admin panel API and dynamically filter for Women category
  useEffect(() => {
    async function fetchWomenProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const json = await res.json();
        
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const womenItems = json.data.filter((item: any) => {
            const cat = (item.category || item.tag || '').toLowerCase();
            const name = (item.name || item.title || '').toLowerCase();
            const gender = (item.gender || '').toLowerCase();

            const isMen = cat.includes('men') || gender.includes('men') || name.includes('men');
            if (isMen && !cat.includes('women')) return false;

            return (
              cat.includes('women') || 
              cat.includes('female') || 
              cat.includes('ladies') || 
              cat.includes('girl') || 
              gender.includes('women') || 
              gender.includes('female') ||
              name.includes('women') || 
              name.includes('ladies') || 
              name.includes('heel') || 
              name.includes('sandal') || 
              name.includes('flat')
            );
          });

          const displayItems = womenItems.length > 0 ? womenItems : json.data;

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
              title: item.name || item.title || 'Women Footwear',
              price: item.salePrice || item.price || '0',
              image: rawImage,
              badge: item.badge || 'POPULAR'
            };
          });
          setProducts(formatted);
        }
      } catch (err) {
        console.error('Failed to load admin products for Women Favorites:', err);
      }
    }
    fetchWomenProducts();
  }, []);

  const formatPrice = (val: string | number) => Number(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const loopingProducts = products.length > 0 ? [...products, ...products, ...products] : [];

  return (
    <section className="women-favorites-section">
      <div className="women-favorites-container">
        
        {/* Stacked Layout: 1. Full Banner with separate Desktop and Mobile backgrounds */}
        <motion.div 
          className="women-fav-banner-wrap"
          onClick={() => setCurrentPage('women')}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Desktop Banner Image */}
          <div 
            className="women-fav-banner desktop-banner-bg" 
            style={{ backgroundImage: `url('/assets/women-desktop.jpg')` }}
          />
          {/* Mobile Banner Image (Change '/assets/womens-favorite-mobile.jpg' to your preferred mobile asset) */}
          <div 
            className="women-fav-banner mobile-banner-bg" 
            style={{ backgroundImage: `url('/assets/women-mobile.jpg')` }}
          />
        </motion.div>

        {/* 2. Infinite Scrolling Product Carousel Underneath */}
        <div className="women-fav-carousel-container">
          {products.length > 0 && (
            <div className="women-fav-carousel-wrapper">
              <div className="women-ticker-track">
                {loopingProducts.map((item, index) => (
                  <motion.div 
                    key={`${item.id}-${index}`} 
                    className="women-product-card"
                    onClick={() => setCurrentPage('women')}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.badge && <span className="women-product-badge">{item.badge}</span>}
                    <div className="women-product-img-wrap">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="women-product-img"
                        onError={(e) => {
                          e.currentTarget.src = '/logo_main.png';
                        }}
                      />
                    </div>
                    <div className="women-product-details">
                      <h3 className="women-product-title">{item.title}</h3>
                      <p className="women-product-price">Rs. {formatPrice(item.price)}</p>
                      <span className="women-product-link">View Collection &rarr;</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}