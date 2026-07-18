/**
 * E-Commerce Checkout Controller
 */

import { formatPrice, qs, qsa, showToast, generateUUID } from './utils.js';
import { getCart, getUser, saveUser, clearCart, addOrder } from './storage.js';
import * as validation from './validation.js';

let cartItems = [];
let checkoutSummary = null;
let selectedAddressId = null;
let selectedPaymentMethod = 'card'; // default

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initCheckoutPage();
  }, 300);
});

function initCheckoutPage() {
  cartItems = getCart();
  checkoutSummary = localStorage.getItem('checkout_summary') 
    ? JSON.parse(localStorage.getItem('checkout_summary')) 
    : null;

  // Redirect to cart if nothing to checkout
  if (cartItems.length === 0 || !checkoutSummary) {
    showToast('Your cart is empty. Please add items before checking out.', 'error');
    setTimeout(() => {
      window.location.href = 'cart.html';
    }, 1500);
    return;
  }

  // Render right column order preview
  renderOrderReview();

  // Populate shipping addresses list
  renderAddressesList();

  // Bind multi-step buttons
  setupStepControls();

  // Bind payment select triggers
  setupPaymentControls();

  // Place Order submission binding
  setupPlaceOrderAction();
}

function renderOrderReview() {
  const container = qs('#checkout-items-preview');
  if (!container) return;

  // Draw product line previews
  container.innerHTML = cartItems.map(item => `
    <div class="preview-item">
      <img src="${item.image}" alt="${item.name}" class="preview-item-img">
      <div class="preview-item-info">
        <h5 class="preview-item-title">${item.name}</h5>
        <span class="preview-item-qty">Qty: ${item.quantity}</span>
      </div>
      <div class="preview-item-price">${formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join('');

  // Update summary prices
  const subtotalEl = qs('#checkout-subtotal');
  const taxEl = qs('#checkout-tax');
  const shippingEl = qs('#checkout-shipping');
  const discountRow = qs('#checkout-discount-row');
  const discountLabel = qs('#checkout-discount-label');
  const discountVal = qs('#checkout-discount-val');
  const totalEl = qs('#checkout-total');

  if (subtotalEl) subtotalEl.textContent = formatPrice(checkoutSummary.subtotal);
  if (taxEl) taxEl.textContent = formatPrice(checkoutSummary.tax);
  if (shippingEl) shippingEl.textContent = checkoutSummary.shipping === 0 ? 'FREE' : formatPrice(checkoutSummary.shipping);
  if (totalEl) totalEl.textContent = formatPrice(checkoutSummary.grandTotal);

  if (discountRow && discountLabel && discountVal) {
    if (checkoutSummary.discount > 0) {
      discountLabel.textContent = `Discount (${checkoutSummary.couponCode || 'Promo'})`;
      discountVal.textContent = `-${formatPrice(checkoutSummary.discount)}`;
      discountRow.style.display = 'flex';
    } else {
      discountRow.style.display = 'none';
    }
  }
}

function renderAddressesList() {
  const container = qs('#addresses-select-grid');
  if (!container) return;

  const user = getUser();
  const addresses = user ? user.addresses || [] : [];

  if (addresses.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; color:var(--text-secondary); text-align:center;">No addresses saved. Please add a shipping address below.</div>`;
    selectedAddressId = null;
    return;
  }

  // Pre-select default or first address
  const activeAddress = addresses.find(a => a.isDefault) || addresses[0];
  selectedAddressId = activeAddress.id;

  container.innerHTML = addresses.map(addr => `
    <div class="card address-select-card ${addr.id === selectedAddressId ? 'active' : ''}" data-id="${addr.id}">
      ${addr.isDefault ? `<span class="badge badge-primary address-card-badge">Default</span>` : ''}
      <span class="badge badge-warning address-card-badge" style="top:15px; right:15px; display:${addr.id === selectedAddressId ? 'block' : 'none'};" id="active-badge-${addr.id}">Active</span>
      <div class="address-card-name">${user.name} (${addr.type})</div>
      <div class="address-card-text">
        ${addr.street}<br>
        ${addr.city}, ${addr.state} - ${addr.zip}<br>
        ${addr.country}
      </div>
    </div>
  `).join('');

  // Bind click selection
  qsa('.address-select-card', container).forEach(card => {
    card.addEventListener('click', () => {
      qsa('.address-select-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedAddressId = card.getAttribute('data-id');
      
      // Update warning badge visibility
      qsa('.address-card-badge').forEach(b => {
        if (b.id && b.id.startsWith('active-badge-')) b.style.display = 'none';
      });
      const badge = qs(`#active-badge-${selectedAddressId}`);
      if (badge) badge.style.display = 'block';
    });
  });
}

function setupStepControls() {
  const stepAddress = qs('#step-address-indicator');
  const stepPayment = qs('#step-payment-indicator');
  
  const paneAddress = qs('#pane-address');
  const panePayment = qs('#pane-payment');

  const continueBtn = qs('#btn-continue-payment');
  const backBtn = qs('#btn-back-address');

  if (!continueBtn || !backBtn) return;

  // Shipping Address -> Payment details
  continueBtn.addEventListener('click', () => {
    if (!selectedAddressId) {
      showToast('Please select or add a shipping address first!', 'error');
      return;
    }

    // Toggle Panes
    paneAddress.classList.remove('active');
    panePayment.classList.add('active');

    // Toggle Indicators
    stepAddress.classList.remove('active');
    stepAddress.classList.add('completed');
    stepPayment.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Payment details -> Shipping Address
  backBtn.addEventListener('click', () => {
    panePayment.classList.remove('active');
    paneAddress.classList.add('active');

    stepPayment.classList.remove('active');
    stepAddress.classList.remove('completed');
    stepAddress.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Setup Save New Address Action
  const addressForm = qs('#add-address-form');
  if (addressForm) {
    addressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const type = qs('#addr-type').value;
      const street = qs('#addr-street').value.trim();
      const city = qs('#addr-city').value.trim();
      const state = qs('#addr-state').value.trim();
      const zip = qs('#addr-zip').value.trim();
      const country = qs('#addr-country').value.trim();

      // Validations
      if (!validation.validateRequired(street) || 
          !validation.validateRequired(city) || 
          !validation.validateRequired(state) || 
          !validation.validateRequired(zip) || 
          !validation.validateRequired(country)) {
        showToast('Please fill out all address fields.', 'error');
        return;
      }

      if (!validation.validateZip(zip)) {
        showToast('Please enter a valid 5 or 6 digit ZIP code.', 'error');
        return;
      }

      const user = getUser();
      if (!user) return;

      const newAddress = {
        id: 'addr_' + Math.random().toString(36).substr(2, 9),
        type,
        street,
        city,
        state,
        zip,
        country,
        isDefault: user.addresses && user.addresses.length === 0 ? true : false
      };

      if (!user.addresses) user.addresses = [];
      user.addresses.push(newAddress);
      
      saveUser(user);
      showToast('New shipping address saved successfully!', 'success');
      
      // Reset form
      addressForm.reset();
      
      // Re-populate and select the new address
      renderAddressesList();
      selectedAddressId = newAddress.id;
      qsa('.address-select-card').forEach(c => {
        if (c.getAttribute('data-id') === selectedAddressId) {
          c.click();
        }
      });
    });
  }
}

function setupPaymentControls() {
  const methodCards = qsa('.payment-method-card');
  const cardDetails = qs('#credit-card-details');

  methodCards.forEach(card => {
    card.addEventListener('click', () => {
      methodCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      const radio = card.querySelector('.payment-radio');
      if (radio) radio.checked = true;

      selectedPaymentMethod = card.getAttribute('data-method');

      // Expand card fields if card is selected
      if (selectedPaymentMethod === 'card') {
        if (cardDetails) cardDetails.style.display = 'grid';
      } else {
        if (cardDetails) cardDetails.style.display = 'none';
      }
    });
  });
}

function setupPlaceOrderAction() {
  const placeOrderBtn = qs('#btn-place-order');
  if (!placeOrderBtn) return;

  placeOrderBtn.addEventListener('click', () => {
    // 1. Double check address
    if (!selectedAddressId) {
      showToast('Shipping address is missing!', 'error');
      return;
    }

    // 2. If credit card, validate entries
    if (selectedPaymentMethod === 'card') {
      const cardNum = qs('#card-number').value.trim();
      const expiry = qs('#card-expiry').value.trim();
      const cvv = qs('#card-cvv').value.trim();

      if (!validation.validateRequired(cardNum) || 
          !validation.validateRequired(expiry) || 
          !validation.validateRequired(cvv)) {
        showToast('Please fill out all credit card information fields.', 'error');
        return;
      }

      if (!validation.validateCardNumber(cardNum)) {
        showToast('Please enter a valid 16-digit card number.', 'error');
        return;
      }

      if (!validation.validateExpiry(expiry)) {
        showToast('Please enter a valid expiry date in MM/YY format (future dates only).', 'error');
        return;
      }

      if (!validation.validateCVV(cvv)) {
        showToast('Please enter a valid 3 or 4 digit CVV code.', 'error');
        return;
      }
    }

    // 3. Compile receipt and complete transaction
    placeOrder();
  });
}

function placeOrder() {
  // Show loader overlay first
  const loader = qs('.page-loader');
  if (loader) loader.classList.remove('hidden');

  // Simulate banking network latency (1.5 seconds delay)
  setTimeout(() => {
    const user = getUser();
    const address = user.addresses.find(a => a.id === selectedAddressId);
    
    // Construct receipt object
    const orderRef = 'ORD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    
    const newOrder = {
      orderId: orderRef,
      date: new Date().toISOString(),
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal: checkoutSummary.subtotal,
      tax: checkoutSummary.tax,
      shipping: checkoutSummary.shipping,
      discount: checkoutSummary.discount,
      total: checkoutSummary.grandTotal,
      paymentMethod: getFriendlyPaymentMethod(selectedPaymentMethod),
      shippingAddress: address,
      status: 'Pending'
    };

    // Save order into logs & profile lists
    addOrder(newOrder);
    
    // Clear shopping cart
    clearCart();
    
    // Remove transaction parameters from session storage
    localStorage.removeItem('checkout_summary');
    localStorage.removeItem('active_coupon');

    // Hide loader
    if (loader) loader.classList.add('hidden');

    // Redirect to Order Success receipt page
    window.location.href = `order-success.html?orderId=${orderRef}`;
  }, 1500);
}

function getFriendlyPaymentMethod(method) {
  switch (method) {
    case 'card': return 'Credit/Debit Card';
    case 'paypal': return 'PayPal';
    case 'netbanking': return 'Net Banking';
    case 'cod': return 'Cash on Delivery';
    default: return 'Online Payment';
  }
}
