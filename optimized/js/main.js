// Cosmos Connect - Main JavaScript

// Application state
const AppState = {
  currentPage: 'home',
  theme: StorageUtils.get('app_theme', 'dark'),
  units: StorageUtils.get('app_units', 'metric'),
  animations: StorageUtils.get('app_animations', true),
  featuredAPOD: null,
  isLoading: false
};

// Application initialization
class CosmosConnectApp {
  constructor() {
    this.initialized = false;
    this.components = new Map();
    this.eventListeners = new Map();
  }

  async init() {
    if (this.initialized) return;

    try {
      // Show loading screen
      this.showLoadingScreen();

      // Initialize core components
      await this.initializeComponents();

      // Set up event listeners
      this.setupEventListeners();

      // Apply user preferences
      this.applyUserPreferences();

      // Load initial content
      await this.loadInitialContent();

      // Initialize animations
      this.initializeAnimations();

      // Hide loading screen
      this.hideLoadingScreen();

      this.initialized = true;
      console.log('Cosmos Connect initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Cosmos Connect:', error);
      this.showErrorMessage('Failed to initialize application. Please refresh the page.');
    }
  }

  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 1000); // Minimum loading time for better UX
    }
  }

  async initializeComponents() {
    // Initialize Navigation
    this.components.set('navigation', new NavigationComponent());
    
    // Initialize Hero Section (only on home page)
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
      this.components.set('hero', new HeroComponent());
      this.components.set('stats', new StatsComponent());
    }

    // Initialize API status monitor
    this.components.set('apiStatus', new APIStatusComponent());
  }

  setupEventListeners() {
    // Theme toggle
    window.toggleTheme = this.toggleTheme.bind(this);
    
    // Units toggle
    window.toggleUnits = this.toggleUnits.bind(this);

    // Window resize handler
    this.eventListeners.set('resize', PerformanceUtils.throttle(() => {
      this.handleResize();
    }, 250));
    window.addEventListener('resize', this.eventListeners.get('resize'));

    // Online/offline status
    this.eventListeners.set('online', () => this.handleOnlineStatus(true));
    this.eventListeners.set('offline', () => this.handleOnlineStatus(false));
    window.addEventListener('online', this.eventListeners.get('online'));
    window.addEventListener('offline', this.eventListeners.get('offline'));

    // Keyboard shortcuts
    this.eventListeners.set('keydown', (e) => this.handleKeyboardShortcuts(e));
    document.addEventListener('keydown', this.eventListeners.get('keydown'));

    // Page visibility change
    this.eventListeners.set('visibilitychange', () => this.handleVisibilityChange());
    document.addEventListener('visibilitychange', this.eventListeners.get('visibilitychange'));
  }

  applyUserPreferences() {
    // Apply theme
    document.body.setAttribute('data-theme', AppState.theme);

    // Apply animation preferences
    if (!AppState.animations) {
      document.body.classList.add('reduce-motion');
    }

    // Update UI elements
    this.updateThemeIndicator();
    this.updateUnitsIndicator();
  }

  async loadInitialContent() {
    // Load featured APOD on home page
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
      await this.loadFeaturedAPOD();
    }

    // Initialize lazy loading for images
    ImageUtils.lazyLoad();
  }

  initializeAnimations() {
    if (!AppState.animations) return;

    // Animate feature cards on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '50px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe feature cards and other elements
    document.querySelectorAll('.feature-card, .stat-card, .data-card').forEach(card => {
      observer.observe(card);
    });

    // Animate stats counters
    this.animateStatsCounters();
  }

  async loadFeaturedAPOD() {
    const featuredContainer = document.getElementById('featured-apod');
    if (!featuredContainer) return;

    try {
      LoadingUtils.showLoading(featuredContainer, 'Loading today\'s cosmic view...');
      
      const apodData = await APIManager.apod.getTodayAPOD();
      AppState.featuredAPOD = apodData;
      
      this.renderFeaturedAPOD(featuredContainer, apodData);
      
    } catch (error) {
      console.error('Failed to load featured APOD:', error);
      const errorMessage = ErrorUtils.handleAPIError(error, 'featured APOD');
      LoadingUtils.showError(featuredContainer, errorMessage);
    }
  }

  renderFeaturedAPOD(container, data) {
    const isVideo = data.media_type === 'video';
    
    container.innerHTML = `
      <div class="featured-apod-content">
        <div class="featured-media mb-3">
          ${isVideo 
            ? `<iframe src="${data.url}" class="w-100 rounded" style="height: 250px;" frameborder="0" allowfullscreen></iframe>`
            : `<img src="${data.url}" alt="${data.title}" class="img-fluid rounded lazy-load" loading="lazy">`
          }
        </div>
        <h5 class="featured-title">${data.title}</h5>
        <p class="featured-date text-muted">
          <i class="fas fa-calendar me-1"></i>
          ${DateUtils.formatDate(data.date)}
        </p>
        <p class="featured-description">${this.truncateText(data.explanation, 150)}</p>
        <a href="pages/apod.html" class="btn btn-sm btn-primary">
          <i class="fas fa-arrow-right me-1"></i>
          View Full APOD
        </a>
      </div>
    `;
  }

  animateStatsCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const finalValue = parseInt(element.getAttribute('data-count')) || 0;
          AnimationUtils.countUp(element, 0, finalValue, 2000);
          observer.unobserve(element);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => observer.observe(stat));
  }

  toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', AppState.theme);
    StorageUtils.set('app_theme', AppState.theme);
    this.updateThemeIndicator();
    
    // Announce change to screen readers
    A11yUtils.announceToScreenReader(`Theme changed to ${AppState.theme} mode`);
  }

  toggleUnits() {
    AppState.units = AppState.units === 'metric' ? 'imperial' : 'metric';
    StorageUtils.set('app_units', AppState.units);
    this.updateUnitsIndicator();
    
    // Refresh any displayed data that uses units
    this.refreshUnitsDisplays();
    
    A11yUtils.announceToScreenReader(`Units changed to ${AppState.units}`);
  }

  updateThemeIndicator() {
    // This will be expanded when light theme is implemented
    const themeText = AppState.theme === 'dark' ? 'Dark' : 'Light';
    console.log(`Theme: ${themeText}`);
  }

  updateUnitsIndicator() {
    const unitsElement = document.getElementById('current-units');
    if (unitsElement) {
      unitsElement.textContent = AppState.units === 'metric' ? 'Metric' : 'Imperial';
    }
  }

  refreshUnitsDisplays() {
    // Trigger refresh of any components that display unit-dependent data
    const event = new CustomEvent('unitsChanged', { detail: { units: AppState.units } });
    document.dispatchEvent(event);
  }

  handleResize() {
    // Handle responsive layout changes
    const width = window.innerWidth;
    
    if (width < 768) {
      document.body.classList.add('mobile-view');
    } else {
      document.body.classList.remove('mobile-view');
    }
  }

  handleOnlineStatus(isOnline) {
    if (isOnline) {
      this.showToast('Connection restored', 'success');
      // Retry failed requests
      this.retryFailedRequests();
    } else {
      this.showToast('Connection lost - using cached data', 'warning');
    }
  }

  handleKeyboardShortcuts(event) {
    // Only handle shortcuts when not in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const shortcuts = {
      'h': () => window.location.href = 'index.html',
      'a': () => window.location.href = 'pages/apod.html',
      'm': () => window.location.href = 'pages/mars-weather.html',
      's': () => window.location.href = 'pages/space-weather.html',
      'r': () => window.location.href = 'pages/mars-rovers.html',
      'e': () => window.location.href = 'pages/exoplanets.html',
      't': () => this.toggleTheme(),
      'u': () => this.toggleUnits()
    };

    if (event.ctrlKey || event.altKey) {
      const key = event.key.toLowerCase();
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden - pause animations, stop API calls
      this.pauseBackgroundActivities();
    } else {
      // Page is visible - resume activities
      this.resumeBackgroundActivities();
    }
  }

  pauseBackgroundActivities() {
    // Stop any ongoing animations or periodic API calls
    document.body.classList.add('page-hidden');
  }

  resumeBackgroundActivities() {
    // Resume animations and periodic updates
    document.body.classList.remove('page-hidden');
  }

  retryFailedRequests() {
    // Implement retry logic for failed API requests
    const failedRequests = StorageUtils.get('failed_requests', []);
    
    failedRequests.forEach(async (request) => {
      try {
        // Retry the request
        console.log('Retrying failed request:', request);
        // Implementation depends on specific request type
      } catch (error) {
        console.error('Retry failed:', error);
      }
    });

    // Clear failed requests
    StorageUtils.remove('failed_requests');
  }

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
        ${message}
      </div>
    `;

    // Add toast to page
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, duration);
  }

  getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'times-circle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  showErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-overlay';
    errorContainer.innerHTML = `
      <div class="error-content glass-card">
        <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
        <h4>Oops! Something went wrong</h4>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">
          <i class="fas fa-refresh me-2"></i>Refresh Page
        </button>
      </div>
    `;

    document.body.appendChild(errorContainer);
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  destroy() {
    // Clean up event listeners
    this.eventListeners.forEach((listener, event) => {
      if (event === 'resize' || event === 'online' || event === 'offline') {
        window.removeEventListener(event, listener);
      } else {
        document.removeEventListener(event, listener);
      }
    });

    // Clean up components
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });

    this.initialized = false;
  }
}

// Component Classes

class NavigationComponent {
  constructor() {
    this.navElement = document.querySelector('.navbar');
    this.init();
  }

  init() {
    this.setupScrollBehavior();
    this.setupActiveNavigation();
  }

  setupScrollBehavior() {
    let lastScrollY = window.scrollY;

    const handleScroll = PerformanceUtils.throttle(() => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        this.navElement.classList.add('scrolled');
      } else {
        this.navElement.classList.remove('scrolled');
      }

      lastScrollY = currentScrollY;
    }, 100);

    window.addEventListener('scroll', handleScroll);
  }

  setupActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes(currentPage) || (currentPage === '' && href === 'index.html'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

class HeroComponent {
  constructor() {
    this.heroElement = document.querySelector('.hero-section');
    this.init();
  }

  init() {
    this.setupParallaxEffect();
    this.setupFloatingAnimation();
  }

  setupParallaxEffect() {
    if (!AppState.animations) return;

    const handleScroll = PerformanceUtils.throttle(() => {
      const scrolled = window.pageYOffset;
      const parallaxElements = this.heroElement.querySelectorAll('.parallax');
      
      parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    }, 16);

    window.addEventListener('scroll', handleScroll);
  }

  setupFloatingAnimation() {
    if (!AppState.animations) return;

    const floatingCard = this.heroElement.querySelector('.floating-card');
    if (floatingCard) {
      // Add subtle mouse tracking effect
      this.heroElement.addEventListener('mousemove', (e) => {
        const rect = this.heroElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) * 0.01;
        const deltaY = (e.clientY - centerY) * 0.01;
        
        floatingCard.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px)`;
      });

      this.heroElement.addEventListener('mouseleave', () => {
        floatingCard.style.transform = 'translateX(0) translateY(0)';
      });
    }
  }
}

