/**
 * E-Commerce Cart Controller
 */

import { formatPrice, qs, qsa, showToast } from './utils.js';
import { getCart, updateCartQty, removeFromCart, getItem, setItem } from './storage.js';

// Coupon database
const COUPONS = {
  'DISCOUNT10': { type: 'percent', value: 10, label: '10% Off Subtotal' },
  'FREESHIP': { type: 'freeship', value: 0, label: 'Free Shipping' },
  'WELCOME500': { type: 'flat', value: 500, minSubtotal: 2000, label: 'Flat ₹500 Off (Min. Purchase ₹2000)' }
};

let activeCoupon = getItem('active_coupon', null);

document.addEventListener('DOMContentLoaded', () => {
  // Wait for components to load
  setTimeout(() => {
    initCartPage();
  }, 300);
});

function initCartPage() {
  renderCart();
}

function renderCart() {
  const container = qs('#cart-page-content');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    renderEmptyCart(container);
    return;
  }

  // Draw two-column layout
  container.innerHTML = `
    <div class="cart-page-container">
      <!-- Left Column: Items list -->
      <div class="cart-items-list" id="cart-items-container">
        <!-- Cart Items loaded here -->
      </div>

      <!-- Right Column: Summary & Coupon -->
      <div class="summary-sidebar">
        <!-- Order Summary -->
        <div class="card summary-card">
          <h3 class="summary-title">Order Summary</h3>
          
          <div class="summary-row">
            <span>Subtotal</span>
            <span id="summary-subtotal">₹0</span>
          </div>
          
          <div class="summary-row discount-row" id="summary-discount-row" style="display: none;">
            <span id="summary-discount-label">Discount</span>
            <span id="summary-discount-val">-₹0</span>
          </div>

          <div class="summary-row">
            <span>Tax (5% GST)</span>
            <span id="summary-tax">₹0</span>
          </div>

          <div class="summary-row">
            <span>Estimated Shipping</span>
            <span id="summary-shipping">₹0</span>
          </div>

          <div class="summary-row total-row">
            <span>Total</span>
            <span id="summary-total">₹0</span>
          </div>

          <button class="btn btn-primary checkout-btn" id="btn-proceed-checkout">
            Proceed to Checkout
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>

        <!-- Coupon Card -->
        <div class="card coupon-card">
          <h4 class="coupon-title">Have a Promo Code?</h4>
          <form class="coupon-form" id="coupon-form">
            <input type="text" class="coupon-input" id="coupon-code-input" placeholder="Enter coupon code" value="${activeCoupon ? activeCoupon.code : ''}">
            <button type="submit" class="btn btn-secondary coupon-btn">Apply</button>
          </form>
          <div id="coupon-status-container"></div>
        </div>
      </div>
    </div>
  `;

  renderCartItemsList(cart);
  updatePricingSummary(cart);
  setupCartListeners();
}

function renderEmptyCart(container) {
  container.innerHTML = `
    <div class="card empty-cart-container">
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1.5rem;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
      <h2 class="empty-cart-title">Your Cart is Empty</h2>
      <p class="empty-cart-desc">Looks like you haven't added anything to your cart yet. Explore our awesome products now!</p>
      <a href="products.html" class="btn btn-primary">Start Shopping</a>
    </div>
  `;
}

