/**
 * E-Commerce Theme Manager (Dark/Light mode)
 */

import { getItem, setItem } from './storage.js';

// Apply the theme (adding class to html element)
export function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

// Toggle between light and dark theme
export function toggleTheme() {
  const currentTheme = getItem('theme', 'light');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setItem('theme', newTheme);
  applyTheme(newTheme);
  
  // Dispatch custom theme change event
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  return newTheme;
}

// Initialize theme from storage or system preference
export function initTheme() {
  const storedTheme = getItem('theme', null);
  if (storedTheme) {
    applyTheme(storedTheme);
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? 'dark' : 'light';
    setItem('theme', systemTheme);
    applyTheme(systemTheme);
  }
}
