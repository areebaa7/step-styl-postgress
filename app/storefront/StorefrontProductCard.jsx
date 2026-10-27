'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { useWishlist } from '@/app/context/WishlistContext';

export default function StorefrontProductCard({ product, index, onSelectProduct }) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const [selectedColor, setSelectedColor] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Check out of stock
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const totalStock = variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0);
  const isOutOfStock = product.inStock === false || (variants.length > 0 && totalStock === 0);

  // Dynamic image switcher for color variants with graceful fallback
  const displayImage = useMemo(() => {
    if (selectedColor) {
      const norm = String(selectedColor).trim().toLowerCase();

      if (variants.length > 0) {
        const matched = variants.find((item) => {
          const itemColor = String(item.color || item.name || '').trim().toLowerCase();
          return itemColor === norm;
        });
        if (matched?.imageUrl) return matched.imageUrl;
        if (Array.isArray(matched?.images) && matched.images.length > 0 && matched.images[0]) {
          return matched.images[0];
        }
        if (matched?.image) return matched.image;
      }

      if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
        const matched = product.colorVariants.find(
          (item) => String(item.color || item.name || '').trim().toLowerCase() === norm,
        );
        if (matched?.imageUrl || matched?.image) return matched.imageUrl || matched.image;
        if (Array.isArray(matched?.images) && matched.images.length > 0) return matched.images[0];
      }
    }

    return product.image || (Array.isArray(product.images) && product.images[0]) || '/logo_main.png';
  }, [product.image, product.images, product.colorVariants, variants, selectedColor]);

  const cardDescription = product.shortDescription || product.description || '';

  const swatchColors = useMemo(() => {
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors;
    }
    if (variants.length > 0) {
      const vColors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));
      if (vColors.length > 0) return vColors;
    }
    return [];
  }, [product.colors, variants]);

  return (
    <motion.div
      className="shop-product-card relative cursor-pointer"
      onClick={() => onSelectProduct(product)}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.05 }}
    >
      <div className="shop-image-box relative overflow-hidden">
        {/* Wishlist Heart Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isWishlisted) {
              removeFromWishlist(product.id);
            } else {
              addToWishlist({
                id: product.id,
                slug: product.slug,
                title: product.title,
                price: typeof product.price === 'number' ? product.price : Number(String(product.price).replace(/[^0-9.]/g, '')),
                salePrice: product.salePrice ? Number(String(product.salePrice).replace(/[^0-9.]/g, '')) : undefined,
                image: displayImage,
              });
            }
          }}
          className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center transition-all shadow-sm hover:scale-110 active:scale-95"
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-label="Toggle Wishlist"
        >
          <Heart
            size={16}
            className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-500 transition-colors"}
          />
        </button>

        {product.discount && !isOutOfStock && (
          <span className="shop-discount-tag">{product.discount}</span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 shadow-md">
              Sold Out
            </span>
          </div>
        )}

        <img
          src={displayImage}
          alt={product.title}
          className={`w-full h-full object-contain p-2 transition-all duration-300 ${isOutOfStock ? 'opacity-50 grayscale-[25%]' : ''}`}
        />
      </div>

      {/* Interactive Color Variant Swatches */}
      {swatchColors.length > 0 && (
        <div className="shop-color-swatches" style={{ gap: '6px' }}>
          {swatchColors.map((hex, idx) => {
            const isSelected = selectedColor === hex;
            return (
              <button
                key={`${hex}-${idx}`}
                type="button"
                aria-label={`Select color ${hex}`}
                title={hex}
                className={`shop-swatch-dot ${isSelected ? 'selected-swatch' : ''}`}
                style={{
                  backgroundColor: hex || '#1F2937',
                  border: isSelected ? '2px solid #7C3AED' : '1px solid rgba(0,0,0,0.15)',
                  transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedColor((prev) => (prev === hex ? null : hex));
                }}
              />
            );
          })}
        </div>
      )}

      <h3 className="shop-product-title">{product.title}</h3>

      <div className="shop-pricing-box">
        {product.formattedOriginalPrice && (
          <span className="shop-original-price">{product.formattedOriginalPrice}</span>
        )}
        <span className="shop-sale-price">{product.formattedPrice || product.price}</span>
      </div>

      {/* Collapsible Product Description (Accordion / Toggle) */}
      {cardDescription && (
        <div
          className="shop-desc-toggle-wrapper"
          style={{
            marginTop: '0.4rem',
            borderTop: '1px solid #F3F4F6',
            paddingTop: '0.35rem',
            width: '100%',
          }}
        >
          <button
            type="button"
            aria-expanded={isDescExpanded}
            onClick={(e) => {
              e.stopPropagation();
              setIsDescExpanded((prev) => !prev);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#7C3AED',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span>{isDescExpanded ? 'Hide Details' : 'Details'}</span>
            {isDescExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <div
            style={{
              maxHeight: isDescExpanded ? '160px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.25s ease',
              opacity: isDescExpanded ? 1 : 0,
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                color: '#4B5563',
                margin: '4px 0 0',
                lineHeight: 1.4,
                background: '#F9FAFB',
                padding: '6px 8px',
                borderRadius: '6px',
                textAlign: 'left',
              }}
            >
              {cardDescription}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