function renderCartItemsList(cart) {
  const container = qs('#cart-items-container');
  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="card cart-item-card" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      
      <div class="cart-item-info">
        <span class="cart-item-category">${item.category}</span>
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-price">${formatPrice(item.price)} each</div>
      </div>

      <div class="cart-item-qty-row">
        <div class="quantity-selector">
          <button class="qty-btn cart-qty-minus" aria-label="Decrease Quantity">&minus;</button>
          <input type="text" class="qty-input cart-qty-input" value="${item.quantity}" readonly>
          <button class="qty-btn cart-qty-plus" aria-label="Increase Quantity">&plus;</button>
        </div>

        <div class="cart-item-subtotal">
          ${formatPrice(item.price * item.quantity)}
        </div>
      </div>

      <button class="cart-item-remove" aria-label="Remove Item">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
    </div>
  `).join('');
}

function updatePricingSummary(cart) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Tax (5% GST)
  const tax = Math.round(subtotal * 0.05);
  
  // Estimated Shipping
  // Free shipping above ₹5000
  let shipping = subtotal >= 5000 ? 0 : 150;
  
  // Promo Coupon Discount
  let discount = 0;
  if (activeCoupon) {
    const couponDef = COUPONS[activeCoupon.code];
    if (couponDef) {
      if (couponDef.type === 'percent') {
        discount = Math.round(subtotal * (couponDef.value / 100));
      } else if (couponDef.type === 'freeship') {
        shipping = 0;
      } else if (couponDef.type === 'flat') {
        if (subtotal >= couponDef.minSubtotal) {
          discount = couponDef.value;
        } else {
          // Deactivate coupon since minimum purchase is no longer satisfied
          activeCoupon = null;
          removeItem('active_coupon');
          showToast('Coupon removed: Minimum purchase amount not met.', 'info');
        }
      }
    }
  }

  const grandTotal = Math.max(0, subtotal + tax + shipping - discount);

  // Update UI elements
  const subtotalEl = qs('#summary-subtotal');
  const taxEl = qs('#summary-tax');
  const shippingEl = qs('#summary-shipping');
  const totalEl = qs('#summary-total');
  const discountRow = qs('#summary-discount-row');
  const discountLabel = qs('#summary-discount-label');
  const discountVal = qs('#summary-discount-val');

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (taxEl) taxEl.textContent = formatPrice(tax);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
  if (totalEl) totalEl.textContent = formatPrice(grandTotal);

  if (discountRow && discountLabel && discountVal) {
    if (discount > 0) {
      discountLabel.textContent = `Discount (${activeCoupon.code})`;
      discountVal.textContent = `-${formatPrice(discount)}`;
      discountRow.style.display = 'flex';
    } else {
      discountRow.style.display = 'none';
    }
  }

  // Update coupon status badge
  renderCouponStatusBadge();
}

function renderCouponStatusBadge() {
  const container = qs('#coupon-status-container');
  if (!container) return;

  if (activeCoupon) {
    const couponDef = COUPONS[activeCoupon.code];
    const lbl = couponDef ? couponDef.label : 'Coupon Applied';
    container.innerHTML = `
      <div class="active-coupon-badge">
        <span>${activeCoupon.code} - ${lbl}</span>
        <button class="remove-coupon-btn" id="btn-remove-coupon" aria-label="Remove Coupon">&times;</button>
      </div>
    `;
    
    // Bind remove coupon click
    qs('#btn-remove-coupon').addEventListener('click', () => {
      activeCoupon = null;
      removeItem('active_coupon');
      showToast('Promo code removed.', 'info');
      
      const input = qs('#coupon-code-input');
      if (input) input.value = '';
      
      const cart = getCart();
      updatePricingSummary(cart);
    });
  } else {
    container.innerHTML = '';
  }
}

function setupCartListeners() {
  // Proceed to Checkout
  const checkoutBtn = qs('#btn-proceed-checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      // Calculate final pricing again and cache to storage for the checkout screen to pick up
      const cart = getCart();
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = Math.round(subtotal * 0.05);
      let shipping = subtotal >= 5000 ? 0 : 150;
      
      let discount = 0;
      let couponCode = '';
      if (activeCoupon) {
        couponCode = activeCoupon.code;
        const couponDef = COUPONS[activeCoupon.code];
        if (couponDef) {
          if (couponDef.type === 'percent') {
            discount = Math.round(subtotal * (couponDef.value / 100));
          } else if (couponDef.type === 'freeship') {
            shipping = 0;
          } else if (couponDef.type === 'flat') {
            if (subtotal >= couponDef.minSubtotal) discount = couponDef.value;
          }
        }
      }

      const totalSummary = {
        subtotal,
        tax,
        shipping,
        discount,
        couponCode,
        grandTotal: Math.max(0, subtotal + tax + shipping - discount)
      };

      setItem('checkout_summary', totalSummary);
      window.location.href = 'checkout.html';
    });
  }

  // Coupon Submission Form
  const couponForm = qs('#coupon-form');
  if (couponForm) {
    couponForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = qs('#coupon-code-input');
      if (!input) return;
      
      const code = input.value.trim().toUpperCase();
      if (!code) return;

      const couponDef = COUPONS[code];
      const cart = getCart();
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (couponDef) {
        // Flat welcome code validations
        if (couponDef.type === 'flat' && subtotal < couponDef.minSubtotal) {
          showToast(`Coupon works on orders above ${formatPrice(couponDef.minSubtotal)} only.`, 'error');
          return;
        }

        activeCoupon = { code: code };
        setItem('active_coupon', activeCoupon);
        showToast('Promo code applied successfully!', 'success');
        updatePricingSummary(cart);
      } else {
        showToast('Invalid coupon code. Try DISCOUNT10, WELCOME500 or FREESHIP.', 'error');
      }
    });
  }

  // Cart Qty controls and Removals
  qsa('.cart-item-card').forEach(card => {
    const id = parseInt(card.getAttribute('data-id'));
    const minusBtn = qs('.cart-qty-minus', card);
    const plusBtn = qs('.cart-qty-plus', card);
    const removeBtn = qs('.cart-item-remove', card);
    const inputField = qs('.cart-qty-input', card);

    if (minusBtn && plusBtn && inputField) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(inputField.value);
        if (val > 1) {
          val--;
          inputField.value = val;
          const updatedCart = updateCartQty(id, val);
          updateCardSubtotal(card, id, val, updatedCart);
        }
      });

      plusBtn.addEventListener('click', () => {
        let val = parseInt(inputField.value);
        val++;
        inputField.value = val;
        const updatedCart = updateCartQty(id, val);
        updateCardSubtotal(card, id, val, updatedCart);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const updatedCart = removeFromCart(id);
        renderCart(); // full re-draw
        showToast('Item removed from cart.', 'info');
      });
    }
  });
}

function updateCardSubtotal(card, productId, quantity, cart) {
  const item = cart.find(i => i.id === productId);
  const subtotalEl = qs('.cart-item-subtotal', card);
  if (item && subtotalEl) {
    subtotalEl.textContent = formatPrice(item.price * quantity);
  }
  updatePricingSummary(cart);
}
