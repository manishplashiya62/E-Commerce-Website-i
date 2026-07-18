/**
 * E-Commerce Product Filters Logic
 */

/**
 * Filter products by sidebar criteria
 * @param {Array} products - Array of product objects
 * @param {Object} criteria - Active filter state
 * @returns {Array} Filtered list of products
 */
export function filterProductsBySidebar(products, criteria) {
  return products.filter(product => {
    // 1. Category Filter
    if (criteria.categories && criteria.categories.length > 0) {
      if (!criteria.categories.includes(product.category)) {
        return false;
      }
    }
    
    // 2. Brand Filter
    if (criteria.brands && criteria.brands.length > 0) {
      if (!criteria.brands.includes(product.brand)) {
        return false;
      }
    }
    
    // 3. Price Filter
    if (product.price < criteria.minPrice || product.price > criteria.maxPrice) {
      return false;
    }
    
    // 4. In Stock Filter
    if (criteria.inStockOnly && !product.inStock) {
      return false;
    }
    
    return true;
  });
}
