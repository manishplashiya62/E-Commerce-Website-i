/**
 * E-Commerce Profile Page Controller
 */

import { formatPrice, qs, qsa, showToast } from './utils.js';
import { getUser, saveUser, getOrders } from './storage.js';
import * as validation from './validation.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  // Wait for components to render
  setTimeout(() => {
    initProfilePage();
  }, 300);
});

function initProfilePage() {
  currentUser = getUser();
  if (!currentUser) {
    showToast('Failed to load user profile.', 'error');
    return;
  }

  // Draw initial sidebar header
  updateSidebarHeader();

  // Draw pane contents
  renderDetailsPane();
  renderAddressesPane();
  renderOrdersPane();

  // Setup tab switcher & routing
  setupProfileNavigation();

  // Set up forms listeners
  bindDetailsSubmit();
  bindNewAddressSubmit();
}

function updateSidebarHeader() {
  const avatar = qs('#profile-sb-avatar');
  const name = qs('#profile-sb-name');
  const email = qs('#profile-sb-email');

  if (avatar && currentUser.name) {
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    avatar.textContent = initials;
  }
  if (name) name.textContent = currentUser.name;
  if (email) email.textContent = currentUser.email;
}

function setupProfileNavigation() {
  const buttons = qsa('.profile-sb-btn');
  const panes = qsa('.profile-content-pane');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-pane');
      
      // Update active classes
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      panes.forEach(p => p.classList.remove('active'));
      const targetPane = qs(`#${targetId}`);
      if (targetPane) targetPane.classList.add('active');

      // Update URL hash
      window.location.hash = targetId.replace('pane-', '');
    });
  });

  // Handle URL hash on load
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const btn = qs(`.profile-sb-btn[data-pane="pane-${hash}"]`);
    if (btn) btn.click();
  } else {
    // Default click first tab
    if (buttons[0]) buttons[0].click();
  }
}

// ---------------- PANEL RENDERS ----------------

function renderDetailsPane() {
  qs('#p-name').value = currentUser.name || '';
  qs('#p-email').value = currentUser.email || '';
  qs('#p-phone').value = currentUser.phone || '';
}

function renderAddressesPane() {
  const container = qs('#profile-addresses-grid');
  if (!container) return;

  const addresses = currentUser.addresses || [];

  if (addresses.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-tertiary); padding:2rem 0;">No saved addresses found.</div>`;
    return;
  }

  container.innerHTML = addresses.map(addr => `
    <div class="card address-select-card ${addr.isDefault ? 'active' : ''}">
      ${addr.isDefault ? `<span class="badge badge-primary address-card-badge">Default</span>` : ''}
      <div class="address-card-name">${addr.type} Address</div>
      <div class="address-card-text" style="margin-bottom:1rem;">
        ${addr.street}<br>
        ${addr.city}, ${addr.state} - ${addr.zip}<br>
        ${addr.country}
      </div>
      
      <div class="address-grid-action-row">
        ${!addr.isDefault ? `
          <button class="btn btn-secondary address-action-btn" data-action="set-default" data-id="${addr.id}">
            Set Default
          </button>
        ` : '<span></span>'}
        <button class="btn btn-secondary address-action-btn" data-action="delete" data-id="${addr.id}" style="color:var(--danger-color);">
          Delete
        </button>
      </div>
    </div>
  `).join('');

  // Bind actions
  qsa('[data-action="set-default"]', container).forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      setDefaultAddress(id);
    });
  });

  qsa('[data-action="delete"]', container).forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      deleteAddress(id);
    });
  });
}

