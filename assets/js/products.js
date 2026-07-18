/**
 * E-Commerce Product Listing Controller
 */

import { formatPrice, renderStars, qs, qsa, showToast } from './utils.js';
import { addToCart, toggleWishlist, isInWishlist } from './storage.js';
import { filterProductsBySearch } from './search.js';
import { filterProductsBySidebar } from './filter.js';

// Page States
let allProducts = [];
let filteredProducts = [];
let activeFilters = {
  categories: [],
  brands: [],
  minPrice: 0,
  maxPrice: 40000,
  inStockOnly: false
};
let sortOption = 'default';
let layoutMode = localStorage.getItem('layout_mode') || 'grid';
let currentPage = 1;
const itemsPerPage = 6;

document.addEventListener('DOMContentLoaded', async () => {
  // Wait slightly to let app.js load navigation bar placeholders
  setTimeout(async () => {
    await initProductsPage();
  }, 300);
});

async function initProductsPage() {
  // 1. Fetch products
  try {
    const res = await fetch('data/products.json');
    if (res.ok) {
      allProducts = await res.json();
      filteredProducts = [...allProducts];
    }
  } catch (err) {
    console.error('Failed to load products list:', err);
    return;
  }

  // 2. Read URL Search Parameters (e.g. ?category=electronics or ?search=watch)
  parseUrlParams();

  // 3. Set up initial UI states
  setupFiltersUI();
  setupLayoutToggle();
  setupSortControl();
  
  // 4. Bind event listeners
  bindFilterListeners();
  
  // 5. Apply filters and render
  applyAllFiltersAndRender();
}

// Read URL parameters and pre-check filters
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  
  // Category parameter
  const catParam = params.get('category');
  if (catParam) {
    activeFilters.categories = [catParam];
    // Mark active link in navbar if possible
    const navLink = qs(`#nav-${catParam}`);
    if (navLink) navLink.classList.add('active');
  }

  // Search parameter
  const searchParam = params.get('search');
  if (searchParam) {
    const searchInput = qs('#global-search-input');
    if (searchInput) searchInput.value = searchParam;
    // We will apply search query during filtering process
  }
}

// Draw checkboxes and set price ranges
function setupFiltersUI() {
  // Dynamically extract brands from catalog
  const brands = [...new Set(allProducts.map(p => p.brand))];
  const brandContainer = qs('#brand-filter-options');
  
  if (brandContainer) {
    brandContainer.innerHTML = brands.map(brand => `
      <label class="filter-checkbox-lbl">
        <input type="checkbox" class="filter-checkbox brand-cb" value="${brand}">
        ${brand}
      </label>
    `).join('');
  }

  // Pre-check category checkbox matching URL param
  if (activeFilters.categories.length > 0) {
    const catCb = qs(`.category-cb[value="${activeFilters.categories[0]}"]`);
    if (catCb) catCb.checked = true;
  }

  // Max price calculation
  const prices = allProducts.map(p => p.price);
  const maxVal = Math.max(...prices, 40000);
  activeFilters.maxPrice = maxVal;

  const priceSlider = qs('#price-range-slider');
  const priceDisplay = qs('#price-max-display');
  
  if (priceSlider && priceDisplay) {
    priceSlider.max = maxVal;
    priceSlider.value = maxVal;
    priceDisplay.textContent = formatPrice(maxVal);
  }
}

// Setup Layout Switcher grid/list view
function setupLayoutToggle() {
  const gridBtn = qs('#toggle-grid');
  const listBtn = qs('#toggle-list');
  const gridContainer = qs('#products-catalog-grid');

  if (!gridBtn || !listBtn || !gridContainer) return;

  // Set initial layout
  if (layoutMode === 'list') {
    gridContainer.classList.add('list-view');
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
  } else {
    gridContainer.classList.remove('list-view');
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  }

  gridBtn.addEventListener('click', () => {
    layoutMode = 'grid';
    localStorage.setItem('layout_mode', 'grid');
    gridContainer.classList.remove('list-view');
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
    renderProducts();
  });

  listBtn.addEventListener('click', () => {
    layoutMode = 'list';
    localStorage.setItem('layout_mode', 'list');
    gridContainer.classList.add('list-view');
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
    renderProducts();
  });
}

