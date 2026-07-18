/**
 * E-Commerce Frontend Main Core
 */

import { initTheme, toggleTheme } from './theme.js';
import { getCart, getWishlist, getUser, saveUser, addRecentSearch } from './storage.js';
import { loadHTMLComponent, qs, qsa, formatPrice } from './utils.js';

// Global catalog placeholder
let productCatalog = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Theme
  initTheme();
  
  // 2. Load Navbar and Footer Components
  await Promise.all([
    loadHTMLComponent('#navbar-placeholder', 'components/navbar.html'),
    loadHTMLComponent('#footer-placeholder', 'components/footer.html')
  ]);

  // 3. Initialize common UI Elements
  initializeNavbar();
  initializeFooter();
  
  // 4. Seed User profile from JSON if not exists
  await seedUserProfile();

  // 5. Pre-load products list for instant search
  await loadProductCatalog();
  
  // 6. Bind global search
  setupGlobalSearch();

  // Hide loader
  const loader = qs('.page-loader');
  if (loader) {
    loader.classList.add('hidden');
  }
});

// Setup Navbar interactions
function initializeNavbar() {
  // Theme toggle binding
  const themeToggle = qs('#theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const activeTheme = toggleTheme();
      updateThemeIcon(activeTheme);
    });
    // Set initial icon
    const currentTheme = localStorage.getItem('theme') || 'light';
    updateThemeIcon(currentTheme);
  }

  // Mobile menu toggle
  const menuToggle = qs('#menu-toggle');
  const navMenu = qs('#nav-menu');
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // Update badges
  updateCartBadge();
  updateWishlistBadge();
  updateUserMenu();

  // Register local storage update listeners
  window.addEventListener('cartUpdated', updateCartBadge);
  window.addEventListener('wishlistUpdated', updateWishlistBadge);
  window.addEventListener('userUpdated', updateUserMenu);
}

function updateThemeIcon(theme) {
  const themeToggle = qs('#theme-toggle');
  if (!themeToggle) return;
  if (theme === 'dark') {
    themeToggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px; height:20px;"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M6.34 17.66l-1.41 1.41"></path><path d="M19.07 4.93l-1.41 1.41"></path></svg>
    `; // Sun icon for light mode option
  } else {
    themeToggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px; height:20px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    `; // Moon icon for dark mode option
  }
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = qs('#cart-count-badge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

function updateWishlistBadge() {
  const wishlist = getWishlist();
  const badge = qs('#wishlist-count-badge');
  if (badge) {
    if (wishlist.length > 0) {
      badge.textContent = wishlist.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

function updateUserMenu() {
  const user = getUser();
  const userNameDD = qs('#profile-dd-name');
  const userEmailDD = qs('#profile-dd-email');
  if (user) {
    if (userNameDD) userNameDD.textContent = user.name;
    if (userEmailDD) userEmailDD.textContent = user.email;
  }
}

// Setup Footer interactions
function initializeFooter() {
  const newsletterForm = qs('#newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = qs('#newsletter-email');
      if (emailInput && emailInput.value.trim()) {
        import('./utils.js').then(utils => {
          utils.showToast('Thank you for subscribing to our newsletter!', 'success');
          emailInput.value = '';
        });
      }
    });
  }
}

// Seed Profile Details if empty
async function seedUserProfile() {
  if (!getUser()) {
    try {
      const response = await fetch('data/users.json');
      if (response.ok) {
        const defaultUser = await response.json();
        saveUser(defaultUser);
        // Copy user orders list directly into orders table
        if (defaultUser.orders && defaultUser.orders.length > 0) {
          localStorage.setItem('orders', JSON.stringify(defaultUser.orders));
        }
      }
    } catch (error) {
      console.error('Error seeding user profile:', error);
    }
  }
}

// Load products.json into local catalog memory
async function loadProductCatalog() {
  try {
    const response = await fetch('data/products.json');
    if (response.ok) {
      productCatalog = await response.json();
    }
  } catch (error) {
    console.error('Error loading product catalog:', error);
  }
}

// Setup instant Search Dropdown
function setupGlobalSearch() {
  const searchInput = qs('#global-search-input');
  const searchResults = qs('#search-results');
  const searchForm = qs('#search-form');
  
  if (!searchInput || !searchResults) return;

  // Listen to typing in search input
  searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim().toLowerCase();
    
    if (!value) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
      return;
    }

    const filtered = productCatalog.filter(p => 
      p.name.toLowerCase().includes(value) || 
      p.category.toLowerCase().includes(value) ||
      p.brand.toLowerCase().includes(value)
    ).slice(0, 5); // Limit 5 suggestions

    if (filtered.length > 0) {
      searchResults.innerHTML = filtered.map(product => `
        <div class="search-item" data-id="${product.id}">
          <img src="${product.images[0]}" alt="${product.name}" class="search-item-img">
          <div class="search-item-info">
            <div class="search-item-title">${product.name}</div>
            <div class="search-item-price">${formatPrice(product.price)}</div>
          </div>
        </div>
      `).join('');
      searchResults.classList.add('active');

      // Bind click handlers to search items
      qsa('.search-item', searchResults).forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          addRecentSearch(searchInput.value);
          window.location.href = `product-details.html?id=${id}`;
        });
      });
    } else {
      searchResults.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-tertiary);">No products found</div>`;
      searchResults.classList.add('active');
    }
  });

  // Hide suggestions dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchForm.contains(e.target)) {
      searchResults.classList.remove('active');
    }
  });

  // Action on submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      addRecentSearch(query);
      searchResults.classList.remove('active');
      window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
  });
}
