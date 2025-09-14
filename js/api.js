// Cosmos Connect - NASA API Service Layer

// Load environment configuration
// Note: config.js should be loaded before this file
const getApiConfig = () => {
  // Try to use environment configuration if available
  if (typeof ENV_CONFIG !== 'undefined') {
    const nasaConfig = ENV_CONFIG.getNasaConfig();
    const cacheConfig = ENV_CONFIG.getCacheConfig();
    const rateLimitConfig = ENV_CONFIG.getRateLimitConfig();
    
    return {
      BASE_URL: nasaConfig.baseUrl,
      DEFAULT_API_KEY: nasaConfig.apiKey,
      RATE_LIMIT: {
        DEMO_KEY: { requests: rateLimitConfig.demoRequests, window: rateLimitConfig.window },
        API_KEY: { requests: rateLimitConfig.apiRequests, window: rateLimitConfig.window }
      },
      CACHE_DURATION: {
        APOD: cacheConfig.apod,
        MARS_WEATHER: cacheConfig.marsWeather,
        ASTEROIDS: cacheConfig.asteroids,
        SPACE_WEATHER: cacheConfig.spaceWeather,
        MARS_ROVERS: cacheConfig.marsRovers,
        EXOPLANETS: cacheConfig.exoplanets
      }
    };
  }
  
  // Fallback configuration if ENV_CONFIG is not available
  return {
    BASE_URL: 'https://api.nasa.gov',
    DEFAULT_API_KEY: 'DEMO_KEY',
    RATE_LIMIT: {
      DEMO_KEY: { requests: 30, window: 3600000 }, // 30 requests per hour
      API_KEY: { requests: 1000, window: 3600000 }  // 1000 requests per hour
    },
    CACHE_DURATION: {
      APOD: 60,          // 1 hour
      MARS_WEATHER: 30,  // 30 minutes
      ASTEROIDS: 180,    // 3 hours
      SPACE_WEATHER: 15, // 15 minutes
      MARS_ROVERS: 240,  // 4 hours
      EXOPLANETS: 1440   // 24 hours
    }
  };
};

// Initialize API configuration
const API_CONFIG = getApiConfig();

// Rate Limiter Class
class RateLimiter {
  constructor(config) {
    this.maxRequests = config.requests;
    this.windowMs = config.window;
    this.requests = StorageUtils.get('rate_limiter_requests', []);
    this.cleanOldRequests();
  }

  cleanOldRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.windowMs
    );
    StorageUtils.set('rate_limiter_requests', this.requests);
  }

  canMakeRequest() {
    this.cleanOldRequests();
    return this.requests.length < this.maxRequests;
  }

  recordRequest() {
    this.requests.push(Date.now());
    StorageUtils.set('rate_limiter_requests', this.requests);
  }

  getTimeUntilReset() {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const timeUntilReset = this.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, timeUntilReset);
  }

  getRemainingRequests() {
    this.cleanOldRequests();
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Custom API Error Class
class APIError extends Error {
  constructor(status, message, endpoint) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

// Base API Service Class
class BaseAPIService {
  constructor(apiKey = API_CONFIG.DEFAULT_API_KEY) {
    this.apiKey = apiKey;
    this.baseURL = API_CONFIG.BASE_URL;
    
    // Set up rate limiting based on API key type
    const rateConfig = apiKey === API_CONFIG.DEFAULT_API_KEY 
      ? API_CONFIG.RATE_LIMIT.DEMO_KEY 
      : API_CONFIG.RATE_LIMIT.API_KEY;
    
    this.rateLimiter = new RateLimiter(rateConfig);
  }

  async makeRequest(endpoint, params = {}, cacheKey = null, cacheDuration = 60) {
    // Check cache first
    if (cacheKey) {
      const cachedData = CacheUtils.getCachedData(cacheKey, cacheDuration);
      if (cachedData) {
        return cachedData;
      }
    }

    // Check rate limiting
    if (!this.rateLimiter.canMakeRequest()) {
      const resetTime = Math.ceil(this.rateLimiter.getTimeUntilReset() / 1000 / 60);
      throw new APIError(429, `Rate limit exceeded. Try again in ${resetTime} minutes.`, endpoint);
    }

    // Build URL with parameters
    const url = URLUtils.buildURL(`${this.baseURL}${endpoint}`, {
      api_key: this.apiKey,
      ...params
    });

    try {
      // Record the request for rate limiting
      this.rateLimiter.recordRequest();

      // Make the API call
      const response = await fetch(url);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          // Use default error message if response is not JSON
        }
        
        throw new APIError(response.status, errorMessage, endpoint);
      }

      const data = await response.json();
      
      // Cache the successful response
      if (cacheKey) {
        CacheUtils.setCachedData(cacheKey, data, cacheDuration);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle network errors
      if (!navigator.onLine) {
        throw new APIError(0, 'No internet connection available.', endpoint);
      }
      
      throw new APIError(0, error.message || 'Network request failed.', endpoint);
    }
  }

  getRateLimitInfo() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getTimeUntilReset()
    };
  }
}

