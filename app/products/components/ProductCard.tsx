'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { formatPKR } from '@/lib/currency';
import { resolveColorCode } from '@/lib/colors';
import { useWishlist } from '@/app/context/WishlistContext';
import type { ProductDTO } from '@/types/product';

interface ProductCardProps {
  product: ProductDTO;
  index: number;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Check explicit stock flag OR calculate if all variant stocks total 0
  const totalStock = (product.variants || []).reduce((sum, v) => sum + Math.max(0, v.stock || 0), 0);
  const isOutOfStock = !product.inStock || ((product.variants?.length ?? 0) > 0 && totalStock === 0);

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  const swatchColors = useMemo(() => {
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors;
    }
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const variantColors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)));
      if (variantColors.length > 0) return variantColors;
    }
    return ['#000000'];
  }, [product.colors, product.variants]);

  // Dynamic image switching upon selecting a product color variant with graceful fallback
  const displayImage = useMemo(() => {
    if (selectedColor && Array.isArray(product.variants) && product.variants.length > 0) {
      const normalizedSelected = selectedColor.trim().toLowerCase();
      const matchingVariant = product.variants.find((v) => {
        if (!v.color) return false;
        const normalizedVariant = v.color.trim().toLowerCase();
        return (
          normalizedVariant === normalizedSelected ||
          resolveColorCode(v.color).toLowerCase() === normalizedSelected ||
          resolveColorCode(selectedColor).toLowerCase() === normalizedVariant
        );
      });

      if (matchingVariant?.imageUrl) {
        return matchingVariant.imageUrl;
      }
      if (Array.isArray(matchingVariant?.images) && matchingVariant.images.length > 0 && matchingVariant.images[0]) {
        return matchingVariant.images[0];
      }
    }
    return product.image || (Array.isArray(product.images) && product.images[0]) || '/logo_main.png';
  }, [product.image, product.images, product.variants, selectedColor]);

  const hasDiscount = Boolean(
    (product.discount && product.discount > 0) ||
    (product.salePrice && product.salePrice > product.price),
  );

  const discountPercent = product.discount && product.discount > 0 ? product.discount : null;

  const price = product.discount && product.discount > 0
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  const cardDescription = product.shortDescription || product.description || '';

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block transition-transform duration-300"
    >
      <div className="relative aspect-square bg-[#F4F4F5] rounded-xl overflow-hidden mb-3 border border-gray-100/60 flex items-center justify-center p-3">
        <Image
          src={displayImage}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 768px) 320px, 260px"
          className={`object-contain p-2 transition-all duration-500 group-hover:scale-105 ${
            isOutOfStock ? 'opacity-50 grayscale-[25%]' : ''
          }`}
        />

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
                price: price,
                salePrice: product.salePrice ?? undefined,
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

        {/* Badges / Sold Out Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10 items-start">
          {isOutOfStock && (
            <span className="bg-black text-white px-2 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm">
              Sold Out
            </span>
          )}
          {!isOutOfStock && product.isNew && (
            <span className="bg-white text-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-gray-200">
              New
            </span>
          )}
        </div>

        {/* Optional center overlay badge for maximum visibility */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-black/80 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border border-white/20">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="px-1 space-y-1">
        <h3 className="font-bold text-[12px] md:text-[13px] uppercase tracking-wider text-gray-900 group-hover:text-black transition-colors truncate">
          {product.title}
        </h3>

        <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-widest">
          {product.collection?.targetGender || 'UNISEX'}
        </p>

        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          {hasDiscount && (
            <span className="text-gray-400 text-[11px] line-through font-semibold">
              {formatPKR(product.salePrice || product.price)}
            </span>
          )}
          <span className="font-extrabold text-[13px] md:text-[14px] text-gray-900 leading-none">
            {formatPKR(price)}
          </span>
          {discountPercent !== null && !isOutOfStock && (
            <span className="text-[11px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Color Swatches with Dynamic Image Switcher */}
        {swatchColors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            {swatchColors.slice(0, 5).map((color, i) => {
              const hex = resolveColorCode(color);
              const isSelected = selectedColor === color;

              return (
                <button
                  key={`${color}-${i}`}
                  type="button"
                  aria-label={`Select color variant ${color}`}
                  title={color}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor((prev) => (prev === color ? null : color));
                  }}
                  className={`w-4 h-4 rounded-xs border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-purple-600 ring-2 ring-purple-500 ring-offset-1 scale-110 shadow-sm'
                      : 'border-gray-300 hover:border-gray-500 hover:scale-105 shadow-2xs'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
            {swatchColors.length > 5 && (
              <span className="text-[9px] text-gray-400 font-bold">+{swatchColors.length - 5}</span>
            )}
          </div>
        )}

        {/* Collapsible Product Card Description (Accordion / Toggle) */}
        {cardDescription && (
          <div className="pt-1.5 border-t border-gray-100/80 mt-1.5">
            <button
              type="button"
              aria-expanded={isDescriptionOpen}
              aria-controls={`desc-${product.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDescriptionOpen((prev) => !prev);
              }}
              className="flex items-center justify-between w-full text-left text-[11px] font-bold text-gray-600 hover:text-purple-700 transition-colors py-1 group/btn"
            >
              <span>{isDescriptionOpen ? 'Hide description' : 'Product details'}</span>
              <span className="text-gray-400 group-hover/btn:text-purple-700 transition-transform duration-200">
                {isDescriptionOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </span>
            </button>
            <div
              id={`desc-${product.id}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isDescriptionOpen ? 'max-h-48 opacity-100 pt-1 pb-1' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-[11px] text-gray-600 leading-relaxed font-normal bg-gray-50/70 p-2 rounded-md border border-gray-100">
                {cardDescription}
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}