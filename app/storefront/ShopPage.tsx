/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ProductDetail from './ProductDetail';
import StorefrontProductCard from './StorefrontProductCard';
import { fetchProducts } from './utils/shopApi';
import type { CollectionDTO } from '@/types/product';
import './ShopPage.css';

interface ShopPageProps {
  setCurrentPage: (page: string) => void;
  onAddToCart: (item: any) => void;
}

export default function ShopPage({ setCurrentPage, onAddToCart }: ShopPageProps) {
  const [productCatalog, setProductCatalog] = useState<any[]>([]);
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setLoading(true);
      try {
        const [fetchedProducts, collectionsRes] = await Promise.all([
          fetchProducts(),
          fetch('/api/collections').then((r) => r.json()).catch(() => ({ collections: [] })),
        ]);

        if (isMounted) {
          setProductCatalog(Array.isArray(fetchedProducts) ? fetchedProducts : []);
          if (collectionsRes && Array.isArray(collectionsRes.collections)) {
            setCollections(collectionsRes.collections);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load shop catalog:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadCatalog();
    return () => { isMounted = false; };
  }, []);

  // Filter products dynamically by selected collection
  const filteredProducts = useMemo(() => {
    if (selectedCollection === 'all') return productCatalog;
    const target = String(selectedCollection).toLowerCase().trim();

    return productCatalog.filter((item) => {
      const colId = String(item.collectionId || '').toLowerCase().trim();
      const colName = String(item.collection?.name || '').toLowerCase().trim();
      const colSlug = String(item.collection?.slug || '').toLowerCase().trim();
      const cat = String(item.category || '').toLowerCase().trim();
      const gender = String(item.gender || '').toLowerCase().trim();

      return (
        colId === target ||
        colName === target ||
        colSlug === target ||
        colName.includes(target) ||
        colSlug.includes(target) ||
        cat === target ||
        gender === target
      );
    });
  }, [productCatalog, selectedCollection]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPageNum - 1) * itemsPerPage,
    currentPageNum * itemsPerPage
  );

  const handleCollectionSelect = (colId: string) => {
    setSelectedCollection(colId);
    setCurrentPageNum(1);
  };

  // Build dynamic collection selector items
  const dynamicCategories = useMemo(() => {
    const list = [
      { id: 'all', label: 'All Footwear', image: '/assets/women-formal.jpg' },
    ];

    if (collections.length > 0) {
      collections.forEach((c) => {
        list.push({
          id: c.slug || c.id,
          label: c.name,
          image: c.image || '/assets/shoe-2.jpeg',
        });
      });
    } else {
      list.push(
        { id: 'women', label: 'Women', image: '/assets/women-mustardshoes.jpeg' },
        { id: 'men', label: 'Men', image: '/assets/sneaker-4.jpeg' },
        { id: 'kids', label: 'Kids', image: '/assets/kids-2.jpeg' }
      );
    }
    return list;
  }, [collections]);

  // Tripled array for smooth infinite ticker looping
  const loopingCategories = [...dynamicCategories, ...dynamicCategories, ...dynamicCategories];

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

  const activeColObj = collections.find((c) => (c.slug || c.id) === selectedCollection);
  const displayTitle = selectedCollection === 'all'
    ? 'Shop Footwear Collection'
    : `${activeColObj ? activeColObj.name : selectedCollection.toUpperCase()} Collection`;

  return (
    <div className="shop-page-container">
      <motion.h1 
        className="shop-main-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {displayTitle}
      </motion.h1>

      {/* Dynamic Collection Circle Selector */}
      <div className="shop-categories-row">
        <div className="categories-ticker-track">
          {loopingCategories.map((cat, idx) => {
            const isSelected = selectedCollection === cat.id;
            return (
              <div 
                key={`${cat.id}-${idx}`}
                className={`category-circle-item ${isSelected ? 'active' : ''}`} 
                onClick={() => handleCollectionSelect(cat.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`circle-image-wrapper ${isSelected ? 'ring-2 ring-[#9b4de0] ring-offset-2' : ''}`}>
                  <img src={cat.image} alt={cat.label} />
                </div>
                <span className={`category-label ${isSelected ? 'font-bold text-[#9b4de0]' : ''}`}>
                  {cat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shop-filter-bar">
        <p className="results-count">
          Showing {filteredProducts.length > 0 ? (currentPageNum - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPageNum * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
          {selectedCollection !== 'all' && (
            <button
              onClick={() => handleCollectionSelect('all')}
              className="ml-3 text-xs text-purple-600 underline font-semibold hover:text-purple-800"
            >
              Clear filter
            </button>
          )}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#6B7280' }}>
          Loading catalog from database...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#6B7280' }}>
          <p className="text-base font-semibold text-gray-700">No products found in this collection.</p>
          <button
            onClick={() => handleCollectionSelect('all')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-purple-700"
          >
            View All Shoes
          </button>
        </div>
      ) : (
        <div className="shop-products-grid">
          {paginatedProducts.map((product, index) => (
            <StorefrontProductCard 
              key={product.id || index}
              product={product}
              index={index}
              onSelectProduct={setSelectedProduct}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="shop-pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button 
              key={num} 
              className={`page-btn ${currentPageNum === num ? 'active-page' : ''}`} 
              onClick={() => {
                setCurrentPageNum(num);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
            >
              {num}
            </button>
          ))}
          <button 
            className="page-btn" 
            onClick={() => {
              setCurrentPageNum(prev => Math.min(prev + 1, totalPages));
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }} 
            disabled={currentPageNum === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
