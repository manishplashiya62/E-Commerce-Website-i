/**
 * E-Commerce Wishlist Controller
 */

import { formatPrice, qs, qsa, showToast } from './utils.js';
import { getWishlist, removeFromWishlist, addToCart } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  // Wait for components to initialize
  setTimeout(() => {
    initWishlistPage();
  }, 300);
});

function initWishlistPage() {
  renderWishlist();
  
  // Register local storage listener
  window.addEventListener('wishlistUpdated', renderWishlist);
}

function renderWishlist() {
  const container = qs('#wishlist-page-content');
  if (!container) return;

  const wishlist = getWishlist();

  if (wishlist.length === 0) {
    renderEmptyWishlist(container);
    return;
  }

  // Render wishlist cards grid
  container.innerHTML = `
    <div class="products-grid" id="wishlist-grid">
      ${wishlist.map(product => `
        <div class="card product-card" data-id="${product.id}">
          <button class="product-card-wishlist active" data-action="remove" aria-label="Remove from Wishlist">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          
          <div class="product-card-img" onclick="window.location.href='product-details.html?id=${product.id}'" style="cursor:pointer;">
            <img src="${product.image}" alt="${product.name}">
          </div>
          
          <div class="product-card-body">
            <span class="product-card-category">${product.category}</span>
            <h3 class="product-card-title" onclick="window.location.href='product-details.html?id=${product.id}'" style="cursor:pointer;">${product.name}</h3>
            <div class="product-card-price-row" style="margin-top: 0.5rem;">
              <span class="product-card-price">${formatPrice(product.price)}</span>
            </div>
          </div>
          
          <div class="product-card-footer" style="display: flex; gap: 0.5rem; flex-direction: column;">
            <button class="btn btn-primary product-card-btn" data-action="move-to-cart" style="width: 100%;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              Move to Cart
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  bindWishlistListeners(wishlist);
}

function renderEmptyWishlist(container) {
  container.innerHTML = `
    <div class="card empty-cart-container">
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1.5rem;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      <h2 class="empty-cart-title">Your Wishlist is Empty</h2>
      <p class="empty-cart-desc">Keep track of your favorite items here. Start browsing now to fill it up!</p>
      <a href="products.html" class="btn btn-primary">Start Browsing</a>
    </div>
  `;
}

function bindWishlistListeners(wishlistItems) {
  // Remove button action
  qsa('[data-action="remove"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.product-card');
      const id = parseInt(card.getAttribute('data-id'));
      const product = wishlistItems.find(p => p.id === id);
      
      if (product) {
        removeFromWishlist(id);
        showToast(`${product.name} removed from wishlist.`, 'info');
      }
    });
  });

  // Move to Cart action
  qsa('[data-action="move-to-cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      const id = parseInt(card.getAttribute('data-id'));
      const product = wishlistItems.find(p => p.id === id);
      
      if (product) {
        // Move requires: 1. Add to cart, 2. Remove from wishlist
        // Re-construct matching product details structure
        const cartProduct = {
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.price,
          images: [product.image],
          category: product.category
        };
        
        addToCart(cartProduct, 1);
        removeFromWishlist(id);
        
        showToast(`${product.name} moved to cart!`, 'success');
      }
    });
  });
}
