// app/storefront/utils/discount.js

/**
 * Universal dynamic discount percentage calculator.
 * Ensures every single product on sale across the entire site
 * dynamically calculates and displays its discount percentage badge (e.g., 'XX% OFF').
 *
 * @param {object} product
 * @returns {string|null} e.g. '25% OFF' or null if not on sale
 */
export function getProductDiscountBadge(product) {
  if (!product || typeof product !== 'object') return null;

  // 1. Direct explicit discount percentage field
  const explicitPct = product.discountPercentage ?? product.discountPercent;
  if (typeof explicitPct === 'number' && explicitPct > 0) {
    return `${Math.round(explicitPct)}% OFF`;
  }

  // 2. Pre-formatted or numeric discount property
  if (product.discount !== undefined && product.discount !== null && product.discount !== 0) {
    if (typeof product.discount === 'number' && product.discount > 0) {
      return `${Math.round(product.discount)}% OFF`;
    }
    if (typeof product.discount === 'string') {
      const match = product.discount.match(/\d+/);
      if (match && parseInt(match[0], 10) > 0) {
        return `${parseInt(match[0], 10)}% OFF`;
      }
    }
  }

  // 3. Price-based discount calculation
  const parseNum = (val) => {
    if (val === undefined || val === null) return 0;
    const clean = String(val).replace(/[^0-9.]/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const currPrice = parseNum(product.price);
  const origPrice = parseNum(product.originalPrice || product.compareAtPrice || product.regularPrice);
  const salePrice = parseNum(product.salePrice || product.discountPrice || product.discounted_price);

  // If original compare-at price is higher than current price
  if (origPrice > currPrice && currPrice > 0) {
    const pct = Math.round(((origPrice - currPrice) / origPrice) * 100);
    if (pct > 0) return `${pct}% OFF`;
  }

  // If salePrice holds the original higher MSRP
  if (salePrice > currPrice && currPrice > 0) {
    const pct = Math.round(((salePrice - currPrice) / salePrice) * 100);
    if (pct > 0) return `${pct}% OFF`;
  }

  // If currPrice is original price and salePrice is lower selling price
  if (salePrice > 0 && currPrice > salePrice) {
    const pct = Math.round(((currPrice - salePrice) / currPrice) * 100);
    if (pct > 0) return `${pct}% OFF`;
  }

  return null;
}
