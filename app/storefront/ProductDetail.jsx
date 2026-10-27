/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, 
  Truck, ShieldCheck, RefreshCw, X, Ruler, Percent, CheckCircle2, Zap, Heart 
} from 'lucide-react';
import { useWishlist } from '@/app/context/WishlistContext';

export default function ProductDetail({ product, onBack, onAddToCart, setCurrentPage }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('39');
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [productDetailsOpen, setProductDetailsOpen] = useState(true);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [addedNotification, setAddedNotification] = useState(false);
  const [stockWarning, setStockWarning] = useState(null);
  const [isSubmittingBuyNow, setIsSubmittingBuyNow] = useState(false);

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const [flyingImage, setFlyingImage] = useState(null);

  const currentColor = product.colors && product.colors[selectedColorIndex];
  const matchedVariant = useMemo(() => {
    if (!currentColor) return null;
    const norm = String(currentColor).trim().toLowerCase();
    const variantList = product.variants || product.colorVariants || [];
    return variantList.find(v => {
      const vColor = String(v.color || v.name || '').trim().toLowerCase();
      return vColor === norm;
    }) || null;
  }, [product.variants, product.colorVariants, currentColor]);

  const images = useMemo(() => {
    const list = [];
    if (matchedVariant?.imageUrl) list.push(matchedVariant.imageUrl);
    if (Array.isArray(matchedVariant?.images)) {
      matchedVariant.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }

    if (product.image && !list.includes(product.image)) list.push(product.image);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    const variantList = product.variants || product.colorVariants || [];
    variantList.forEach((v) => {
      if (v.imageUrl && !list.includes(v.imageUrl)) list.push(v.imageUrl);
      if (Array.isArray(v.images)) {
        v.images.forEach((img) => {
          if (img && !list.includes(img)) list.push(img);
        });
      }
    });
    return list.filter(Boolean).length > 0 ? list.filter(Boolean) : [product.image || '/logo_main.png'];
  }, [product.image, product.images, product.variants, product.colorVariants, matchedVariant]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeVariantImage, setActiveVariantImage] = useState(null);

  const activeDescription = matchedVariant?.description || product.description || 'Crafted with precision for style and day-long wearability.';

  const productSpecs = useMemo(() => {
    const raw = product.specifications || product.details || {};
    let obj = {};

    if (typeof raw === 'string') {
      try {
        obj = JSON.parse(raw);
      } catch {
        raw.split('\n').forEach((line) => {
          const [k, ...v] = line.split(':');
          if (k && v.length) obj[k.trim()] = v.join(':').trim();
        });
      }
    } else if (typeof raw === 'object' && raw !== null) {
      obj = { ...raw };
    }

    const findVal = (...keys) => {
      for (const k of keys) {
        for (const [entryKey, entryVal] of Object.entries(obj)) {
          if (entryKey.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, '')) {
            if (entryVal && String(entryVal).trim()) return String(entryVal).trim();
          }
        }
      }
      return null;
    };

    const embellishment = findVal('embellishment', 'details') || 'None / Clean Finish';
    const heelType = findVal('heeltype', 'heel', 'sole_type') || 'Standard Sole';
    const heelHeight = findVal('heelheight', 'height') || 'Flat / 1.0 inch';
    const liningMaterial = findVal('liningmaterial', 'lining', 'inner') || 'Breathable Synthetic PU';
    const shoeSole = findVal('shoesole', 'sole', 'outsole') || 'Non-Slip Durable Sheet';
    const upperMaterial = findVal('uppermaterial', 'material', 'upper') || 'Premium Synthetic Leather';

    const knownKeys = ['embellishment', 'heeltype', 'heelheight', 'liningmaterial', 'shoesole', 'uppermaterial', 'details', 'heel', 'height', 'lining', 'inner', 'sole', 'outsole', 'material', 'upper'];
    const extraSpecs = [];
    for (const [k, v] of Object.entries(obj)) {
      const normalizedK = k.toLowerCase().replace(/[\s_-]/g, '');
      if (!knownKeys.includes(normalizedK) && v && String(v).trim()) {
        extraSpecs.push({ label: k, value: String(v).trim() });
      }
    }

    return { embellishment, heelType, heelHeight, liningMaterial, shoeSole, upperMaterial, extraSpecs };
  }, [product.specifications, product.details]);

  const availableSizes = ['36', '37', '39', '40', '41'];
  const chosenColor = (product.colors && product.colors.length > 0) ? (product.colors[selectedColorIndex] || '#000000') : null;

  const currentVariant = useMemo(() => {
    const variantList = product.variants || product.colorVariants || [];
    return variantList.find((v) => {
      const vColor = String(v.color || v.name || '').trim().toLowerCase();
      const vSize = String(v.size || '').trim().toLowerCase();
      const matchColor = !chosenColor || vColor === String(chosenColor).trim().toLowerCase();
      const matchSize = !selectedSize || vSize === String(selectedSize).trim().toLowerCase();
      return matchColor && matchSize;
    }) || matchedVariant;
  }, [product.variants, product.colorVariants, chosenColor, selectedSize, matchedVariant]);

  let currentStock = 999;
  if (currentVariant && typeof currentVariant.stock === 'number') {
    currentStock = currentVariant.stock;
  } else if (typeof product.stock_quantity === 'number') {
    currentStock = product.stock_quantity;
  }
  const isOutOfStock = product.inStock === false || currentStock <= 0;

  const handleColorChange = (index) => {
    setSelectedColorIndex(index);
    const color = product.colors && product.colors[index];
    if (!color) return;
    const norm = String(color).trim().toLowerCase();
    const variantList = product.variants || product.colorVariants || [];
    const variant = variantList.find((v) => {
      const vColor = String(v.color || v.name || '').trim().toLowerCase();
      return vColor === norm;
    });

    const variantImg = variant?.imageUrl || (Array.isArray(variant?.images) && variant.images[0]) || variant?.image;
    if (variantImg) {
      const foundIdx = images.findIndex((img) => img === variantImg);
      if (foundIdx !== -1) {
        setActiveImageIndex(foundIdx);
        setActiveVariantImage(null);
      } else {
        setActiveVariantImage(variantImg);
      }
    } else {
      setActiveVariantImage(null);
      setActiveImageIndex(0);
    }
  };

  const handleNextImage = () => {
    setActiveVariantImage(null);
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveVariantImage(null);
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setStockWarning('Please select a size before adding to cart.');
      setTimeout(() => setStockWarning(null), 3500);
      return;
    }
    if (isOutOfStock) {
      setStockWarning('This item or variant is currently out of stock.');
      setTimeout(() => setStockWarning(null), 3500);
      return;
    }
    onAddToCart({
      ...product,
      title: product.title || product.name,
      description: activeDescription,
      image: activeVariantImage || images[activeImageIndex],
      selectedSize: selectedSize,
      size: selectedSize,
      selectedColor: chosenColor,
      color: chosenColor,
      quantity,
      maxStock: currentStock,
    });
    setAddedNotification(true);
    setTimeout(() => setAddedNotification(false), 2500);
  };

  const handleBuyNow = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmittingBuyNow) return;
    if (!selectedSize) {
      setStockWarning('Please select a size before proceeding.');
      setTimeout(() => setStockWarning(null), 3500);
      return;
    }
    if (isOutOfStock) {
      setStockWarning('This item is currently out of stock.');
      setTimeout(() => setStockWarning(null), 3500);
      return;
    }
    setIsSubmittingBuyNow(true);
    onAddToCart({
      ...product,
      title: product.title || product.name,
      description: activeDescription,
      image: activeVariantImage || images[activeImageIndex],
      selectedSize: selectedSize,
      size: selectedSize,
      selectedColor: chosenColor,
      color: chosenColor,
      quantity,
      maxStock: currentStock,
    });
    if (typeof setCurrentPage === 'function') {
      setCurrentPage('checkout');
    } else {
      window.location.href = '/checkout';
    }
  };

  return (
    <motion.div 
      className="pdp-container w-full max-w-full box-border overflow-x-hidden px-3 sm:px-6 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button className="pdp-back-btn text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1" onClick={onBack}>
        &larr; Back to Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start w-full max-w-full box-border">
        
        {/* Left Column: Gallery */}
        <div className="flex flex-col gap-4 w-full max-w-full box-border min-w-0">
          <div className="relative w-full h-[300px] sm:h-[420px] bg-[#F9F8F6] rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center box-border">
            {images.length > 1 && (
              <button className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center z-10 shadow cursor-pointer" onClick={handlePrevImage}>
                <ChevronLeft size={18} />
              </button>
            )}

            <motion.img 
              key={activeVariantImage || images[activeImageIndex]}
              src={activeVariantImage || images[activeImageIndex]} 
              alt={product.title}
              className="w-full h-full object-contain p-3 box-border"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />

            {images.length > 1 && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center z-10 shadow cursor-pointer" onClick={handleNextImage}>
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 w-full max-w-full">
            {images.map((imgUrl, idx) => (
              <div 
                key={idx} 
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 cursor-pointer flex-shrink-0 bg-[#F9F8F6] flex items-center justify-center ${activeImageIndex === idx && !activeVariantImage ? 'border-gray-900' : 'border-gray-200'}`}
                onClick={() => { setActiveVariantImage(null); setActiveImageIndex(idx); }}
              >
                <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-contain p-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Info & Actions */}
        <div className="flex flex-col w-full max-w-full box-border min-w-0">
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#9b4de0] block mb-1">{product.category || 'Luxury Footwear'}</span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif text-gray-900 font-medium break-words leading-snug m-0">{product.title || product.name}</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isWishlisted) {
                  removeFromWishlist(product.id);
                } else {
                  addToWishlist({
                    id: product.id,
                    slug: product.slug,
                    title: product.title || product.name,
                    price: typeof product.price === 'number' ? product.price : Number(String(product.price).replace(/[^0-9.]/g, '')),
                    image: activeVariantImage || images[activeImageIndex],
                  });
                }
              }}
              className="p-2.5 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors flex-shrink-0"
            >
              <Heart size={20} className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"} />
            </button>
          </div>

          {/* Pricing Box */}
          <div className="flex flex-wrap items-center gap-3 my-4">
            <span className="text-xl font-bold text-gray-900">{product.formattedPrice || product.price}</span>
            {product.formattedOriginalPrice && (
              <span className="text-sm text-gray-400 line-through">{product.formattedOriginalPrice}</span>
            )}
            <span className="bg-purple-100 text-[#9b4de0] text-xs font-bold px-2 py-0.5 rounded">{product.discount || '15% OFF'}</span>
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
              {isOutOfStock ? 'Sold Out' : currentStock <= 5 ? `Low Stock (${currentStock} left)` : 'In Stock & Ready'}
            </span>
          </div>

          {/* Colors */}
          <div className="mb-4 w-full max-w-full">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Color Option</label>
              <span className="text-xs font-medium text-purple-700">{currentColor || 'Standard'}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.colors && product.colors.length > 0 ? (
                product.colors.map((hex, idx) => (
                  <div 
                    key={idx}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${selectedColorIndex === idx ? 'scale-110 border-gray-900 shadow-sm' : 'border-gray-300'}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => handleColorChange(idx)}
                  />
                ))
              ) : (
                <div className="w-7 h-7 rounded-full border-2 border-gray-900 bg-gray-900" />
              )}
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-4 w-full max-w-full">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Select Size (EU):</label>
              <button className="text-xs text-[#9b4de0] font-semibold underline bg-transparent border-none cursor-pointer flex items-center gap-1" onClick={() => setShowSizeChart(true)}>
                <Ruler size={13} /> Size Chart
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  className={`min-w-[42px] h-[38px] px-3 border rounded font-semibold text-xs transition-colors cursor-pointer ${selectedSize === size ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-300 hover:border-gray-900'}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-5 w-full max-w-full">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-wide block mb-2">Quantity:</label>
            <div className="inline-flex items-center border border-gray-300 rounded overflow-hidden">
              <button className="w-9 h-9 bg-gray-50 flex items-center justify-center border-none cursor-pointer text-gray-800 hover:bg-gray-200" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>
                <Minus size={14} />
              </button>
              <span className="w-10 text-center font-semibold text-sm text-gray-900">{quantity}</span>
              <button className="w-9 h-9 bg-gray-50 flex items-center justify-center border-none cursor-pointer text-gray-800 hover:bg-gray-200" onClick={() => setQuantity(prev => Math.min(currentStock, prev + 1))}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {stockWarning && (
            <div className="p-2.5 mb-3 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded text-center w-full box-border">
              {stockWarning}
            </div>
          )}

          {/* Action Buttons: Add to Cart & Buy Now (Strictly Constrained to Prevent Leaking) */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-full box-border my-2">
            <button 
              className="flex-1 w-full max-w-full min-w-0 box-border bg-gray-900 hover:bg-[#9b4de0] text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer text-sm" 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingBag size={16} className="shrink-0" />
              <span className="truncate">{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>

            <button
              type="button"
              className="flex-1 w-full max-w-full min-w-0 box-border bg-[#9b4de0] hover:bg-[#8537c9] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer text-sm shadow-md"
              onClick={handleBuyNow}
              disabled={isOutOfStock || isSubmittingBuyNow}
            >
              <Zap size={16} className="shrink-0" />
              <span className="truncate">{isSubmittingBuyNow ? 'Processing...' : 'Buy Now'}</span>
            </button>
          </div>

          {addedNotification && (
            <p className="text-xs text-emerald-600 font-semibold text-center mt-2">✓ Successfully added to cart!</p>
          )}

          {/* Assurances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5 p-3.5 bg-gradient-to-br from-purple-50/50 to-gray-50 border border-purple-100 rounded-lg w-full max-w-full box-border">
            <div className="flex items-start gap-2.5 bg-white p-2.5 rounded border border-gray-200">
              <CheckCircle2 size={18} className="text-[#9b4de0] shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 m-0 mb-0.5">Check Before You Pay</h5>
                <p className="text-[11px] text-gray-600 m-0">Inspect your order before payment.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white p-2.5 rounded border border-gray-200">
              <RefreshCw size={18} className="text-[#9b4de0] shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 m-0 mb-0.5">7 Days Easy Return</h5>
                <p className="text-[11px] text-gray-600 m-0">Easy return within 7 days.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white p-2.5 rounded border border-purple-200">
              <Percent size={18} className="text-[#9b4de0] shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 m-0 mb-0.5">5% OFF Bank Transfer</h5>
                <p className="text-[11px] text-gray-600 m-0">Extra discount on direct payment.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white p-2.5 rounded border border-gray-200">
              <Truck size={18} className="text-[#9b4de0] shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 m-0 mb-0.5">Nationwide Fast Delivery</h5>
                <p className="text-[11px] text-gray-600 m-0">Fast delivery across Pakistan.</p>
              </div>
            </div>
          </div>

          {/* About This Product Accordion */}
          <div className="mt-4 w-full max-w-full box-border">
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 w-full box-border">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsDescExpanded(!isDescExpanded)}>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider m-0">About This Product</h4>
                <button type="button" className="text-[#9b4de0] p-0 bg-transparent border-none cursor-pointer">
                  {isDescExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {!isDescExpanded && (
                <p className="text-xs text-gray-600 line-clamp-2 mt-2 mb-0 break-words leading-relaxed">
                  {activeDescription}
                </p>
              )}

              <AnimatePresence initial={false}>
                {isDescExpanded && (
                  <motion.div
                    key="desc-expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden w-full"
                  >
                    <p className="text-xs text-gray-700 leading-relaxed mt-2 mb-0 break-words">
                      {activeDescription}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Product Specifications Section */}
          <div className="mt-3 w-full max-w-full box-border">
            <div className="bg-[#F9F8F6] rounded-lg overflow-hidden w-full">
              <button className="w-full bg-transparent border-none py-3 px-4 flex justify-between items-center text-xs font-bold text-gray-900 uppercase tracking-wide cursor-pointer hover:bg-[#F3F2EE]" onClick={() => setProductDetailsOpen(!productDetailsOpen)}>
                <span>Product Specifications</span>
                {productDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence>
                {productDetailsOpen && (
                  <motion.div 
                    className="px-4 pb-3 text-xs text-gray-600 leading-relaxed w-full box-border"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                      <li className="break-words">Embellishment: <strong className="text-gray-900">{productSpecs.embellishment}</strong></li>
                      <li className="break-words">Heel Type: <strong className="text-gray-900">{productSpecs.heelType}</strong></li>
                      <li className="break-words">Heel Height: <strong className="text-gray-900">{productSpecs.heelHeight}</strong></li>
                      <li className="break-words">Lining Material: <strong className="text-gray-900">{productSpecs.liningMaterial}</strong></li>
                      <li className="break-words">Shoe Sole: <strong className="text-gray-900">{productSpecs.shoeSole}</strong></li>
                      <li className="break-words">Upper Material: <strong className="text-gray-900">{productSpecs.upperMaterial}</strong></li>
                      {productSpecs.extraSpecs && productSpecs.extraSpecs.map((spec, idx) => (
                        <li key={`extra-${idx}`} className="break-words">{spec.label}: <strong className="text-gray-900">{spec.value}</strong></li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Size Chart Modal */}
      <AnimatePresence>
        {showSizeChart && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 box-border" onClick={() => setShowSizeChart(false)}>
            <motion.div 
              className="bg-white p-5 sm:p-8 rounded-xl max-w-lg w-full relative shadow-2xl box-border"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button className="absolute top-4 right-4 bg-gray-100 border-none w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-gray-800" onClick={() => setShowSizeChart(false)}>
                <X size={18} />
              </button>
              <h2 className="font-serif text-xl font-medium mb-1 text-gray-900">Footwear Size Chart (EU)</h2>
              <p className="text-xs text-gray-500 mb-4">Find your perfect fit using standard European shoe measurements.</p>
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-center font-semibold">EU Size</th>
                      <th className="border border-gray-200 p-2 text-center font-semibold">US Women</th>
                      <th className="border border-gray-200 p-2 text-center font-semibold">US Men</th>
                      <th className="border border-gray-200 p-2 text-center font-semibold">Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-gray-200 p-2 text-center">36</td><td className="border border-gray-200 p-2 text-center">5.5</td><td className="border border-gray-200 p-2 text-center">4.5</td><td className="border border-gray-200 p-2 text-center">22.5 cm</td></tr>
                    <tr><td className="border border-gray-200 p-2 text-center">37</td><td className="border border-gray-200 p-2 text-center">6.5</td><td className="border border-gray-200 p-2 text-center">5.5</td><td className="border border-gray-200 p-2 text-center">23.2 cm</td></tr>
                    <tr><td className="border border-gray-200 p-2 text-center">39</td><td className="border border-gray-200 p-2 text-center">8.0</td><td className="border border-gray-200 p-2 text-center">7.0</td><td className="border border-gray-200 p-2 text-center">24.5 cm</td></tr>
                    <tr><td className="border border-gray-200 p-2 text-center">40</td><td className="border border-gray-200 p-2 text-center">8.5</td><td className="border border-gray-200 p-2 text-center">7.5</td><td className="border border-gray-200 p-2 text-center">25.1 cm</td></tr>
                    <tr><td className="border border-gray-200 p-2 text-center">41</td><td className="border border-gray-200 p-2 text-center">9.5</td><td className="border border-gray-200 p-2 text-center">8.5</td><td className="border border-gray-200 p-2 text-center">25.8 cm</td></tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}