// Setup Sorting options dropdown
function setupSortControl() {
  const sortSelect = qs('#sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortOption = e.target.value;
      currentPage = 1;
      applyAllFiltersAndRender();
    });
  }
}

// Bind active listeners to filters controls
function bindFilterListeners() {
  // Category changes
  qsa('.category-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      activeFilters.categories = [...qsa('.category-cb:checked')].map(el => el.value);
      currentPage = 1;
      applyAllFiltersAndRender();
    });
  });

  // Brand changes
  qsa('.brand-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      activeFilters.brands = [...qsa('.brand-cb:checked')].map(el => el.value);
      currentPage = 1;
      applyAllFiltersAndRender();
    });
  });

  // Price slider changes
  const priceSlider = qs('#price-range-slider');
  const priceDisplay = qs('#price-max-display');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      activeFilters.maxPrice = val;
      priceDisplay.textContent = formatPrice(val);
    });
    
    priceSlider.addEventListener('change', () => {
      currentPage = 1;
      applyAllFiltersAndRender();
    });
  }

  // Stock checkbox changes
  const stockCb = qs('#stock-only-cb');
  if (stockCb) {
    stockCb.addEventListener('change', (e) => {
      activeFilters.inStockOnly = e.target.checked;
      currentPage = 1;
      applyAllFiltersAndRender();
    });
  }

  // Reset filter button
  const resetBtn = qs('#reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Reset variables
      activeFilters.categories = [];
      activeFilters.brands = [];
      const prices = allProducts.map(p => p.price);
      const maxVal = Math.max(...prices, 40000);
      activeFilters.maxPrice = maxVal;
      activeFilters.inStockOnly = false;
      
      // Reset inputs in UI
      qsa('.category-cb:checked, .brand-cb:checked').forEach(cb => cb.checked = false);
      if (stockCb) stockCb.checked = false;
      if (priceSlider && priceDisplay) {
        priceSlider.value = maxVal;
        priceDisplay.textContent = formatPrice(maxVal);
      }
      
      // Clear search query in navbar if present
      const searchInput = qs('#global-search-input');
      if (searchInput) searchInput.value = '';
      
      // Remove query parameters from URL
      window.history.pushState({}, '', 'products.html');
      
      currentPage = 1;
      applyAllFiltersAndRender();
    });
  }
}

// Orchestrator: Apply Search, Sidebar filters, Sorting, and then Render
function applyAllFiltersAndRender() {
  // 1. Filter by Search Query
  const searchInput = qs('#global-search-input');
  const searchQuery = searchInput ? searchInput.value : '';
  let tempProducts = filterProductsBySearch(allProducts, searchQuery);
  
  // 2. Filter by Sidebar criteria
  tempProducts = filterProductsBySidebar(tempProducts, activeFilters);

  // 3. Apply Sorting
  sortProducts(tempProducts);

  filteredProducts = tempProducts;

  // 4. Update count label
  const totalCountEl = qs('#catalog-count');
  if (totalCountEl) totalCountEl.textContent = filteredProducts.length;

  // 5. Render
  renderProducts();
}

// Sorting logic
function sortProducts(productsList) {
  if (sortOption === 'price-low') {
    productsList.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'price-high') {
    productsList.sort((a, b) => b.price - a.price);
  } else if (sortOption === 'rating') {
    productsList.sort((a, b) => b.rating - a.rating);
  } else if (sortOption === 'popularity') {
    productsList.sort((a, b) => b.reviewsCount - a.reviewsCount);
  }
}

