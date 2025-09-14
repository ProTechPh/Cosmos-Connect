// Cosmos Connect - Utility Functions

// Date formatting utilities
const DateUtils = {
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return this.formatDate(dateString);
  },

  getTodayString() {
    // Get current date, but cap it at a reasonable maximum to avoid future dates
    // that don't exist in NASA's APOD database
    const today = new Date();
    const maxDate = new Date('2024-09-13'); // Cap at a known working date
    
    const dateToUse = today > maxDate ? maxDate : today;
    return dateToUse.toISOString().split('T')[0];
  },

  getDateDaysAgo(days) {
    // Get current date with cap applied
    const maxDate = new Date('2024-09-13');
    const today = new Date();
    const currentDate = today > maxDate ? maxDate : today;
    
    const date = new Date(currentDate);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
};

// Local storage utilities
const StorageUtils = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Cache utilities
const CacheUtils = {
  isExpired(cacheItem, maxAgeMinutes = 60) {
    if (!cacheItem || !cacheItem.timestamp) return true;
    
    const now = Date.now();
    const age = now - cacheItem.timestamp;
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
    
    return age > maxAge;
  },

  createCacheItem(data) {
    return {
      data,
      timestamp: Date.now()
    };
  },

  getCachedData(key, maxAgeMinutes = 60) {
    const cacheItem = StorageUtils.get(`cache_${key}`);
    
    if (!cacheItem || this.isExpired(cacheItem, maxAgeMinutes)) {
      return null;
    }
    
    return cacheItem.data;
  },

  setCachedData(key, data, maxAgeMinutes = 60) {
    const cacheItem = this.createCacheItem(data);
    return StorageUtils.set(`cache_${key}`, cacheItem);
  }
};

// URL and API utilities
const URLUtils = {
  buildURL(baseURL, params = {}) {
    const url = new URL(baseURL);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
    
    return url.toString();
  },

  getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  },

  removeQueryParam(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.pushState({}, '', url);
  }
};

// DOM utilities
const DOMUtils = {
  createElement(tag, className = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  },

  createElementWithAttributes(tag, attributes = {}) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    return element;
  },

  showElement(element) {
    element.style.display = '';
    element.classList.remove('d-none');
  },

  hideElement(element) {
    element.classList.add('d-none');
  },

  toggleElement(element) {
    element.classList.toggle('d-none');
  },

  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = '';
    element.classList.remove('d-none');
    
    const start = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },

  fadeOut(element, duration = 300) {
    const start = performance.now();
    const startOpacity = parseFloat(element.style.opacity) || 1;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = startOpacity * (1 - progress);
      
      if (progress >= 1) {
        element.classList.add('d-none');
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
};

// Number and math utilities
const NumberUtils = {
  formatLargeNumber(num) {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  },

  roundToDecimals(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  }
};

// Loading state utilities
const LoadingUtils = {
  showLoading(element, message = 'Loading...') {
    element.innerHTML = `
      <div class="loading-placeholder">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">${message}</p>
      </div>
    `;
  },

  showError(element, message = 'An error occurred') {
    element.innerHTML = `
      <div class="alert alert-danger alert-glass" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
      </div>
    `;
  },

  showEmpty(element, message = 'No data available') {
    element.innerHTML = `
      <div class="text-center py-5">
        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
        <p class="text-muted">${message}</p>
      </div>
    `;
  },

  createSkeletonLoader(count = 3) {
    let skeleton = '<div class="loading-skeleton-container">';
    
    for (let i = 0; i < count; i++) {
      skeleton += `
        <div class="loading-skeleton skeleton-title"></div>
        <div class="loading-skeleton skeleton-text"></div>
        <div class="loading-skeleton skeleton-text" style="width: 80%;"></div>
        <div class="loading-skeleton skeleton-text" style="width: 60%;"></div>
        <div style="height: 2rem;"></div>
      `;
    }
    
    skeleton += '</div>';
    return skeleton;
  }
};

// Image utilities
const ImageUtils = {
  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  createPlaceholder(width, height, text = '') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    if (text) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, height / 2);
    }
    
    return canvas.toDataURL();
  },

  lazyLoad(selector = '.lazy-load') {
    const images = document.querySelectorAll(selector);
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy-load');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
};

// Animation utilities
const AnimationUtils = {
  countUp(element, start = 0, end, duration = 1000) {
    const startTime = performance.now();
    const startValue = start;
    const endValue = end;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut);
      
      element.textContent = NumberUtils.formatLargeNumber(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },

  slideIn(element, direction = 'left', duration = 300) {
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };
    
    element.style.transform = transforms[direction];
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms ease-out`;
    
    // Force reflow
    element.offsetHeight;
    
    element.style.transform = 'translate(0, 0)';
    element.style.opacity = '1';
  },

  fadeInUp(elements, delay = 100) {
    elements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'all 0.6s ease-out';
      
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * delay);
    });
  }
};

// Error handling utilities
const ErrorUtils = {
  handleAPIError(error, context = '') {
    console.error(`API Error ${context}:`, error);
    
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (error.status === 429) {
      return 'Rate limit exceeded. Please try again later.';
    }
    
    if (error.status === 403) {
      return 'Access denied. Please check your API key.';
    }
    
    if (error.status >= 500) {
      return 'Server error. NASA services may be temporarily unavailable.';
    }
    
    return error.message || 'An unexpected error occurred.';
  },

  createErrorBoundary(element, fallbackContent) {
    const originalHTML = element.innerHTML;
    
    window.addEventListener('error', (event) => {
      if (element.contains(event.target)) {
        element.innerHTML = fallbackContent || `
          <div class="alert alert-danger alert-glass">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Something went wrong. Please refresh the page.
          </div>
        `;
      }
    });
    
    return originalHTML;
  }
};

// Debounce and throttle utilities
const PerformanceUtils = {
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  measurePerformance(name, func) {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }
};

// Accessibility utilities
const A11yUtils = {
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
    
    firstElement.focus();
  }
};

// Export utilities for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DateUtils,
    StorageUtils,
    CacheUtils,
    URLUtils,
    DOMUtils,
    NumberUtils,
    LoadingUtils,
    ImageUtils,
    AnimationUtils,
    ErrorUtils,
    PerformanceUtils,
    A11yUtils
  };
}