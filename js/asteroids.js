// Cosmos Connect - Asteroids (Near Earth Objects) Module

class AsteroidsApp {
  constructor() {
    this.asteroidData = null;
    this.currentFilters = {
      startDate: null,
      endDate: null,
      size: '',
      hazard: ''
    };
    this.viewMode = 'cards';
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.trackedObjects = StorageUtils.get('tracked_asteroids', []);
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.setupDateInputs();
      this.setupEventListeners();
      await this.loadAsteroidData();
      this.initialized = true;
      
      // Hide loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        setTimeout(() => loadingScreen.classList.add('hidden'), 1000);
      }
      
    } catch (error) {
      console.error('Failed to initialize Asteroids app:', error);
      this.showError('Failed to initialize Asteroid tracker. Please refresh the page.');
    }
  }

  setupDateInputs() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
      // Set default date range (7 days), but cap at a safe maximum date
      const today = DateUtils.getTodayString();
      const maxDate = '2024-09-13'; // Cap at known working date
      
      // Calculate end date (7 days from start, but not exceeding max date)
      const startDate = new Date(today);
      const calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + 7);
      
      const endDate = calculatedEndDate > new Date(maxDate) 
        ? maxDate 
        : calculatedEndDate.toISOString().split('T')[0];
      
      startDateInput.value = today;
      endDateInput.value = endDate;
      startDateInput.max = maxDate;
      endDateInput.max = maxDate;
      endDateInput.min = today;
      
      this.currentFilters.startDate = today;
      this.currentFilters.endDate = endDate;
    }
  }

  setupEventListeners() {
    // Filter controls
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => this.applyFilters());
    }

    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => this.resetFilters());
    }

    const thisWeekBtn = document.getElementById('this-week-btn');
    if (thisWeekBtn) {
      thisWeekBtn.addEventListener('click', () => this.loadThisWeek());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    // View mode toggles
    const viewButtons = document.querySelectorAll('[data-view]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.setViewMode(e.target.closest('button').dataset.view));
    });

    // Track asteroid button in modal
    const trackBtn = document.getElementById('track-asteroid-btn');
    if (trackBtn) {
      trackBtn.addEventListener('click', () => this.toggleTrackAsteroid());
    }

    // Date input validation
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) {
      startDateInput.addEventListener('change', () => {
        if (endDateInput) {
          endDateInput.min = startDateInput.value;
        }
      });
    }

    if (endDateInput) {
      endDateInput.addEventListener('change', () => {
        if (startDateInput) {
          startDateInput.max = endDateInput.value;
        }
      });
    }
  }

  async loadAsteroidData() {
    const contentContainer = document.getElementById('asteroid-content');
    const statsContainer = document.getElementById('asteroid-stats');
    
    try {
      LoadingUtils.showLoading(contentContainer, 'Scanning for space rocks...');
      LoadingUtils.showLoading(statsContainer, 'Loading statistics...');
      
      const data = await APIManager.asteroids.getNearEarthObjects(
        this.currentFilters.startDate,
        this.currentFilters.endDate
      );
      
      this.asteroidData = data;
      this.renderStatistics(statsContainer, data);
      this.renderAsteroids(contentContainer, data);
      this.updateDataCount(data);
      
    } catch (error) {
      console.error('Failed to load asteroid data:', error);
      
      // If date range is invalid (400 error), try a safe fallback range
      if (error.status === 400 && 
          (this.currentFilters.startDate !== '2024-09-06' || this.currentFilters.endDate !== '2024-09-13')) {
        console.log('Date range invalid, falling back to safe date range');
        LoadingUtils.showLoading(contentContainer, 'Adjusting date range...');
        LoadingUtils.showLoading(statsContainer, 'Loading fallback data...');
        
        try {
          // Use a known working week range
          const fallbackData = await APIManager.asteroids.getNearEarthObjects('2024-09-06', '2024-09-13');
          this.asteroidData = fallbackData;
          this.renderStatistics(statsContainer, fallbackData);
          this.renderAsteroids(contentContainer, fallbackData);
          this.updateDataCount(fallbackData);
          
          // Update date inputs to show the fallback range
          const startDateInput = document.getElementById('start-date');
          const endDateInput = document.getElementById('end-date');
          if (startDateInput && endDateInput) {
            startDateInput.value = '2024-09-06';
            endDateInput.value = '2024-09-13';
          }
          
          // Update current filters
          this.currentFilters.startDate = '2024-09-06';
          this.currentFilters.endDate = '2024-09-13';
          
          // Show notification about fallback
          if (window.showNotification) {
            window.showNotification('Date range adjusted to show available asteroid data (Sep 6-13, 2024).', 'warning');
          }
          return;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      
      const errorMessage = ErrorUtils.handleAPIError(error, 'asteroid data');
      LoadingUtils.showError(contentContainer, errorMessage);
      LoadingUtils.showError(statsContainer, errorMessage);
    }
  }

  applyFilters() {
    // Get filter values
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const sizeFilter = document.getElementById('size-filter').value;
    const hazardFilter = document.getElementById('hazard-filter').value;

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      this.showToast('Start date must be before end date', 'warning');
      return;
    }

    // Update filters
    this.currentFilters = {
      startDate: startDate || this.currentFilters.startDate,
      endDate: endDate || this.currentFilters.endDate,
      size: sizeFilter,
      hazard: hazardFilter
    };

    // Reset pagination
    this.currentPage = 1;

    // Reload data
    this.loadAsteroidData();
  }

  resetFilters() {
    // Reset form inputs
    this.setupDateInputs();
    document.getElementById('size-filter').value = '';
    document.getElementById('hazard-filter').value = '';

    // Reset filters
    this.currentFilters.size = '';
    this.currentFilters.hazard = '';
    this.currentPage = 1;

    // Reload data
    this.loadAsteroidData();
  }

  async loadThisWeek() {
    const data = await APIManager.asteroids.getAsteroidsForWeek();
    this.asteroidData = data;
    
    const contentContainer = document.getElementById('asteroid-content');
    const statsContainer = document.getElementById('asteroid-stats');
    
    this.renderStatistics(statsContainer, data);
    this.renderAsteroids(contentContainer, data);
    this.updateDataCount(data);
  }

  async refreshData() {
    // Clear cache for current date range
    const cacheKey = `asteroids_${this.currentFilters.startDate}_${this.currentFilters.endDate}`;
    StorageUtils.remove(`cache_${cacheKey}`);
    
    await this.loadAsteroidData();
    this.showToast('Asteroid data refreshed', 'success');
  }

  renderStatistics(container, data) {
    if (!data || !data.near_earth_objects) {
      container.innerHTML = '';
      return;
    }

    const allAsteroids = Object.values(data.near_earth_objects).flat();
    const totalCount = allAsteroids.length;
    const hazardousCount = allAsteroids.filter(ast => ast.is_potentially_hazardous_asteroid).length;
    const largeCount = allAsteroids.filter(ast => this.getAsteroidSize(ast) === 'Large').length;

    // Calculate closest approach
    let closestDistance = Infinity;
    let closestAsteroid = null;
    allAsteroids.forEach(asteroid => {
      asteroid.close_approach_data.forEach(approach => {
        const distance = parseFloat(approach.miss_distance.kilometers);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestAsteroid = asteroid;
        }
      });
    });

    container.innerHTML = `
      <div class="stats-grid">
        <div class="row g-4">
          <div class="col-lg-3 col-md-6">
            <div class="stat-card glass-card p-4 text-center">
              <div class="stat-icon mb-3">
                <i class="fas fa-meteor fa-2x text-saturn-gold"></i>
              </div>
              <div class="stat-number">${totalCount}</div>
              <div class="stat-label">Total Objects</div>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6">
            <div class="stat-card glass-card p-4 text-center">
              <div class="stat-icon mb-3">
                <i class="fas fa-exclamation-triangle fa-2x text-mars-red"></i>
              </div>
              <div class="stat-number">${hazardousCount}</div>
              <div class="stat-label">Potentially Hazardous</div>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6">
            <div class="stat-card glass-card p-4 text-center">
              <div class="stat-icon mb-3">
                <i class="fas fa-circle fa-2x text-earth-blue"></i>
              </div>
              <div class="stat-number">${largeCount}</div>
              <div class="stat-label">Large Objects (>1km)</div>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6">
            <div class="stat-card glass-card p-4 text-center">
              <div class="stat-icon mb-3">
                <i class="fas fa-crosshairs fa-2x text-cosmic-purple"></i>
              </div>
              <div class="stat-number">${closestDistance === Infinity ? 'N/A' : NumberUtils.formatLargeNumber(Math.round(closestDistance))}</div>
              <div class="stat-label">Closest Approach (km)</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderAsteroids(container, data) {
    if (!data || !data.near_earth_objects) {
      LoadingUtils.showEmpty(container, 'No asteroids found for the selected date range.');
      return;
    }

    const allAsteroids = this.filterAsteroids(Object.values(data.near_earth_objects).flat());

    if (allAsteroids.length === 0) {
      LoadingUtils.showEmpty(container, 'No asteroids match your current filters.');
      return;
    }

    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedAsteroids = allAsteroids.slice(startIndex, endIndex);

    if (this.viewMode === 'cards') {
      this.renderAsteroidCards(container, paginatedAsteroids);
    } else if (this.viewMode === 'table') {
      this.renderAsteroidTable(container, paginatedAsteroids);
    } else if (this.viewMode === 'timeline') {
      this.renderAsteroidTimeline(container, allAsteroids.slice(0, 20)); // Show more for timeline
    }

    this.renderPagination(allAsteroids.length);
  }

  filterAsteroids(asteroids) {
    return asteroids.filter(asteroid => {
      // Size filter
      if (this.currentFilters.size) {
        const size = this.getAsteroidSize(asteroid);
        const sizeFilter = this.currentFilters.size;
        
        if (sizeFilter === 'small' && size !== 'Small') return false;
        if (sizeFilter === 'medium' && size !== 'Medium') return false;
        if (sizeFilter === 'large' && size !== 'Large') return false;
      }

      // Hazard filter
      if (this.currentFilters.hazard) {
        const isHazardous = asteroid.is_potentially_hazardous_asteroid;
        
        if (this.currentFilters.hazard === 'hazardous' && !isHazardous) return false;
        if (this.currentFilters.hazard === 'safe' && isHazardous) return false;
      }

      return true;
    });
  }

  renderAsteroidCards(container, asteroids) {
    container.innerHTML = `
      <div class="asteroid-cards">
        <div class="row g-4">
          ${asteroids.map(asteroid => {
            const approach = asteroid.close_approach_data[0]; // Get first approach
            const size = this.getAsteroidSize(asteroid);
            const isTracked = this.isTrackedAsteroid(asteroid.id);
            
            return `
              <div class="col-lg-4 col-md-6">
                <div class="asteroid-card data-card glass-card p-4" onclick="asteroidsApp.showAsteroidDetails('${asteroid.id}')">
                  <div class="card-header d-flex justify-content-between align-items-start mb-3">
                    <div class="asteroid-name">
                      <h5 class="mb-1">${asteroid.name}</h5>
                      <small class="text-muted">ID: ${asteroid.id}</small>
                    </div>
                    <div class="asteroid-badges">
                      ${asteroid.is_potentially_hazardous_asteroid ? 
                        '<span class="badge badge-danger">Hazardous</span>' : 
                        '<span class="badge badge-success">Safe</span>'
                      }
                      ${isTracked ? '<span class="badge badge-info ms-1">Tracked</span>' : ''}
                    </div>
                  </div>
                  
                  <div class="asteroid-info">
                    <div class="info-row">
                      <span class="info-label">
                        <i class="fas fa-ruler me-1"></i>Size:
                      </span>
                      <span class="info-value">${size}</span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-label">
                        <i class="fas fa-calendar me-1"></i>Close Approach:
                      </span>
                      <span class="info-value">${DateUtils.formatDate(approach.close_approach_date)}</span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-label">
                        <i class="fas fa-crosshairs me-1"></i>Miss Distance:
                      </span>
                      <span class="info-value">${NumberUtils.formatLargeNumber(Math.round(parseFloat(approach.miss_distance.kilometers)))} km</span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-label">
                        <i class="fas fa-tachometer-alt me-1"></i>Velocity:
                      </span>
                      <span class="info-value">${NumberUtils.formatLargeNumber(Math.round(parseFloat(approach.relative_velocity.kilometers_per_hour)))} km/h</span>
                    </div>
                  </div>
                  
                  <div class="card-actions mt-3">
                    <button class="btn btn-sm btn-primary w-100" onclick="event.stopPropagation(); asteroidsApp.showAsteroidDetails('${asteroid.id}')">
                      <i class="fas fa-info-circle me-1"></i>View Details
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderAsteroidTable(container, asteroids) {
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-glass">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Close Approach</th>
              <th>Miss Distance</th>
              <th>Velocity</th>
              <th>Hazardous</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${asteroids.map(asteroid => {
              const approach = asteroid.close_approach_data[0];
              const size = this.getAsteroidSize(asteroid);
              
              return `
                <tr>
                  <td>
                    <strong>${asteroid.name}</strong><br>
                    <small class="text-muted">ID: ${asteroid.id}</small>
                  </td>
                  <td>${size}</td>
                  <td>${DateUtils.formatDate(approach.close_approach_date)}</td>
                  <td>${NumberUtils.formatLargeNumber(Math.round(parseFloat(approach.miss_distance.kilometers)))} km</td>
                  <td>${NumberUtils.formatLargeNumber(Math.round(parseFloat(approach.relative_velocity.kilometers_per_hour)))} km/h</td>
                  <td>
                    ${asteroid.is_potentially_hazardous_asteroid ? 
                      '<span class="badge badge-danger">Yes</span>' : 
                      '<span class="badge badge-success">No</span>'
                    }
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-light" onclick="asteroidsApp.showAsteroidDetails('${asteroid.id}')">
                      <i class="fas fa-info-circle"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderAsteroidTimeline(container, asteroids) {
    // Sort by approach date
    const sortedAsteroids = asteroids.sort((a, b) => {
      const dateA = new Date(a.close_approach_data[0].close_approach_date);
      const dateB = new Date(b.close_approach_data[0].close_approach_date);
      return dateA - dateB;
    });

    container.innerHTML = `
      <div class="asteroid-timeline">
        ${sortedAsteroids.map((asteroid, index) => {
          const approach = asteroid.close_approach_data[0];
          const size = this.getAsteroidSize(asteroid);
          
          return `
            <div class="timeline-item ${index % 2 === 0 ? 'timeline-left' : 'timeline-right'}">
              <div class="timeline-content glass-card p-3">
                <div class="timeline-date">${DateUtils.formatDate(approach.close_approach_date)}</div>
                <h6 class="timeline-title">${asteroid.name}</h6>
                <div class="timeline-details">
                  <div class="detail-item">
                    <span class="detail-label">Size:</span>
                    <span class="detail-value">${size}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Distance:</span>
                    <span class="detail-value">${NumberUtils.formatLargeNumber(Math.round(parseFloat(approach.miss_distance.kilometers)))} km</span>
                  </div>
                  ${asteroid.is_potentially_hazardous_asteroid ? 
                    '<div class="hazard-warning"><i class="fas fa-exclamation-triangle text-warning me-1"></i>Potentially Hazardous</div>' : 
                    ''
                  }
                </div>
                <button class="btn btn-sm btn-outline-light mt-2" onclick="asteroidsApp.showAsteroidDetails('${asteroid.id}')">
                  View Details
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    const paginationContainer = document.getElementById('asteroid-pagination');
    
    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }

    paginationContainer.style.display = 'flex';
    paginationContainer.innerHTML = `
      <div class="pagination-info">
        Showing ${((this.currentPage - 1) * this.itemsPerPage) + 1}-${Math.min(this.currentPage * this.itemsPerPage, totalItems)} of ${totalItems} objects
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn" onclick="asteroidsApp.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
          <i class="fas fa-chevron-left"></i>
        </button>
        ${this.generatePageNumbers(totalPages)}
        <button class="pagination-btn" onclick="asteroidsApp.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
  }

  generatePageNumbers(totalPages) {
    let pages = '';
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages += `
        <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                onclick="asteroidsApp.goToPage(${i})">
          ${i}
        </button>
      `;
    }

    return pages;
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filterAsteroids(Object.values(this.asteroidData.near_earth_objects).flat()).length / this.itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    this.currentPage = page;
    const contentContainer = document.getElementById('asteroid-content');
    this.renderAsteroids(contentContainer, this.asteroidData);
  }

  async showAsteroidDetails(asteroidId) {
    const modal = new bootstrap.Modal(document.getElementById('asteroidModal'));
    const contentContainer = document.getElementById('asteroid-details-content');
    
    try {
      LoadingUtils.showLoading(contentContainer, 'Loading asteroid details...');
      modal.show();
      
      const asteroidDetails = await APIManager.asteroids.getAsteroidDetails(asteroidId);
      this.renderAsteroidDetails(contentContainer, asteroidDetails);
      
    } catch (error) {
      console.error('Failed to load asteroid details:', error);
      const errorMessage = ErrorUtils.handleAPIError(error, 'asteroid details');
      LoadingUtils.showError(contentContainer, errorMessage);
    }
  }

  renderAsteroidDetails(container, asteroid) {
    const approach = asteroid.close_approach_data[0];
    const size = this.getAsteroidSize(asteroid);
    const isTracked = this.isTrackedAsteroid(asteroid.id);
    
    // Update track button
    const trackBtn = document.getElementById('track-asteroid-btn');
    if (trackBtn) {
      trackBtn.innerHTML = `<i class="fas fa-${isTracked ? 'star' : 'star'} me-1"></i>${isTracked ? 'Untrack' : 'Track'} This Object`;
      trackBtn.dataset.asteroidId = asteroid.id;
    }

    container.innerHTML = `
      <div class="asteroid-details">
        <div class="row">
          <div class="col-md-6">
            <h5>Basic Information</h5>
            <table class="table table-glass">
              <tr><td><strong>Name:</strong></td><td>${asteroid.name}</td></tr>
              <tr><td><strong>NASA JPL ID:</strong></td><td>${asteroid.id}</td></tr>
              <tr><td><strong>Absolute Magnitude:</strong></td><td>${asteroid.absolute_magnitude_h}</td></tr>
              <tr><td><strong>Estimated Size:</strong></td><td>${size}</td></tr>
              <tr><td><strong>Potentially Hazardous:</strong></td><td>${asteroid.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</td></tr>
            </table>
          </div>
          
          <div class="col-md-6">
            <h5>Close Approach Data</h5>
            <table class="table table-glass">
              <tr><td><strong>Date:</strong></td><td>${DateUtils.formatDate(approach.close_approach_date)}</td></tr>
              <tr><td><strong>Time (UTC):</strong></td><td>${approach.close_approach_date_full}</td></tr>
              <tr><td><strong>Relative Velocity:</strong></td><td>${NumberUtils.formatLargeNumber(Math.round(parseFloat(approach.relative_velocity.kilometers_per_hour)))} km/h</td></tr>
              <tr><td><strong>Miss Distance:</strong></td><td>${NumberUtils.formatLargeNumber(Math.round(parseFloat(approach.miss_distance.kilometers)))} km</td></tr>
              <tr><td><strong>Orbiting Body:</strong></td><td>${approach.orbiting_body}</td></tr>
            </table>
          </div>
        </div>
        
        <div class="row mt-4">
          <div class="col-12">
            <h5>Size Estimates</h5>
            <div class="size-estimates">
              <div class="row">
                <div class="col-md-6">
                  <div class="size-metric">
                    <strong>Diameter Range:</strong><br>
                    ${asteroid.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3)} - 
                    ${asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3)} km
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="size-metric">
                    <strong>Diameter Range (meters):</strong><br>
                    ${Math.round(asteroid.estimated_diameter.meters.estimated_diameter_min)} - 
                    ${Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max)} m
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        ${asteroid.close_approach_data.length > 1 ? `
          <div class="row mt-4">
            <div class="col-12">
              <h5>Future Close Approaches</h5>
              <div class="approaches-list">
                ${asteroid.close_approach_data.slice(1, 6).map(app => `
                  <div class="approach-item">
                    <span class="approach-date">${DateUtils.formatDate(app.close_approach_date)}</span>
                    <span class="approach-distance">${NumberUtils.formatLargeNumber(Math.round(parseFloat(app.miss_distance.kilometers)))} km</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  setViewMode(mode) {
    this.viewMode = mode;
    
    // Update button states
    const buttons = document.querySelectorAll('[data-view]');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === mode);
    });
    
    // Re-render asteroids
    if (this.asteroidData) {
      const contentContainer = document.getElementById('asteroid-content');
      this.renderAsteroids(contentContainer, this.asteroidData);
    }
  }

  toggleTrackAsteroid() {
    const trackBtn = document.getElementById('track-asteroid-btn');
    const asteroidId = trackBtn.dataset.asteroidId;
    
    if (!asteroidId) return;

    const isCurrentlyTracked = this.isTrackedAsteroid(asteroidId);
    
    if (isCurrentlyTracked) {
      // Remove from tracked
      this.trackedObjects = this.trackedObjects.filter(id => id !== asteroidId);
      this.showToast('Asteroid removed from tracking', 'info');
    } else {
      // Add to tracked
      this.trackedObjects.push(asteroidId);
      this.showToast('Asteroid added to tracking', 'success');
    }
    
    // Save to storage
    StorageUtils.set('tracked_asteroids', this.trackedObjects);
    
    // Update button
    trackBtn.innerHTML = `<i class="fas fa-star me-1"></i>${isCurrentlyTracked ? 'Track' : 'Untrack'} This Object`;
    
    // Refresh current view
    if (this.asteroidData) {
      const contentContainer = document.getElementById('asteroid-content');
      this.renderAsteroids(contentContainer, this.asteroidData);
    }
  }

  isTrackedAsteroid(asteroidId) {
    return this.trackedObjects.includes(asteroidId);
  }

  getAsteroidSize(asteroid) {
    const maxDiameter = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
    
    if (maxDiameter < 0.1) return 'Small';
    if (maxDiameter < 1) return 'Medium';
    return 'Large';
  }

  updateDataCount(data) {
    const countElement = document.getElementById('data-count');
    if (countElement && data && data.near_earth_objects) {
      const total = Object.values(data.near_earth_objects).flat().length;
      const filtered = this.filterAsteroids(Object.values(data.near_earth_objects).flat()).length;
      countElement.textContent = filtered === total ? `${total} objects` : `${filtered} of ${total} objects`;
    }
  }

  showToast(message, type = 'info') {
    if (window.CosmosConnect && window.CosmosConnect.app) {
      window.CosmosConnect.app.showToast(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  showError(message) {
    const contentContainer = document.getElementById('asteroid-content');
    if (contentContainer) {
      LoadingUtils.showError(contentContainer, message);
    }
  }
}

// Initialize Asteroids app
const asteroidsApp = new AsteroidsApp();

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => asteroidsApp.init(), 500);
  });
} else {
  setTimeout(() => asteroidsApp.init(), 500);
}