// Render product card layout page & Pagination
function renderProducts() {
  const container = qs('#products-catalog-grid');
  if (!container) return;

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 4rem 2rem; text-align: center; background-color: var(--bg-primary); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <h3 style="margin-bottom: 0.5rem;">No products match your filters</h3>
        <p style="color: var(--text-secondary); font-size: 0.95rem;">Try relaxing your pricing limit or selecting other categories.</p>
      </div>
    `;
    renderPagination(0);
    return;
  }

  // Slice list for current page paginated segment
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = filteredProducts.slice(startIndex, endIndex);

  // Render cards
  container.innerHTML = paginatedList.map(product => {
    const favClass = isInWishlist(product.id) ? 'active' : '';
    const badgeHtml = product.flashSale 
      ? `<span class="badge badge-danger product-card-badge">Sale</span>` 
      : (product.newArrival ? `<span class="badge badge-primary product-card-badge">New</span>` : '');
    
    // In stock status details
    const stockHtml = !product.inStock 
      ? `<span class="badge badge-danger" style="margin-top: 0.25rem; font-size: 0.7rem; width: max-content;">Out of Stock</span>` 
      : ``;

    return `
      <div class="card product-card" data-id="${product.id}">
        ${badgeHtml}
        <button class="product-card-wishlist ${favClass}" data-action="wishlist" aria-label="Add to Wishlist">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isInWishlist(product.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
        <div class="product-card-img" onclick="window.location.href='product-details.html?id=${product.id}'" style="cursor:pointer;">
          <img src="${product.images[0]}" alt="${product.name}">
        </div>
        <div class="product-card-body">
          <span class="product-card-category">${product.category}</span>
          <h3 class="product-card-title" onclick="window.location.href='product-details.html?id=${product.id}'" style="cursor:pointer;">${product.name}</h3>
          <div class="product-card-rating">
            ${renderStars(product.rating)}
            <span class="product-card-rating-count">(${product.reviewsCount})</span>
          </div>
          ${stockHtml}
          <div class="product-card-price-row">
            <span class="product-card-price">${formatPrice(product.price)}</span>
            ${product.originalPrice ? `<span class="product-card-original-price">${formatPrice(product.originalPrice)}</span>` : ''}
          </div>
        </div>
        <div class="product-card-footer">
          <button class="btn btn-primary product-card-btn" data-action="add-to-cart" ${!product.inStock ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Re-bind click handlers
  bindProductActionButtons();

  // Render pagination
  renderPagination(filteredProducts.length);
}

// Bind wishlist & cart click actions
function bindProductActionButtons() {
  qsa('[data-action="add-to-cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      const id = parseInt(card.getAttribute('data-id'));
      const product = allProducts.find(p => p.id === id);
      if (product) {
        addToCart(product, 1);
        showToast(`${product.name} added to cart!`, 'success');
      }
    });
  });

  qsa('[data-action="wishlist"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const btnEl = e.currentTarget;
      const card = btnEl.closest('.product-card');
      const id = parseInt(card.getAttribute('data-id'));
      const product = allProducts.find(p => p.id === id);
      if (product) {
        const added = toggleWishlist(product);
        const svg = btnEl.querySelector('svg');
        if (added) {
          btnEl.classList.add('active');
          svg.setAttribute('fill', 'currentColor');
          showToast(`${product.name} added to wishlist!`, 'success');
        } else {
          btnEl.classList.remove('active');
          svg.setAttribute('fill', 'none');
          showToast(`${product.name} removed from wishlist.`, 'info');
        }
      }
    });
  });
}

// Generate pagination controls
function renderPagination(totalItems) {
  const container = qs('#pagination-container');
  if (!container) return;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  
  // Previous button
  html += `
    <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}" aria-label="Previous Page">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
  `;

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">
        ${i}
      </button>
    `;
  }

  // Next button
  html += `
    <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}" aria-label="Next Page">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  `;

  container.innerHTML = html;

  // Bind click handlers to page buttons
  qsa('.page-btn:not(.disabled)', container).forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentPage = parseInt(e.currentTarget.getAttribute('data-page'));
      renderProducts();
      // Scroll to catalog top
      const target = qs('#catalog-top');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}
