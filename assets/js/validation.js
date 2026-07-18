/**
 * E-Commerce Frontend Form Validation Helpers
 */

export function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

export function validatePhone(phone) {
  // Matches basic 10 digit number formats with optional country prefix
  const re = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
  return re.test(String(phone).replace(/[\s-()]/g, ''));
}

export function validateZip(zip) {
  // Matches 5-6 digit zip codes (US, India)
  const re = /^\d{5,6}$/;
  return re.test(String(zip).trim());
}

export function validateRequired(value) {
  return value !== null && value !== undefined && value.trim() !== '';
}

export function validateCardNumber(cardNumber) {
  // Basic Luhn check or simple 16-digit spacing match
  const clean = cardNumber.replace(/\s+/g, '');
  return /^\d{16}$/.test(clean);
}

export function validateExpiry(expiry) {
  // Format MM/YY
  const re = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  if (!re.test(expiry)) return false;
  
  const parts = expiry.split('/');
  const month = parseInt(parts[0], 10);
  const year = parseInt('20' + parts[1], 10);
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
}

export function validateCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}
