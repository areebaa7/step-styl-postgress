'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import StorefrontProductCard from './StorefrontProductCard';
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
          {paginatedProducts.map((product, index) => (
            <StorefrontProductCard
              key={product.id || index}
              product={product}
              index={index}
              onSelectProduct={setSelectedProduct}
              onAddToCart={onAddToCart}
            />
          ))}
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