/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, 
  Truck, ShieldCheck, RefreshCw, X, Ruler, Percent, CheckCircle2, Zap, Heart 
} from 'lucide-react';
import { useWishlist } from '@/app/context/WishlistContext';
import './ProductDetail.css';

export default function ProductDetail({ product, onBack, onAddToCart, setCurrentPage }) {
  // Automatically scroll to the top of the product card view when opened
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

  // Fly-to-cart animation state
  const [flyingImage, setFlyingImage] = useState(null);

  // Dynamic color variant resolution with graceful fallback
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

  // Full product gallery with all images uploaded from admin panel
  const images = useMemo(() => {
    const list = [];
    // Prioritize variant image if matching current color
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

  // Comprehensive parsing of specifications from Admin Panel (Task 1.4)
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

    return {
      embellishment,
      heelType,
      heelHeight,
      liningMaterial,
      shoeSole,
      upperMaterial,
      extraSpecs
    };
  }, [product.specifications, product.details]);

  const availableSizes = ['36', '37', '39', '40', '41'];

  // Calculate live stock for current selection
  const chosenColor = (product.colors && product.colors.length > 0) 
    ? (product.colors[selectedColorIndex] || '#000000') 
    : null;

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

  // Dynamic image switching on color variant select
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

  const handleAddToCart = (e) => {
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

    if (quantity > currentStock) {
      setStockWarning(`Only ${currentStock} item(s) available in stock. Please adjust quantity.`);
      setTimeout(() => setStockWarning(null), 3500);
      return;
    }

    // Fly-to-cart animation trajectory
    const imgElement = document.querySelector('.pdp-main-image') || document.querySelector('.pdp-main-image-wrapper img');
    const cartIcon = document.getElementById('cart-icon');

    if (imgElement && cartIcon) {
      const imgRect = imgElement.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      if (imgRect.width > 0 && cartRect.width > 0) {
        const startX = imgRect.left + imgRect.width / 2;
        const startY = imgRect.top + imgRect.height / 2;
        const endX = cartRect.left + cartRect.width / 2;
        const endY = cartRect.top + cartRect.height / 2;

        setFlyingImage({
          id: Date.now(),
          src: activeVariantImage || images[activeImageIndex],
          x: startX,
          y: startY,
          targetX: endX - startX,
          targetY: endY - startY,
        });
      }
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
      setStockWarning('Please select a size before proceeding to checkout.');
      setTimeout(() => setStockWarning(null), 3500);
      return;
    }

    if (isOutOfStock) {
      setStockWarning('This item or variant is currently out of stock.');
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
      className="pdp-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button className="pdp-back-btn" onClick={onBack}>
        &larr; Back to Catalog
      </button>

      <div className="pdp-grid-layout">
        
        {/* Left Column: Gallery */}
        <div className="pdp-gallery-section">
          <div className="pdp-main-image-wrapper">
            {images.length > 1 && (
              <button className="gallery-arrow left" onClick={handlePrevImage} aria-label="Previous Image">
                <ChevronLeft size={20} />
              </button>
            )}

            <motion.img 
              key={activeVariantImage || images[activeImageIndex]}
              src={activeVariantImage || images[activeImageIndex]} 
              alt={product.title}
              className="pdp-main-image"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {images.length > 1 && (
              <button className="gallery-arrow right" onClick={handleNextImage} aria-label="Next Image">
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          <div className="pdp-thumbnails-row">
            {images.map((imgUrl, idx) => (
              <div 
                key={idx} 
                className={`pdp-thumb-box ${activeImageIndex === idx && !activeVariantImage ? 'active-thumb' : ''}`}
                onClick={() => { setActiveVariantImage(null); setActiveImageIndex(idx); }}
              >
                <img src={imgUrl} alt={`Thumb ${idx}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Info, Variants, Purchase CTAs above-the-fold */}
        <div className="pdp-info-section">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="pdp-category-tag">{product.category || 'Luxury Footwear'}</span>
              <h1 className="pdp-product-title">{product.title || product.name}</h1>
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
                    salePrice: product.salePrice ? Number(String(product.salePrice).replace(/[^0-9.]/g, '')) : undefined,
                    image: activeVariantImage || images[activeImageIndex],
                  });
                }
              }}
              className="p-3 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors flex-shrink-0"
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-label="Wishlist"
            >
              <Heart
                size={22}
                className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500 transition-colors"}
              />
            </button>
          </div>

          {/* Pricing Box */}
          <div className="pdp-pricing-box">
            <span className="pdp-sale-price">{product.formattedPrice || product.price}</span>
            {product.formattedOriginalPrice && (
              <span className="pdp-original-price">{product.formattedOriginalPrice}</span>
            )}
            <span className="pdp-discount-badge">{product.discount || '15% OFF'}</span>
          </div>

          {/* Real-time Stock Status */}
          <div className="flex items-center gap-2 my-2">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className={`text-xs font-bold tracking-wide uppercase ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
              {isOutOfStock ? 'Sold Out' : currentStock <= 5 ? `Low Stock (Only ${currentStock} left)` : 'In Stock & Ready to Ship'}
            </span>
          </div>

          {/* Color Option Swatches */}
          <div className="pdp-option-group">
            <div className="flex justify-between items-center mb-1">
              <label className="pdp-option-label" style={{ marginBottom: 0 }}>Color Option</label>
              <span className="text-xs font-semibold text-purple-700">{currentColor || 'Selected'}</span>
            </div>
            <div className="pdp-color-swatches">
              {product.colors && product.colors.length > 0 ? (
                product.colors.map((hex, idx) => (
                  <div 
                    key={idx}
                    className={`pdp-color-dot ${selectedColorIndex === idx ? 'selected-color' : ''}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => handleColorChange(idx)}
                    title={`Select color ${hex}`}
                  />
                ))
              ) : (
                <div className="pdp-color-dot selected-color" style={{ backgroundColor: '#1F2937' }} />
              )}
            </div>
          </div>

          {/* Size Selection */}
          <div className="pdp-option-group">
            <div className="pdp-size-header">
              <label className="pdp-option-label">Select Size (EU):</label>
              <button className="pdp-size-chart-link" onClick={() => setShowSizeChart(true)}>
                <Ruler size={14} /> Size Chart
              </button>
            </div>
            <div className="pdp-sizes-row">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  className={`pdp-size-btn ${selectedSize === size ? 'active-size' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="pdp-option-group">
            <label className="pdp-option-label">Quantity:</label>
            <div className="pdp-quantity-wrapper">
              <button className="qty-btn" onClick={() => setQuantity(prev => Math.max(1, prev - 1))} aria-label="Decrease Quantity">
                <Minus size={16} />
              </button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity(prev => Math.min(currentStock, prev + 1))} aria-label="Increase Quantity">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Inline Stock & Validation Warning */}
          {stockWarning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 my-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg text-center"
            >
              {stockWarning}
            </motion.div>
          )}

          {/* Key Action Buttons: Add to Cart and Buy Now */}
          <div className="space-y-3 mt-4">
            <button 
              className="pdp-add-to-cart-btn" 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{ marginTop: 0 }}
            >
              <ShoppingBag size={18} /> {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>

            <button
              type="button"
              className="pdp-buy-now-btn"
              onClick={handleBuyNow}
              disabled={isOutOfStock || isSubmittingBuyNow}
            >
              <Zap size={18} /> {isSubmittingBuyNow ? 'Proceeding to Checkout...' : 'Buy Now'}
            </button>
          </div>

          {addedNotification && (
            <motion.p className="pdp-success-alert" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              ✓ Successfully added to cart!
            </motion.p>
          )}

          {/* ========================================== */}
          {/* HIGHLY VISIBLE ASSURANCES GRID             */}
          {/* ========================================== */}
          <div className="pdp-product-assurances-grid">
            <div className="assurance-card">
              <CheckCircle2 size={20} className="assurance-icon" />
              <div>
                <h5>Check Before You Pay</h5>
                <p>Inspect your order before payment.</p>
              </div>
            </div>

            <div className="assurance-card">
              <RefreshCw size={20} className="assurance-icon" />
              <div>
                <h5>7 Days Easy Return</h5>
                <p>Easy return within 7 days.</p>
              </div>
            </div>

            <div className="assurance-card highlight-bank-card">
              <Percent size={20} className="assurance-icon" />
              <div>
                <h5>5% OFF Bank Transfer</h5>
                <p>Get extra discount on direct payment.</p>
              </div>
            </div>

            <div className="assurance-card">
              <Truck size={20} className="assurance-icon" />
              <div>
                <h5>Nationwide Fast Delivery</h5>
                <p>Fast delivery across Pakistan.</p>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* FULL PRODUCT DESCRIPTION ACCORDION SECTION */}
          {/* ========================================== */}
          <div className="pdp-desc-accordion-container" style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsDescExpanded(!isDescExpanded)}>
                <h4 className="text-sm font-bold text-gray-900 tracking-wide uppercase m-0">About This Product</h4>
                <button type="button" className="text-purple-700 p-1">
                  {isDescExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {!isDescExpanded && (
                <p className="pdp-short-desc text-xs text-gray-600 line-clamp-2 mt-2 mb-0">
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
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pdp-short-desc text-xs text-gray-700 leading-relaxed mt-2 mb-0">
                      {activeDescription}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ========================================== */}
          {/* PRODUCT SPECIFICATIONS SECTION             */}
          {/* ========================================== */}
          <div className="pdp-accordion-wrapper">
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => setProductDetailsOpen(!productDetailsOpen)}>
                <span>Product Specifications</span>
                {productDetailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <AnimatePresence>
                {productDetailsOpen && (
                  <motion.div 
                    className="accordion-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <ul className="details-list">
                      <li>Embellishment: <strong>{productSpecs.embellishment}</strong></li>
                      <li>Heel Type: <strong>{productSpecs.heelType}</strong></li>
                      <li>Heel Height: <strong>{productSpecs.heelHeight}</strong></li>
                      <li>Lining Material: <strong>{productSpecs.liningMaterial}</strong></li>
                      <li>Shoe Sole: <strong>{productSpecs.shoeSole}</strong></li>
                      <li>Upper Material: <strong>{productSpecs.upperMaterial}</strong></li>
                      {productSpecs.extraSpecs && productSpecs.extraSpecs.map((spec, idx) => (
                        <li key={`extra-${idx}`}>{spec.label}: <strong>{spec.value}</strong></li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile-Optimized Curved Fly-to-Cart Animation Overlay */}
      <AnimatePresence>
        {flyingImage && (
          <motion.img
            key={flyingImage.id}
            src={flyingImage.src}
            initial={{
              position: 'fixed',
              top: flyingImage.y - 35,
              left: flyingImage.x - 35,
              width: 70,
              height: 70,
              opacity: 1,
              scale: 1,
              zIndex: 99999,
              pointerEvents: 'none',
              borderRadius: '12px',
            }}
            animate={{
              x: [0, flyingImage.targetX * 0.45, flyingImage.targetX],
              y: [0, flyingImage.targetY * 0.25 - 80, flyingImage.targetY],
              scale: [1, 0.7, 0.1],
              opacity: [1, 0.95, 0.15],
              rotate: [0, 10, 360],
            }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.45, 1],
            }}
            onAnimationComplete={() => setFlyingImage(null)}
            className="object-cover shadow-2xl border-2 border-purple-400 bg-white"
          />
        )}
      </AnimatePresence>

      {/* Size Chart Modal */}
      <AnimatePresence>
        {showSizeChart && (
          <div className="pdp-modal-overlay" onClick={() => setShowSizeChart(false)}>
            <motion.div 
              className="pdp-modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <button className="pdp-modal-close" onClick={() => setShowSizeChart(false)}>
                <X size={20} />
              </button>
              <h2>Footwear Size Chart (EU)</h2>
              <p>Find your perfect fit using standard European shoe measurements.</p>
              <table className="size-chart-table">
                <thead>
                  <tr>
                    <th>EU Size</th>
                    <th>US Women</th>
                    <th>US Men</th>
                    <th>Foot Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>36</td><td>5.5</td><td>4.5</td><td>22.5 cm</td></tr>
                  <tr><td>37</td><td>6.5</td><td>5.5</td><td>23.2 cm</td></tr>
                  <tr><td>39</td><td>8.0</td><td>7.0</td><td>24.5 cm</td></tr>
                  <tr><td>40</td><td>8.5</td><td>7.5</td><td>25.1 cm</td></tr>
                  <tr><td>41</td><td>9.5</td><td>8.5</td><td>25.8 cm</td></tr>
                </tbody>
              </table>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
