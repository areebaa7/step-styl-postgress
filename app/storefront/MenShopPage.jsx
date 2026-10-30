/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import { fetchProducts } from './utils/shopApi';
import './ShopPage.css';

export default function MenShopPage({ onAddToCart, setCurrentPage }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [currentPage, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Explicitly pass query parameter 'men' to the API so backend filters strictly
      const fetched = await fetchProducts('men');
      setProducts(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.warn('Failed to load men products:', err);
      setProducts([]);
      setFetchError("Unable to load men's collection right now. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Strict isolation for Men products only on frontend as a backup safeguard
  const safeProducts = Array.isArray(products) ? products : [];
  const strictMenProducts = safeProducts.filter(item => {
    if (!item) return false;
    const g = (item.gender || '').toLowerCase().trim();
    const colName = (item.collection?.name || '').toLowerCase().trim();
    const colGender = (item.collection?.targetGender || '').toLowerCase().trim();
    if (g === 'men' || g === 'male') return true;
    if (colGender === 'men' || colName.includes('men')) return true;
    return false;
  });

  // Flexible subcategory filtering handling singular/plural mismatches (e.g. 'sneaker' vs 'sneakers')
  const filtered = activeSubcategory === 'all'
    ? strictMenProducts
    : strictMenProducts.filter(item => {
        const itemCategory = (item.category || '').toLowerCase().trim();
        const itemCol = (item.collection?.name || item.collection?.slug || '').toLowerCase().trim();
        const itemTitle = (item.title || item.name || '').toLowerCase().trim();
        const targetSub = activeSubcategory.toLowerCase().trim();
        return itemCategory.includes(targetSub) || itemCol.includes(targetSub) || itemTitle.includes(targetSub);
      });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    setCurrentPageNum(1);
  };

  const categoriesList = [
    { id: 'all', label: 'All Men', image: '/assets/sneaker-1.jpeg' },
    { id: 'sneaker', label: 'Sneakers', image: '/assets/sneaker-2.jpeg' },
    { id: 'formal', label: 'Formal', image: '/assets/men-formal2.jpeg' },
    { id: 'casual', label: 'Casual', image: '/assets/men-sandals.jpeg' },
  ];

  // Tripled array for smooth infinite ticker looping
  const loopingCategories = [...categoriesList, ...categoriesList, ...categoriesList];

  if (selectedProduct) {
    return (
      <ProductDetail 
        product={selectedProduct} 
        onBack={() => setSelectedProduct(null)} 
        onAddToCart={onAddToCart}
        setCurrentPage={setCurrentPage}
      />
    );
  }

  return (
    <div className="shop-page-container">
      <motion.h1 
        className="shop-main-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Men's Collection
      </motion.h1>

      <div className="shop-categories-row">
        <div className="categories-ticker-track">
          {loopingCategories.map((cat, idx) => (
            <div 
              key={`${cat.id}-${idx}`}
              className={`category-circle-item ${activeSubcategory === cat.id ? 'active' : ''}`} 
              onClick={() => handleSubcategoryChange(cat.id)}
            >
              <div className="circle-image-wrapper">
                <img src={cat.image} alt={cat.label} />
              </div>
              <span className="category-label">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="shop-filter-bar">
        <p className="results-count">Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results</p>
        <div className="filter-dropdown-btn"><span>Default sorting</span></div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>Loading men's collection...</div>
      ) : fetchError ? (
        <div className="shop-error-banner">
          <p>{fetchError}</p>
          <button className="shop-retry-btn" onClick={loadData}>Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>No products found in this category. Add them in your admin panel!</div>
      ) : (
        <div className="shop-products-grid">
          {paginatedProducts.map((product, index) => {
            const variants = Array.isArray(product.variants) ? product.variants : [];
            const totalStock = variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0);
            const isOutOfStock = product.inStock === false || (variants.length > 0 && totalStock === 0);

            return (
              <motion.div 
                key={product.id}
                className="shop-product-card relative cursor-pointer"
                onClick={() => setSelectedProduct(product)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="shop-image-box relative overflow-hidden">
                  {product.discount && !isOutOfStock && <span className="shop-discount-tag">{product.discount}</span>}
                  
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 shadow-md">
                        Sold Out
                      </span>
                    </div>
                  )}

                  <img 
                    src={product.image || '/logo_main.png'} 
                    alt={product.title} 
                    className={isOutOfStock ? 'opacity-50 grayscale-[25%]' : ''} 
                  />
                </div>

                <div className="shop-color-swatches">
                  {Array.isArray(product.colors) && product.colors.map((hex, idx) => (
                    <span key={idx} className="shop-swatch-dot" title={hex} style={{ backgroundColor: hex || '#1F2937' }} />
                  ))}
                </div>
                <h3 className="shop-product-title">{product.title}</h3>
                <div className="shop-pricing-box">
                  {product.formattedOriginalPrice && <span className="shop-original-price">{product.formattedOriginalPrice}</span>}
                  <span className="shop-sale-price">{product.formattedPrice}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="shop-pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button key={num} className={`page-btn ${currentPage === num ? 'active-page' : ''}`} onClick={() => setCurrentPageNum(num)}>
              {num}
            </button>
          ))}
          <button className="page-btn" onClick={() => setCurrentPageNum(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}