// APOD Service
class APODService extends BaseAPIService {
  async getTodayAPOD() {
    return this.makeRequest('/planetary/apod', {}, 'apod_today', API_CONFIG.CACHE_DURATION.APOD);
  }

  async getAPODByDate(date) {
    const cacheKey = `apod_${date}`;
    return this.makeRequest('/planetary/apod', { date }, cacheKey, API_CONFIG.CACHE_DURATION.APOD);
  }

  async getAPODRange(startDate, endDate) {
    const cacheKey = `apod_range_${startDate}_${endDate}`;
    return this.makeRequest('/planetary/apod', { 
      start_date: startDate, 
      end_date: endDate 
    }, cacheKey, API_CONFIG.CACHE_DURATION.APOD);
  }

  async getRandomAPOD(count = 1) {
    return this.makeRequest('/planetary/apod', { count }, null, 0); // Don't cache random images
  }
}

// Mars Weather Service (InSight)
class MarsWeatherService extends BaseAPIService {
  async getCurrentWeather() {
    return this.makeRequest('/insight_weather/', { 
      feedtype: 'json', 
      ver: '1.0' 
    }, 'mars_weather_current', API_CONFIG.CACHE_DURATION.MARS_WEATHER);
  }

  async getLatestSol() {
    const data = await this.getCurrentWeather();
    if (data && data.sol_keys && data.sol_keys.length > 0) {
      const latestSol = data.sol_keys[data.sol_keys.length - 1];
      return {
        sol: latestSol,
        data: data[latestSol]
      };
    }
    return null;
  }
}

// Asteroid Service (NeoWs)
class AsteroidService extends BaseAPIService {
  async getNearEarthObjects(startDate = null, endDate = null) {
    const today = DateUtils.getTodayString();
    const params = {
      start_date: startDate || today,
      end_date: endDate || today
    };
    
    const cacheKey = `asteroids_${params.start_date}_${params.end_date}`;
    return this.makeRequest('/neo/rest/v1/feed', params, cacheKey, API_CONFIG.CACHE_DURATION.ASTEROIDS);
  }

  async getAsteroidDetails(asteroidId) {
    const cacheKey = `asteroid_${asteroidId}`;
    return this.makeRequest(`/neo/rest/v1/neo/${asteroidId}`, {}, cacheKey, API_CONFIG.CACHE_DURATION.ASTEROIDS);
  }

  async browseAsteroids(page = 0, size = 20) {
    const cacheKey = `asteroids_browse_${page}_${size}`;
    return this.makeRequest('/neo/rest/v1/neo/browse', { page, size }, cacheKey, API_CONFIG.CACHE_DURATION.ASTEROIDS);
  }

  async getAsteroidsForWeek() {
    const today = DateUtils.getTodayString();
    const weekAgo = DateUtils.getDateDaysAgo(7);
    return this.getNearEarthObjects(weekAgo, today);
  }
}

