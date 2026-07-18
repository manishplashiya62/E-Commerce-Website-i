/**
 * E-Commerce Product Search Logic
 */

/**
 * Filter products by search query
 * @param {Array} products - Array of product objects
 * @param {string} query - Search text query
 * @returns {Array} Filtered list of products
 */
export function filterProductsBySearch(products, query) {
  if (!query || !query.trim()) return products;
  
  const cleanQuery = query.trim().toLowerCase();
  
  return products.filter(product => {
    return (
      product.name.toLowerCase().includes(cleanQuery) ||
      product.description.toLowerCase().includes(cleanQuery) ||
      product.category.toLowerCase().includes(cleanQuery) ||
      product.brand.toLowerCase().includes(cleanQuery) ||
      (product.features && product.features.some(f => f.toLowerCase().includes(cleanQuery)))
    );
  });
}
