/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/app/context/WishlistContext';
import { formatPKR } from '@/lib/currency';

interface WishlistPageProps {
  setCurrentPage: (page: string) => void;
  onAddToCart: (item: any) => void;
}

export default function WishlistPage({ setCurrentPage, onAddToCart }: WishlistPageProps) {
  const { items, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-[70vh] bg-white py-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
          Saved in Wishlist
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          {items.length === 0
            ? 'Your wishlist is currently empty.'
            : `${items.length} saved footwear item${items.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#FAF8FC] rounded-2xl border border-purple-100 max-w-xl mx-auto text-center px-6">
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <Heart size={36} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Items Yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            Explore our collections and tap the heart icon on any shoe to save it to your wishlist.
          </p>
          <button
            onClick={() => setCurrentPage('shop')}
            className="px-8 py-3 bg-[#9b4de0] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#8537c9] transition shadow-lg shadow-purple-200"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {items.map((item, idx) => {
            const cleanPrice = typeof item.price === 'number' ? item.price : Number(String(item.price).replace(/[^0-9.]/g, ''));
            const cleanSalePrice = item.salePrice ? Number(String(item.salePrice).replace(/[^0-9.]/g, '')) : null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                {/* Remove from wishlist */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(item.id);
                  }}
                  className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 flex items-center justify-center shadow-sm transition"
                  title="Remove from wishlist"
                >
                  <Trash2 size={15} />
                </button>

                {/* Thumbnail */}
                <div 
                  className="relative aspect-square bg-[#F4F4F5] overflow-hidden p-3 flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    if (item.slug) {
                      window.location.href = `/products/${item.slug}`;
                    } else {
                      setCurrentPage('shop');
                    }
                  }}
                >
                  <img
                    src={item.image || '/logo_main.png'}
                    alt={item.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                  />
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-purple-700 transition line-clamp-1 mb-1.5">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-auto mb-3">
                    <span className="text-xs sm:text-sm font-bold text-purple-700">
                      {formatPKR(cleanPrice)}
                    </span>
                    {cleanSalePrice && cleanSalePrice > cleanPrice && (
                      <span className="text-[11px] text-gray-400 line-through">
                        {formatPKR(cleanSalePrice)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onAddToCart({
                        id: item.id,
                        title: item.title,
                        price: cleanPrice,
                        image: item.image,
                        size: '39',
                        quantity: 1,
                      });
                    }}
                    className="w-full py-2 bg-gray-900 hover:bg-purple-600 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={14} /> Add to Cart
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