// Space Weather Service (DONKI)
class SpaceWeatherService extends BaseAPIService {
  async getCoronalMassEjections(startDate = null, endDate = null) {
    const today = DateUtils.getTodayString();
    const params = {
      startDate: startDate || DateUtils.getDateDaysAgo(30),
      endDate: endDate || today
    };
    
    const cacheKey = `cme_${params.startDate}_${params.endDate}`;
    return this.makeRequest('/DONKI/CME', params, cacheKey, API_CONFIG.CACHE_DURATION.SPACE_WEATHER);
  }

  async getGeomagneticStorms(startDate = null, endDate = null) {
    const today = DateUtils.getTodayString();
    const params = {
      startDate: startDate || DateUtils.getDateDaysAgo(30),
      endDate: endDate || today
    };
    
    const cacheKey = `gst_${params.startDate}_${params.endDate}`;
    return this.makeRequest('/DONKI/GST', params, cacheKey, API_CONFIG.CACHE_DURATION.SPACE_WEATHER);
  }

  async getSolarFlares(startDate = null, endDate = null) {
    const today = DateUtils.getTodayString();
    const params = {
      startDate: startDate || DateUtils.getDateDaysAgo(30),
      endDate: endDate || today
    };
    
    const cacheKey = `flr_${params.startDate}_${params.endDate}`;
    return this.makeRequest('/DONKI/FLR', params, cacheKey, API_CONFIG.CACHE_DURATION.SPACE_WEATHER);
  }

  async getSpaceWeatherNotifications(startDate = null, endDate = null) {
    const today = DateUtils.getTodayString();
    const params = {
      startDate: startDate || DateUtils.getDateDaysAgo(7),
      endDate: endDate || today,
      type: 'all'
    };
    
    const cacheKey = `notifications_${params.startDate}_${params.endDate}`;
    return this.makeRequest('/DONKI/notifications', params, cacheKey, API_CONFIG.CACHE_DURATION.SPACE_WEATHER);
  }

  async getAllSpaceWeatherEvents(startDate = null, endDate = null) {
    try {
      const [cme, gst, flares, notifications] = await Promise.allSettled([
        this.getCoronalMassEjections(startDate, endDate),
        this.getGeomagneticStorms(startDate, endDate),
        this.getSolarFlares(startDate, endDate),
        this.getSpaceWeatherNotifications(startDate, endDate)
      ]);

      return {
        coronalMassEjections: cme.status === 'fulfilled' ? cme.value : [],
        geomagneticStorms: gst.status === 'fulfilled' ? gst.value : [],
        solarFlares: flares.status === 'fulfilled' ? flares.value : [],
        notifications: notifications.status === 'fulfilled' ? notifications.value : []
      };
    } catch (error) {
      throw new APIError(0, 'Failed to fetch space weather data', '/DONKI/*');
    }
  }
}

// Mars Rover Photos Service
class MarsRoverService extends BaseAPIService {
  async getRoverPhotos(rover, sol = null, earthDate = null, camera = null, page = 1) {
    const params = { page };
    
    if (sol !== null) params.sol = sol;
    if (earthDate) params.earth_date = earthDate;
    if (camera) params.camera = camera;
    
    const cacheKey = `rover_${rover}_${sol || earthDate}_${camera || 'all'}_${page}`;
    return this.makeRequest(`/mars-photos/api/v1/rovers/${rover}/photos`, params, cacheKey, API_CONFIG.CACHE_DURATION.MARS_ROVERS);
  }

  async getRoverManifest(rover) {
    const cacheKey = `rover_manifest_${rover}`;
    return this.makeRequest(`/mars-photos/api/v1/manifests/${rover}`, {}, cacheKey, API_CONFIG.CACHE_DURATION.MARS_ROVERS);
  }

  async getLatestPhotos(rover, count = 20) {
    try {
      const manifest = await this.getRoverManifest(rover);
      if (manifest && manifest.photo_manifest && manifest.photo_manifest.max_sol) {
        const latestSol = manifest.photo_manifest.max_sol;
        const photos = await this.getRoverPhotos(rover, latestSol);
        return photos.photos ? photos.photos.slice(0, count) : [];
      }
      return [];
    } catch (error) {
      throw new APIError(0, `Failed to get latest photos for ${rover}`, `/mars-photos/api/v1/rovers/${rover}`);
    }
  }

