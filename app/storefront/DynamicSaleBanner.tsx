/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { getProductDiscountBadge } from './utils/discount';
import './DynamicSaleBanner.css';

export default function DynamicSaleBanner({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(json.data);
        }
      } catch (err) {
        console.error('Failed to load flash sale products from admin API:', err);
      }
    }
    fetchProducts();
  }, []);

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Helper to reliably parse numeric prices from backend strings or numbers
  const parsePrice = (val: any) => {
    if (val === undefined || val === null) return 0;
    const cleanStr = String(val).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const formatPrice = (val: any) => Math.round(Number(val)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Triple products list for smooth, seamless infinite ticker looping
  const loopingProducts = products.length > 0 ? [...products, ...products, ...products] : [];

  return (
    <section id="flash-sale-section" className="flash-sale-section pt-12 pb-8 px-4 md:px-12 bg-gradient-to-b from-white via-purple-50/20 to-white text-black overflow-hidden my-2">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 pb-6 border-b border-purple-100 relative">
          <div className="flex items-center gap-2 text-purple-700 text-xs tracking-[0.25em] uppercase font-bold mb-2">
            <Sparkles size={14} className="animate-pulse" />
            <span>Limited Stock Offer</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-black tracking-wide uppercase font-bold mb-2">
            Flash Sale
          </h2>

          <p className="text-xs sm:text-sm tracking-wider text-gray-500 uppercase font-medium max-w-md">
            Exclusive limited-time styles curated for your wardrobe.
          </p>

          <div className="mt-4 md:absolute md:right-0 md:top-2">
            <button 
              onClick={() => setCurrentPage('shop')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] bg-black text-white px-6 py-3 rounded-none hover:bg-purple-800 transition-all shadow-lg justify-center"
            >
              <span>View All</span>
              <span className="text-sm">&rarr;</span>
            </button>
          </div>
        </div>

        {/* Infinite Auto-Moving Carousel Track */}
        {products.length > 0 && (
          <div className="flash-sale-ticker-container py-2">
            <div className="flash-sale-ticker-track">
              {loopingProducts.map((item, index) => {
                const name = item.name || item.title || 'Footwear Item';
                const price = parsePrice(item.price || item.regularPrice || 0);
                
                let salePrice = parsePrice(
                  item.salePrice || 
                  item.discountPrice || 
                  item.discounted_price || 
                  item.offerPrice || 
                  0
                );

                if (salePrice <= 0 || salePrice >= price) {
                  if (item.discountPercent || item.discount) {
                    const pct = parsePrice(item.discountPercent || item.discount);
                    salePrice = price * (1 - (pct > 0 ? pct : 30) / 100);
                  } else {
                    salePrice = price * 0.7; // 30% default discount fallback if none provided
                  }
                }

                // Dynamic Universal Discount Badge
                const discountPercent = getProductDiscountBadge(item) || 
                  `${Math.max(1, Math.round(((price - salePrice) / price) * 100))}% OFF`;
                
                let rawImage = item.image || item.imageUrl || '/logo_main.png';
                if (typeof rawImage === 'string') {
                  rawImage = rawImage.replace(/\\/g, '/');
                  if (!rawImage.startsWith('http') && !rawImage.startsWith('/')) {
                    rawImage = '/' + rawImage;
                  }
                }

                const isWishlisted = wishlist.includes(item.id || String(index));

                return (
                  <motion.div 
                    key={`${item.id || 'item'}-${index}`}
                    className="flash-sale-item group flex flex-col bg-white p-4 rounded-none border border-gray-100 hover:border-purple-600 transition-all duration-300 relative cursor-pointer shadow-sm hover:shadow-2xl shrink-0"
                    onClick={() => setCurrentPage('shop')}
                  >
                    {/* Sale Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-purple-900 text-white text-[10px] tracking-widest px-3 py-1 uppercase font-bold shadow-md">
                        {discountPercent}
                      </span>
                    </div>

                    {/* Wishlist Icon */}
                    <button 
                      type="button"
                      onClick={(e) => toggleWishlist(e, item.id || String(index))}
                      className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-purple-700 transition-all shadow-md hover:scale-110"
                      aria-label="Wishlist"
                    >
                      <Heart size={16} className={isWishlisted ? "fill-purple-600 text-purple-600" : ""} />
                    </button>

                    {/* Product Image */}
                    <div className="relative w-full h-72 sm:h-80 mb-4 bg-[#FAF8FC] overflow-hidden flex items-center justify-center p-2">
                      <img 
                        src={rawImage} 
                        alt={name} 
                        className="object-cover h-full w-full group-hover:scale-108 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          e.currentTarget.src = '/logo_main.png';
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col gap-1.5 px-1">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-800 transition-colors line-clamp-1 font-serif tracking-wide">
                        {name}
                      </h3>

                      {/* Price & Sale Price layout */}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-purple-900 tracking-wider">Rs. {formatPrice(salePrice)}</span>
                        {price > salePrice && (
                          <span className="text-xs text-gray-400 line-through">Rs. {formatPrice(price)}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
