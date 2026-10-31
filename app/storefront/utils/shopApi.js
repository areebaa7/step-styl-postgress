// app/storefront/utils/shopApi.js
import { getProductDiscountBadge } from './discount';

/**
 * Robust and safe product fetcher with guaranteed fallback and zero crashes
 * @param {string|null} genderOrCategory 
 * @returns {Promise<Array>}
 */
export async function fetchProducts(genderOrCategory = null) {
  try {
    // Build query params dynamically to support filtering server-side
    let url = '/api/products';
    if (genderOrCategory && typeof genderOrCategory === 'string' && genderOrCategory.toUpperCase() !== 'ALL') {
      const cleanTarget = genderOrCategory.toLowerCase().trim();
      const queryVal = encodeURIComponent(cleanTarget);
      if (['men', 'women', 'kids', 'unisex'].includes(cleanTarget)) {
        url += `?gender=${queryVal}`;
      } else {
        url += `?category=${queryVal}`;
      }
    }

    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    }).catch((fetchErr) => {
      console.warn(`[shopApi] Network fetch failed for ${url}:`, fetchErr?.message || fetchErr);
      return null;
    });

    if (!response) {
      return [];
    }

    if (!response.ok) {
      console.warn(`[shopApi] Non-200 response from ${url} (status: ${response.status})`);
      return [];
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`[shopApi] Expected JSON from ${url} but received: ${contentType}`);
      return [];
    }
    
    const json = await response.json().catch((jsonErr) => {
      console.warn(`[shopApi] JSON parse error from ${url}:`, jsonErr);
      return null;
    });

    if (!json || (!json.success && !Array.isArray(json.data) && !Array.isArray(json))) {
      return [];
    }

    const rawList = Array.isArray(json.data) 
      ? json.data 
      : Array.isArray(json) 
      ? json 
      : [];

    return rawList.map((product) => {
      if (!product || typeof product !== 'object') return null;

      // Calculate total stock from variants to guarantee correct out-of-stock evaluation
      const variants = Array.isArray(product.variants) ? product.variants : [];
      const totalStock = variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0);
      const computedInStock = product.inStock === false || (variants.length > 0 && totalStock === 0) ? false : true;

      const rawPrice = Number(product.price) || 0;
      const rawSalePrice = product.salePrice ? Number(product.salePrice) : null;
      const discountBadge = getProductDiscountBadge(product);

      return {
        id: String(product.id || product.slug || Math.random().toString(36).slice(2)),
        title: product.title || product.name || 'Footwear',
        slug: product.slug || String(product.id || ''),
        price: rawPrice,
        formattedPrice: `Rs.${rawPrice.toLocaleString()}`,
        originalPrice: rawSalePrice,
        formattedOriginalPrice: rawSalePrice ? `Rs.${rawSalePrice.toLocaleString()}` : null,
        compareAtPrice: rawSalePrice,
        discount: discountBadge,
        discountPercentage: discountBadge ? parseInt(discountBadge, 10) : 0,
        image: product.image || (Array.isArray(product.images) && product.images[0]) || '/logo_main.png',
        images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image].filter(Boolean),
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        gender: (product.gender || 'unisex').toLowerCase(),
        category: (product.category || 'footwear').toLowerCase(),
        collection: product.collection?.name || product.collection || '',
        collectionId: product.collectionId || null,
        sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? Array.from(new Set(product.sizes.map(String).map((s) => s.trim()).filter(Boolean))) : ['36', '37', '38', '39', '40'],
        colors: Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : ['#1F2937'],
        variants: variants,
        colorVariants: variants,
        inStock: computedInStock,
        details: product.specifications || {},
      };
    }).filter(Boolean);
  } catch (error) {
    console.warn('[shopApi] Safe fallback triggered on catalog fetch:', error?.message || error);
    return [];
  }
}