function renderOrdersPane() {
  const container = qs('#profile-orders-list');
  if (!container) return;

  const orders = getOrders();

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding:4rem 2rem; text-align:center; color:var(--text-secondary);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <h3 style="margin-bottom:0.5rem;">No orders placed yet</h3>
        <p style="font-size:0.95rem;">All your invoices and order receipts will be stored here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    const orderDate = new Date(order.date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const statusBadge = order.status === 'Delivered' 
      ? `<span class="badge badge-success">${order.status}</span>`
      : `<span class="badge badge-warning">${order.status}</span>`;

    // Render items rows
    const itemsHtml = order.items.map(item => `
      <div class="order-card-item">
        <img src="${item.image}" alt="${item.name}" class="order-item-img">
        <div class="order-item-details">
          <h5 class="order-item-name">${item.name}</h5>
          <span class="order-item-qty">Qty: ${item.quantity}</span>
        </div>
        <div class="order-item-price">${formatPrice(item.price * item.quantity)}</div>
      </div>
    `).join('');

    return `
      <div class="card order-history-card">
        <!-- Order Header info bar -->
        <div class="order-card-header">
          <div class="order-header-info">
            <div class="order-info-block">
              <span class="order-info-lbl">Order Placed</span>
              <span class="order-info-val">${orderDate}</span>
            </div>
            <div class="order-info-block">
              <span class="order-info-lbl">Total Paid</span>
              <span class="order-info-val" style="color:var(--primary-color);">${formatPrice(order.total)}</span>
            </div>
            <div class="order-info-block">
              <span class="order-info-lbl">Order ID</span>
              <span class="order-info-val">${order.orderId}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center;">
            ${statusBadge}
          </div>
        </div>

        <!-- Items purchased lists -->
        <div class="order-card-body">
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- FORM ACTIONS ----------------

function bindDetailsSubmit() {
  const form = qs('#edit-profile-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = qs('#p-name').value.trim();
    const email = qs('#p-email').value.trim();
    const phone = qs('#p-phone').value.trim();

    if (!validation.validateRequired(name) || !validation.validateRequired(email) || !validation.validateRequired(phone)) {
      showToast('All contact fields are required.', 'error');
      return;
    }

    if (!validation.validateEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (!validation.validatePhone(phone)) {
      showToast('Please enter a valid 10-digit phone number.', 'error');
      return;
    }

    // Save
    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone = phone;

    saveUser(currentUser);
    updateSidebarHeader();
    showToast('Profile information updated successfully!', 'success');
  });
}

function bindNewAddressSubmit() {
  const form = qs('#profile-add-address-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = qs('#p-addr-type').value;
    const street = qs('#p-addr-street').value.trim();
    const city = qs('#p-addr-city').value.trim();
    const state = qs('#p-addr-state').value.trim();
    const zip = qs('#p-addr-zip').value.trim();
    const country = qs('#p-addr-country').value.trim();

    if (!validation.validateRequired(street) || 
        !validation.validateRequired(city) || 
        !validation.validateRequired(state) || 
        !validation.validateRequired(zip) || 
        !validation.validateRequired(country)) {
      showToast('Please complete all address inputs.', 'error');
      return;
    }

    if (!validation.validateZip(zip)) {
      showToast('Please enter a valid 5 or 6 digit ZIP code.', 'error');
      return;
    }

    const newAddr = {
      id: 'addr_' + Math.random().toString(36).substr(2, 9),
      type,
      street,
      city,
      state,
      zip,
      country,
      isDefault: currentUser.addresses && currentUser.addresses.length === 0 ? true : false
    };

    if (!currentUser.addresses) currentUser.addresses = [];
    currentUser.addresses.push(newAddr);

    saveUser(currentUser);
    showToast('New shipping address added!', 'success');
    form.reset();
    renderAddressesPane();
  });
}

function setDefaultAddress(id) {
  currentUser.addresses.forEach(addr => {
    addr.isDefault = addr.id === id;
  });
  saveUser(currentUser);
  renderAddressesPane();
  showToast('Default address updated.', 'success');
}

function deleteAddress(id) {
  currentUser.addresses = currentUser.addresses.filter(addr => addr.id !== id);
  
  // If we deleted the default, set another default
  if (currentUser.addresses.length > 0 && !currentUser.addresses.some(a => a.isDefault)) {
    currentUser.addresses[0].isDefault = true;
  }
  
  saveUser(currentUser);
  renderAddressesPane();
  showToast('Address removed.', 'info');
}