  getRoverCameras(rover) {
    const cameras = {
      curiosity: [
        { abbrev: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
        { abbrev: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
        { abbrev: 'MAST', name: 'Mast Camera' },
        { abbrev: 'CHEMCAM', name: 'Chemistry and Camera Complex' },
        { abbrev: 'MAHLI', name: 'Mars Hand Lens Imager' },
        { abbrev: 'MARDI', name: 'Mars Descent Imager' },
        { abbrev: 'NAVCAM', name: 'Navigation Camera' }
      ],
      opportunity: [
        { abbrev: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
        { abbrev: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
        { abbrev: 'NAVCAM', name: 'Navigation Camera' },
        { abbrev: 'PANCAM', name: 'Panoramic Camera' },
        { abbrev: 'MINITES', name: 'Miniature Thermal Emission Spectrometer' }
      ],
      spirit: [
        { abbrev: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
        { abbrev: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
        { abbrev: 'NAVCAM', name: 'Navigation Camera' },
        { abbrev: 'PANCAM', name: 'Panoramic Camera' },
        { abbrev: 'MINITES', name: 'Miniature Thermal Emission Spectrometer' }
      ],
      perseverance: [
        { abbrev: 'EDL_RUCAM', name: 'Rover Up-Look Camera' },
        { abbrev: 'EDL_RDCAM', name: 'Rover Down-Look Camera' },
        { abbrev: 'EDL_DDCAM', name: 'Descent Stage Down-Look Camera' },
        { abbrev: 'EDL_PUCAM1', name: 'Parachute Up-Look Camera A' },
        { abbrev: 'EDL_PUCAM2', name: 'Parachute Up-Look Camera B' },
        { abbrev: 'NAVCAM_LEFT', name: 'Navigation Camera - Left' },
        { abbrev: 'NAVCAM_RIGHT', name: 'Navigation Camera - Right' },
        { abbrev: 'MCZ_RIGHT', name: 'Mast Camera Zoom - Right' },
        { abbrev: 'MCZ_LEFT', name: 'Mast Camera Zoom - Left' },
        { abbrev: 'FRONT_HAZCAM_LEFT_A', name: 'Front Hazard Avoidance Camera - Left' },
        { abbrev: 'FRONT_HAZCAM_RIGHT_A', name: 'Front Hazard Avoidance Camera - Right' },
        { abbrev: 'REAR_HAZCAM_LEFT', name: 'Rear Hazard Avoidance Camera - Left' },
        { abbrev: 'REAR_HAZCAM_RIGHT', name: 'Rear Hazard Avoidance Camera - Right' },
        { abbrev: 'SKYCAM', name: 'MEDA Skycam' },
        { abbrev: 'SHERLOC_WATSON', name: 'SHERLOC WATSON Camera' }
      ]
    };
    
    return cameras[rover.toLowerCase()] || [];
  }
}

// Exoplanet Service
class ExoplanetService {
  constructor() {
    this.baseURL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
    this.corsProxyURLs = [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?',
      'https://api.codetabs.com/v1/proxy?quest='
    ];
    this.useCorsProxy = true; // Enable CORS proxy for development
  }

  async makeRequest(query, format = 'json') {
    const cacheKey = `exoplanets_${btoa(query)}_${format}`;
    const cachedData = CacheUtils.getCachedData(cacheKey, API_CONFIG.CACHE_DURATION.EXOPLANETS);
    
    if (cachedData) {
      return cachedData;
    }

    // Try CORS proxies first if enabled
    if (this.useCorsProxy) {
      for (const proxyURL of this.corsProxyURLs) {
        try {
          const targetURL = URLUtils.buildURL(this.baseURL, { query, format });
          let proxyUrl;
          
          if (proxyURL.includes('allorigins.win')) {
            proxyUrl = proxyURL + encodeURIComponent(targetURL);
          } else {
            proxyUrl = proxyURL + encodeURIComponent(targetURL);
          }
          
          console.log(`Trying CORS proxy: ${proxyURL}`);
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            console.warn(`CORS proxy ${proxyURL} returned ${response.status}`);
            continue;
          }
          
          let data;
          if (proxyURL.includes('allorigins.win')) {
            const result = await response.json();
            if (result.contents) {
              data = JSON.parse(result.contents);
            } else {
              throw new Error('Invalid allorigins response format');
            }
          } else {
            data = await response.json();
          }
          
          CacheUtils.setCachedData(cacheKey, data, API_CONFIG.CACHE_DURATION.EXOPLANETS);
          console.log(`Successfully loaded data via CORS proxy: ${proxyURL}`);
          return data;
          
        } catch (error) {
          console.warn(`CORS proxy ${proxyURL} failed:`, error.message);
          continue;
        }
      }
    }

    // Try direct API call as fallback
    try {
      console.log('Trying direct API call...');
      const url = URLUtils.buildURL(this.baseURL, { query, format });
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new APIError(response.status, `HTTP ${response.status}: ${response.statusText}`, '/TAP/sync');
      }

      const data = await response.json();
      CacheUtils.setCachedData(cacheKey, data, API_CONFIG.CACHE_DURATION.EXOPLANETS);
      console.log('Successfully loaded data via direct API call');
      return data;
      
    } catch (error) {
      console.warn('Direct API call failed:', error.message);
    }
    
    // Return sample data as final fallback
    console.warn('All API attempts failed, using sample exoplanet data');
    const sampleData = this.getSampleExoplanetData();
    return sampleData;
  }

  async getAllPlanets(limit = 100) {
    const query = `select top ${limit} pl_name,hostname,discoverymethod,pl_rade,pl_masse,pl_orbper,pl_eqt,disc_year,sy_dist,sys_name from ps where pl_name is not null order by disc_year desc`;
    return this.makeRequest(query);
  }

  async getPlanetsByYear(year) {
    const query = `select pl_name,hostname,discoverymethod,pl_rade,pl_masse,pl_orbper,pl_eqt,sy_dist,sys_name,disc_year from ps where disc_year=${year} and pl_name is not null`;
    return this.makeRequest(query);
  }

  async getEarthLikePlanets() {
    const query = `select pl_name,hostname,discoverymethod,pl_rade,pl_masse,pl_orbper,pl_eqt,sy_dist,sys_name,disc_year from ps where pl_rade between 0.8 and 1.2 and pl_name is not null order by sy_dist`;
    return this.makeRequest(query);
  }

  async searchPlanets(searchTerm) {
    const query = `select pl_name,hostname,discoverymethod,pl_rade,pl_masse,pl_orbper,pl_eqt,sy_dist,sys_name,disc_year from ps where pl_name like '%${searchTerm}%' and pl_name is not null order by disc_year desc`;
    return this.makeRequest(query);
  }

  async getRecentDiscoveries(days = 365) {
    const currentYear = new Date().getFullYear();
    const query = `select pl_name,hostname,discoverymethod,pl_rade,pl_masse,pl_orbper,pl_eqt,sy_dist,sys_name,disc_year from ps where disc_year>=${currentYear - 1} and pl_name is not null order by disc_year desc`;
    return this.makeRequest(query);
  }

  /**
   * Provides sample exoplanet data as fallback when API is unavailable
   * @returns {Array} Sample exoplanet data
   */
  getSampleExoplanetData() {
    return [
      {
        pl_name: "Kepler-452b",
        hostname: "Kepler-452",
        discoverymethod: "Transit",
        pl_rade: 1.63,
        pl_masse: null,
        pl_orbper: 384.843,
        pl_eqt: 265,
        disc_year: 2015,
        sy_dist: 554.72,
        sys_name: "Kepler-452"
      },
      {
        pl_name: "TOI-715 b",
        hostname: "TOI-715",
        discoverymethod: "Transit",
        pl_rade: 1.55,
        pl_masse: null,
        pl_orbper: 19.3,
        pl_eqt: 280,
        disc_year: 2024,
        sy_dist: 37.2,
        sys_name: "TOI-715"
      },
      {
        pl_name: "TRAPPIST-1e",
        hostname: "TRAPPIST-1",
        discoverymethod: "Transit",
        pl_rade: 0.91,
        pl_masse: 0.69,
        pl_orbper: 6.1,
        pl_eqt: 251,
        disc_year: 2017,
        sy_dist: 12.43,
        sys_name: "TRAPPIST-1"
      },
      {
        pl_name: "Proxima Centauri b",
        hostname: "Proxima Centauri",
        discoverymethod: "Radial Velocity",
        pl_rade: 1.03,
        pl_masse: 1.07,
        pl_orbper: 11.2,
        pl_eqt: 234,
        disc_year: 2016,
        sy_dist: 1.3,
        sys_name: "Proxima Centauri"
      },
      {
        pl_name: "K2-18 b",
        hostname: "K2-18",
        discoverymethod: "Transit",
        pl_rade: 2.61,
        pl_masse: 8.63,
        pl_orbper: 32.9,
        pl_eqt: 279,
        disc_year: 2015,
        sy_dist: 37.46,
        sys_name: "K2-18"
      },
      {
        pl_name: "TOI-849 b",
        hostname: "TOI-849",
        discoverymethod: "Transit",
        pl_rade: 3.45,
        pl_masse: 40.8,
        pl_orbper: 0.765,
        pl_eqt: 1800,
        disc_year: 2020,
        sy_dist: 53.4,
        sys_name: "TOI-849"
      },
      {
        pl_name: "HD 209458 b",
        hostname: "HD 209458",
        discoverymethod: "Transit",
        pl_rade: 14.3,
        pl_masse: 219.4,
        pl_orbper: 3.52,
        pl_eqt: 1449,
        disc_year: 1999,
        sy_dist: 47.0,
        sys_name: "HD 209458"
      },
      {
        pl_name: "55 Cancri e",
        hostname: "55 Cancri A",
        discoverymethod: "Radial Velocity",
        pl_rade: 1.88,
        pl_masse: 8.63,
        pl_orbper: 0.74,
        pl_eqt: 2573,
        disc_year: 2004,
        sy_dist: 12.59,
        sys_name: "55 Cancri"
      },
      {
        pl_name: "WASP-121b",
        hostname: "WASP-121",
        discoverymethod: "Transit",
        pl_rade: 19.14,
        pl_masse: 376.0,
        pl_orbper: 1.27,
        pl_eqt: 2358,
        disc_year: 2015,
        sy_dist: 263.4,
        sys_name: "WASP-121"
      },
      {
        pl_name: "Gliese 667C c",
        hostname: "Gliese 667C",
        discoverymethod: "Radial Velocity",
        pl_rade: 1.54,
        pl_masse: 3.86,
        pl_orbper: 28.1,
        pl_eqt: 277,
        disc_year: 2011,
        sy_dist: 6.84,
        sys_name: "Gliese 667C"
      }
    ];
  }
}

// API Service Manager
class APIServiceManager {
  constructor(apiKey = API_CONFIG.DEFAULT_API_KEY) {
    this.apiKey = apiKey;
    this.apod = new APODService(apiKey);
    this.marsWeather = new MarsWeatherService(apiKey);
    this.asteroids = new AsteroidService(apiKey);
    this.spaceWeather = new SpaceWeatherService(apiKey);
    this.marsRovers = new MarsRoverService(apiKey);
    this.exoplanets = new ExoplanetService();
  }

  updateAPIKey(newApiKey) {
    this.apiKey = newApiKey;
    this.apod = new APODService(newApiKey);
    this.marsWeather = new MarsWeatherService(newApiKey);
    this.asteroids = new AsteroidService(newApiKey);
    this.spaceWeather = new SpaceWeatherService(newApiKey);
    this.marsRovers = new MarsRoverService(newApiKey);
    
    // Store API key in localStorage
    StorageUtils.set('nasa_api_key', newApiKey);
  }

  getRateLimitInfo() {
    return this.apod.getRateLimitInfo();
  }

  clearCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Initialize global API service manager
let APIManager;

// Initialize with stored API key if available
document.addEventListener('DOMContentLoaded', () => {
  const storedApiKey = StorageUtils.get('nasa_api_key', API_CONFIG.DEFAULT_API_KEY);
  APIManager = new APIServiceManager(storedApiKey);
});