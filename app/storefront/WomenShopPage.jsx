/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import StorefrontProductCard from './StorefrontProductCard';
import { fetchProducts } from './utils/shopApi';
import './ShopPage.css';

export default function WomenShopPage({ onAddToCart, setCurrentPage, initialSubcategory = "all" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory);

  useEffect(() => {
    if (initialSubcategory) {
      setActiveSubcategory(initialSubcategory);
    }
  }, [initialSubcategory]);
  const [currentPage, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Fetch all products to ensure category-specific items are not filtered out by the backend query
      const fetched = await fetchProducts();
      setProducts(Array.isArray(fetched) ? fetched : (fetched?.data || []));
    } catch (err) {
      console.warn('Failed to load women products:', err);
      setProducts([]);
      setFetchError("Unable to load women's collection right now. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Robust gender isolation: matches women, female, or items where gender is unassigned/loose
  const safeProducts = Array.isArray(products) ? products : [];
  const strictWomenProducts = safeProducts.filter(item => {
    if (!item) return false;
    const g = (item.gender || '').toLowerCase().trim();
    const colName = (item.collection?.name || '').toLowerCase().trim();
    const colGender = (item.collection?.targetGender || '').toLowerCase().trim();
    const title = (item.title || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    
    if (g === 'women' || g === 'female') return true;
    if (colGender === 'women' || colName.includes('women')) return true;
    if (category === 'bridal') return true;

    return g === 'unisex' || (!g.includes('men') && !g.includes('kids') && (category.includes('women') || title.includes('women') || g === ''));
  });

  // Bulletproof subcategory matching that handles casual, bridal, and formal keywords
  const filtered = activeSubcategory === 'all'
    ? strictWomenProducts
    : strictWomenProducts.filter(item => {
        const itemCat = (item.category || '').toLowerCase().trim();
        const itemSub = (item.subcategory || '').toLowerCase().trim();
        const itemTitle = (item.title || item.name || '').toLowerCase().trim();
        const itemCol = (item.collection?.name || item.collection?.slug || '').toLowerCase().trim();
        const targetSub = activeSubcategory.toLowerCase().trim();
        
        return itemCat.includes(targetSub) || itemSub.includes(targetSub) || itemTitle.includes(targetSub) || itemCol.includes(targetSub);
      });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    setCurrentPageNum(1);
  };

  const categoriesList = [
    { id: 'all', label: 'All Women', image: '/assets/shoe-7.jpeg' },
    { id: 'casual', label: 'Casual', image: '/assets/shoe-2.jpeg' },
    { id: 'bridal', label: 'Bridal', image: '/assets/shoe-5.jpg' },
    { id: 'formal', label: 'Formal', image: '/assets/women-formal.jpg' },
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
        Women's Collection
      </motion.h1>

      {/* Category Circle Infinite Carousel Selector */}
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
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>Loading women's collection...</div>
      ) : fetchError ? (
        <div className="shop-error-banner">
          <p>{fetchError}</p>
          <button className="shop-retry-btn" onClick={loadData}>Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>No products found in this category. Add them in your admin panel!</div>
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