class StatsComponent {
  constructor() {
    this.statsSection = document.querySelector('.stats-section');
    this.animated = false;
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    if (!this.statsSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animated) {
          this.animateStats();
          this.animated = true;
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(this.statsSection);
  }

  animateStats() {
    const statNumbers = this.statsSection.querySelectorAll('.stat-number');
    
    statNumbers.forEach((stat, index) => {
      setTimeout(() => {
        const targetValue = parseInt(stat.getAttribute('data-count'));
        AnimationUtils.countUp(stat, 0, targetValue, 2000);
      }, index * 200);
    });
  }
}

class APIStatusComponent {
  constructor() {
    this.statusElement = null;
    this.init();
  }

  init() {
    this.createStatusIndicator();
    this.updateStatus();
    
    // Update status periodically
    setInterval(() => this.updateStatus(), 60000);
  }

  createStatusIndicator() {
    // API status indicator removed per user request
    this.statusElement = null;
  }

  async updateStatus() {
    if (!this.statusElement) return;

    try {
      const rateLimitInfo = APIManager.getRateLimitInfo();
      const statusDot = this.statusElement.querySelector('.status-dot');
      const statusText = this.statusElement.querySelector('.status-text');
      
      if (rateLimitInfo.remaining > 10) {
        statusDot.className = 'status-dot status-good';
        statusText.textContent = `API OK (${rateLimitInfo.remaining} remaining)`;
      } else if (rateLimitInfo.remaining > 0) {
        statusDot.className = 'status-dot status-warning';
        statusText.textContent = `API Limited (${rateLimitInfo.remaining} remaining)`;
      } else {
        statusDot.className = 'status-dot status-error';
        const resetTime = Math.ceil(rateLimitInfo.resetTime / 1000 / 60);
        statusText.textContent = `API Exhausted (reset in ${resetTime}m)`;
      }
    } catch (error) {
      console.error('Failed to update API status:', error);
    }
  }
}

// Initialize application
const app = new CosmosConnectApp();

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  app.showToast('An unexpected error occurred', 'error');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  app.showToast('An unexpected error occurred', 'error');
});

// Export for use in other files
window.CosmosConnect = {
  app,
  AppState,
  APIManager
};