'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import { fetchProducts } from './utils/shopApi';
import './ShopPage.css';

export default function KidsShopPage({ onAddToCart, setCurrentPage }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const fetched = await fetchProducts('kids');
      setProducts(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.warn('Failed to load kids products:', err);
      setProducts([]);
      setFetchError("Unable to load kids' collection right now. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const itemsPerPage = 6;
  const safeProducts = Array.isArray(products) ? products : [];
  const strictKidsProducts = safeProducts.filter(item => {
    if (!item) return false;
    const g = (item.gender || '').toLowerCase().trim();
    const cat = (item.category || '').toLowerCase().trim();
    const colName = (item.collection?.name || '').toLowerCase().trim();
    const colGender = (item.collection?.targetGender || '').toLowerCase().trim();
    return g === 'kids' || cat === 'kids' || colGender === 'kids' || colName.includes('kids');
  });

  const totalPages = Math.ceil(strictKidsProducts.length / itemsPerPage) || 1;
  const paginatedProducts = strictKidsProducts.slice((currentPageNum - 1) * itemsPerPage, currentPageNum * itemsPerPage);

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
        Kids' Collection
      </motion.h1>

      <div className="shop-filter-bar">
        <p className="results-count">
          Showing {strictKidsProducts.length > 0 ? (currentPageNum - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPageNum * itemsPerPage, strictKidsProducts.length)} of {strictKidsProducts.length} results
        </p>
        <div className="filter-dropdown-btn"><span>Default sorting</span></div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>Loading collection...</div>
      ) : fetchError ? (
        <div className="shop-error-banner">
          <p>{fetchError}</p>
          <button className="shop-retry-btn" onClick={loadData}>Try Again</button>
        </div>
      ) : strictKidsProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>No kids' products available yet. Add them in your admin panel!</div>
      ) : (
        <div className="shop-products-grid">
          {paginatedProducts.map((product, index) => {
            const variants = Array.isArray(product.variants) ? product.variants : [];
            const totalStock = variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0);
            const isOutOfStock = product.inStock === false || (variants.length > 0 && totalStock === 0);

            return (
              <motion.div 
                key={product.id || index}
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
                  <img src={product.image || '/logo_main.png'} alt={product.title} className={isOutOfStock ? 'opacity-50 grayscale-[25%]' : ''} />
                </div>
                <div className="shop-color-swatches">
                  {Array.isArray(product.colors) && product.colors.map((colorName, idx) => (
                    <span key={idx} className="shop-swatch-dot" title={colorName} style={{ backgroundColor: colorName || '#1F2937' }} />
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
            <button key={num} className={`page-btn ${currentPageNum === num ? 'active-page' : ''}`} onClick={() => setCurrentPageNum(num)}>
              {num}
            </button>
          ))}
          <button className="page-btn" onClick={() => setCurrentPageNum(prev => Math.min(prev + 1, totalPages))} disabled={currentPageNum === totalPages}>
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}