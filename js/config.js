// Cosmos Connect - Environment Configuration Manager

/**
 * Environment Configuration Utility
 * Handles environment variables and application configuration
 */
class EnvironmentConfig {
  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from environment variables with fallbacks
   */
  loadConfiguration() {
    // Load environment variables from a global object, localStorage, or use defaults
    const getEnvVar = (key, defaultValue = '') => {
      // Check for localStorage stored environment variables first
      const storageKey = key.replace('VITE_', 'COSMOS_');
      const storedValue = localStorage.getItem(storageKey);
      if (storedValue !== null) {
        return storedValue;
      }
      
      // Check for window environment variables (client-side)
      if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
        return window.ENV[key];
      }
      
      // Check for process.env (Node.js)
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
      }
      
      return defaultValue;
    };

    // Helper function to parse boolean values
    const parseBoolean = (value, defaultValue = false) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return defaultValue;
    };

    // Helper function to parse integer values
    const parseInteger = (value, defaultValue = 0) => {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    return {
      // NASA API Configuration
      nasa: {
        apiKey: getEnvVar('VITE_NASA_API_KEY', 'GeHzHGsJOVKbuYzz45Vp6kcj3jOgdm9No0b2HEbv'),
        baseUrl: getEnvVar('VITE_API_BASE_URL', 'https://api.nasa.gov'),
        debugMode: parseBoolean(getEnvVar('VITE_DEBUG_MODE'), false)
      },

      // Performance Configuration
      performance: {
        defaultQuality: getEnvVar('VITE_DEFAULT_QUALITY', 'medium'),
        maxParticles: parseInteger(getEnvVar('VITE_MAX_PARTICLES'), 10000),
        shadowMapSize: parseInteger(getEnvVar('VITE_SHADOW_MAP_SIZE'), 2048)
      },

      // Cache Configuration (in minutes)
      cache: {
        apod: parseInteger(getEnvVar('VITE_CACHE_DURATION_APOD'), 60),
        marsWeather: parseInteger(getEnvVar('VITE_CACHE_DURATION_MARS_WEATHER'), 30),
        asteroids: parseInteger(getEnvVar('VITE_CACHE_DURATION_ASTEROIDS'), 180),
        spaceWeather: parseInteger(getEnvVar('VITE_CACHE_DURATION_SPACE_WEATHER'), 15),
        marsRovers: parseInteger(getEnvVar('VITE_CACHE_DURATION_MARS_ROVERS'), 240),
        exoplanets: parseInteger(getEnvVar('VITE_CACHE_DURATION_EXOPLANETS'), 1440)
      },

      // Rate Limiting Configuration
      rateLimit: {
        demoRequests: parseInteger(getEnvVar('VITE_RATE_LIMIT_DEMO_REQUESTS'), 30),
        apiRequests: parseInteger(getEnvVar('VITE_RATE_LIMIT_API_REQUESTS'), 1000),
        window: parseInteger(getEnvVar('VITE_RATE_LIMIT_WINDOW'), 3600000)
      },

      // Application Configuration
      app: {
        name: getEnvVar('VITE_APP_NAME', 'Cosmos Connect'),
        version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
        port: parseInteger(getEnvVar('VITE_APP_PORT'), 8000),
        host: getEnvVar('VITE_APP_HOST', 'localhost')
      },

      // Feature Flags
      features: {
        offlineMode: parseBoolean(getEnvVar('VITE_ENABLE_OFFLINE_MODE'), true),
        advancedSearch: parseBoolean(getEnvVar('VITE_ENABLE_ADVANCED_SEARCH'), true),
        userPreferences: parseBoolean(getEnvVar('VITE_ENABLE_USER_PREFERENCES'), true),
        performanceMonitoring: parseBoolean(getEnvVar('VITE_ENABLE_PERFORMANCE_MONITORING'), false)
      },

      // Third-party Services
      services: {
        analyticsId: getEnvVar('VITE_ANALYTICS_ID', ''),
        errorTrackingDsn: getEnvVar('VITE_ERROR_TRACKING_DSN', '')
      },

      // Development Settings
      development: {
        hotReload: parseBoolean(getEnvVar('VITE_HOT_RELOAD'), true),
        sourceMaps: parseBoolean(getEnvVar('VITE_SOURCE_MAPS'), true),
        minify: parseBoolean(getEnvVar('VITE_MINIFY'), false)
      }
    };
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot notation path (e.g., 'nasa.apiKey')
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let current = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Set NASA API key
   * @param {string} apiKey - NASA API key
   */
  setApiKey(apiKey) {
    if (apiKey && apiKey.trim() !== '') {
      localStorage.setItem('COSMOS_NASA_API_KEY', apiKey.trim());
      this.config.nasa.apiKey = apiKey.trim();
      console.log('NASA API key updated successfully');
    }
  }

  /**
   * Get NASA API configuration
   * @returns {object} NASA API configuration
   */
  getNasaConfig() {
    return this.config.nasa;
  }

  /**
   * Get cache configuration
   * @returns {object} Cache configuration
   */
  getCacheConfig() {
    return this.config.cache;
  }

  /**
   * Get rate limit configuration
   * @returns {object} Rate limit configuration
   */
  getRateLimitConfig() {
    return this.config.rateLimit;
  }

  /**
   * Get performance configuration
   * @returns {object} Performance configuration
   */
  getPerformanceConfig() {
    return this.config.performance;
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean} Debug mode status
   */
  isDebugMode() {
    return this.config.nasa.debugMode;
  }

  /**
   * Get application information
   * @returns {object} Application information
   */
  getAppInfo() {
    return this.config.app;
  }

  /**
   * Log configuration (for debugging)
   */
  logConfig() {
    if (this.isDebugMode()) {
      console.group('🚀 Cosmos Connect Configuration');
      console.log('NASA API Key:', this.config.nasa.apiKey === 'DEMO_KEY' ? 'DEMO_KEY (Limited)' : 'Custom Key');
      console.log('Debug Mode:', this.config.nasa.debugMode);
      console.log('Features:', this.config.features);
      console.log('Performance:', this.config.performance);
      console.groupEnd();
    }
  }

  /**
   * Validate configuration
   * @returns {object} Validation result
   */
  validateConfig() {
    const issues = [];
    const warnings = [];

    // Check NASA API key
    if (this.config.nasa.apiKey === 'DEMO_KEY') {
      warnings.push('Using DEMO_KEY - limited to 30 requests per hour. Set your NASA API key using ENV_CONFIG.setApiKey("your_key_here") in the browser console.');
    }

    // Check required URLs
    if (!this.config.nasa.baseUrl) {
      issues.push('NASA base URL is not configured');
    }

    // Check cache durations
    const cacheValues = Object.values(this.config.cache);
    if (cacheValues.some(value => value < 0)) {
      issues.push('Cache durations cannot be negative');
    }

    // Check rate limits
    if (this.config.rateLimit.demoRequests <= 0 || this.config.rateLimit.apiRequests <= 0) {
      issues.push('Rate limits must be positive numbers');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }
}

// Create global configuration instance
const ENV_CONFIG = new EnvironmentConfig();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnvironmentConfig, ENV_CONFIG };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ENV_CONFIG = ENV_CONFIG;
}

// Log configuration in debug mode
ENV_CONFIG.logConfig();

// Validate configuration and log any issues
const validation = ENV_CONFIG.validateConfig();
if (!validation.isValid) {
  console.error('Configuration Issues:', validation.issues);
}
if (validation.warnings.length > 0) {
  console.warn('Configuration Warnings:', validation.warnings);
}