'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ArrowRight, Tag } from 'lucide-react';
import { formatPKR } from '@/lib/currency';

interface LiveSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: any) => void;
}

const POPULAR_SUGGESTIONS = ['Bridal Heels', 'Formal Oxford', 'Sneakers', 'Loafers', 'Slippers', 'Casual'];

export default function LiveSearchBar({ isOpen, onClose, onSelectProduct }: LiveSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Debounced live search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setResults(json.data.slice(0, 10)); // Top 10 matches
        } else {
          setResults([]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (product: any) => {
    onClose();
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    router.push(`/products/${product.slug || product.id}`);
  };

  const handleViewAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col justify-start bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-10 animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="absolute inset-0 -z-10" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
          >
            {/* Search Input Bar */}
            <form onSubmit={handleViewAll} className="relative flex items-center border-b border-gray-100 px-4 py-4 sm:px-6">
              <Search className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by footwear style, title, category, or collection..."
                className="w-full text-base sm:text-lg text-gray-900 placeholder:text-gray-400 outline-none bg-transparent font-medium"
              />
              {isLoading && <Loader2 className="w-5 h-5 text-purple-600 animate-spin mr-2 flex-shrink-0" />}
              {query && !isLoading && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 mr-2"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition text-xs font-bold"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Suggestion Chips (when query is empty) */}
            {!query.trim() && (
              <div className="p-6 overflow-y-auto">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-3 flex items-center gap-1.5">
                  <Tag size={13} /> Popular Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuery(tag)}
                      className="px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold tracking-wide transition border border-purple-100"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results List */}
            {query.trim().length >= 2 && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
                {results.length > 0 ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                      Showing top {results.length} results for &ldquo;{query}&rdquo;
                    </p>
                    <div className="divide-y divide-gray-100">
                      {results.map((product) => {
                        const price = product.discount && product.discount > 0
                          ? Math.round(product.price * (1 - product.discount / 100))
                          : product.price;

                        const imgUrl = product.image || (Array.isArray(product.images) && product.images[0]) || '/logo_main.png';

                        return (
                          <div
                            key={product.id || product.slug}
                            onClick={() => handleSelect(product)}
                            className="flex items-center gap-4 p-2.5 sm:p-3 rounded-xl hover:bg-purple-50/60 transition cursor-pointer group"
                          >
                            {/* Product Thumbnail */}
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#F4F4F5] overflow-hidden flex-shrink-0 flex items-center justify-center p-1 border border-gray-100">
                              <Image
                                src={imgUrl}
                                alt={product.title}
                                fill
                                sizes="64px"
                                className="object-contain p-1 group-hover:scale-105 transition duration-300"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded">
                                  {product.category || product.gender || 'Footwear'}
                                </span>
                                {product.inStock === false && (
                                  <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                    Sold Out
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition truncate mt-0.5">
                                {product.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-gray-900">
                                  {formatPKR(price)}
                                </span>
                                {product.discount && product.discount > 0 ? (
                                  <span className="text-[11px] text-gray-400 line-through">
                                    {formatPKR(product.price)}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Right Arrow */}
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : !isLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    <p className="text-sm font-medium">No footwear matching &ldquo;{query}&rdquo;.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try searching with broader terms like &ldquo;heels&rdquo;, &ldquo;sneakers&rdquo;, or &ldquo;oxford&rdquo;.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Footer with "View All Results" */}
            {query.trim().length >= 2 && results.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  Press Enter to view all results
                </span>
                <button
                  type="button"
                  onClick={() => handleViewAll()}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition"
                >
                  View All in Catalog <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
