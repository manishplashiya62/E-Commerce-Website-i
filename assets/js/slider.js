/**
 * E-Commerce Hero Slider & Carousel Controller
 */

import { qs, qsa } from './utils.js';

export function initHeroSlider() {
  const slider = qs('#hero-slider');
  const slides = qsa('.hero-slide');
  const dotsContainer = qs('#slider-dots');
  const prevBtn = qs('#slider-prev');
  const nextBtn = qs('#slider-next');
  
  if (!slider || slides.length === 0) return;
  
  let currentIndex = 0;
  const slideCount = slides.length;
  let autoplayInterval;

  // 1. Create navigation dots dynamically
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < slideCount; i++) {
      const dot = document.createElement('div');
      dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
      dot.dataset.index = i;
      dotsContainer.appendChild(dot);
      
      dot.addEventListener('click', () => {
        goToSlide(i);
        resetAutoplay();
      });
    }
  }

  // 2. Navigation Arrow bindings
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoplay();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoplay();
    });
  }

  function updateSlider() {
    // Translate the slider track
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Update dots status
    const dots = qsa('.slider-dot', dotsContainer);
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function goToSlide(index) {
    currentIndex = index;
    updateSlider();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slideCount;
    updateSlider();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slideCount) % slideCount;
    updateSlider();
  }

  // 3. Autoplay Setup
  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000); // Change slide every 5s
  }

  function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
  }

  // Start Autoplay on load
  startAutoplay();
}
