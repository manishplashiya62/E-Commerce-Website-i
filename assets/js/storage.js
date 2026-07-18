/**
 * E-Commerce Frontend Local Storage API
 */

// Generic Local Storage wrappers
export function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return defaultValue;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key "${key}" to localStorage:`, error);
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing key "${key}" from localStorage:`, error);
  }
}

// --- Cart Storage API ---
export function getCart() {
  return getItem('cart', []);
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingItemIndex = cart.findIndex(item => item.id === product.id);
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      category: product.category,
      quantity: quantity
    });
  }
  
  setItem('cart', cart);
  // Dispatch custom event to notify navbar to update count bubble
  window.dispatchEvent(new Event('cartUpdated'));
  return cart;
}

export function updateCartQty(productId, quantity) {
  let cart = getCart();
  cart = cart.map(item => {
    if (item.id === productId) {
      item.quantity = Math.max(1, quantity);
    }
    return item;
  });
  setItem('cart', cart);
  window.dispatchEvent(new Event('cartUpdated'));
  return cart;
}

export function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  setItem('cart', cart);
  window.dispatchEvent(new Event('cartUpdated'));
  return cart;
}

export function clearCart() {
  setItem('cart', []);
  window.dispatchEvent(new Event('cartUpdated'));
}

// --- Wishlist Storage API ---
export function getWishlist() {
  return getItem('wishlist', []);
}

export function toggleWishlist(product) {
  const wishlist = getWishlist();
  const index = wishlist.findIndex(item => item.id === product.id);
  let added = false;
  
  if (index > -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      category: product.category
    });
    added = true;
  }
  
  setItem('wishlist', wishlist);
  window.dispatchEvent(new Event('wishlistUpdated'));
  return added;
}

export function isInWishlist(productId) {
  const wishlist = getWishlist();
  return wishlist.some(item => item.id === productId);
}

export function removeFromWishlist(productId) {
  let wishlist = getWishlist();
  wishlist = wishlist.filter(item => item.id !== productId);
  setItem('wishlist', wishlist);
  window.dispatchEvent(new Event('wishlistUpdated'));
  return wishlist;
}

// --- User Profile & Orders Storage API ---
export function getUser() {
  return getItem('user', null);
}

export function saveUser(userData) {
  setItem('user', userData);
  window.dispatchEvent(new Event('userUpdated'));
}

export function getOrders() {
  return getItem('orders', []);
}

export function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order); // Add new order to the beginning
  setItem('orders', orders);
  
  // Also push to the profile's order list if profile exists
  const user = getUser();
  if (user) {
    if (!user.orders) user.orders = [];
    user.orders.unshift(order);
    saveUser(user);
  }
}

// --- Search Storage API ---
export function getRecentSearches() {
  return getItem('recentSearch', []);
}

export function addRecentSearch(query) {
  if (!query || !query.trim()) return;
  let searches = getRecentSearches();
  searches = searches.filter(q => q.toLowerCase() !== query.toLowerCase()); // Remove duplicate
  searches.unshift(query); // Prepend new search
  searches = searches.slice(0, 5); // Keep last 5 searches
  setItem('recentSearch', searches);
}
