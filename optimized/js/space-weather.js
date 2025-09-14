// Cosmos Connect - Space Weather Module

class SpaceWeatherApp {
  constructor() {
    this.weatherData = {
      solarFlares: [],
      geomagneticStorms: [],
      coronalMassEjections: [],
      notifications: []
    };
    this.currentFilters = {
      eventType: '',
      timePeriod: '30',
      severity: '',
      startDate: null,
      endDate: null
    };
    this.viewMode = 'timeline';
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.setupEventListeners();
      await this.loadSpaceWeatherData();
      this.initialized = true;
      
      // Hide loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        setTimeout(() => loadingScreen.classList.add('hidden'), 1000);
      }
      
    } catch (error) {
      console.error('Failed to initialize Space Weather app:', error);
      this.showError('Failed to initialize Space Weather monitor. Please refresh the page.');
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

    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    // Time period filter change
    const timePeriodFilter = document.getElementById('time-period-filter');
    if (timePeriodFilter) {
      timePeriodFilter.addEventListener('change', () => this.toggleCustomDateRange());
    }

    // View mode toggles
    const viewButtons = document.querySelectorAll('[data-view]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.setViewMode(e.target.closest('button').dataset.view));
    });

    // Subscribe to alerts button
    const subscribeBtn = document.getElementById('subscribe-alerts-btn');
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => this.subscribeToAlerts());
    }
  }

  toggleCustomDateRange() {
    const timePeriodFilter = document.getElementById('time-period-filter');
    const customDateRange = document.getElementById('custom-date-range');
    
    if (timePeriodFilter.value === 'custom') {
      customDateRange.style.display = 'block';
      
      // Set default values
      const endDate = DateUtils.getTodayString();
      const startDate = DateUtils.getDateDaysAgo(30);
      
      document.getElementById('custom-start-date').value = startDate;
      document.getElementById('custom-end-date').value = endDate;
    } else {
      customDateRange.style.display = 'none';
    }
  }

  async loadSpaceWeatherData() {
    const contentContainer = document.getElementById('space-weather-content');
    const statusContainer = document.getElementById('current-status');
    
    try {
      LoadingUtils.showLoading(contentContainer, 'Scanning solar activity...');
      LoadingUtils.showLoading(statusContainer, 'Checking current status...');
      
      // Calculate date range based on current filters
      const dateRange = this.getDateRange();
      
      // Load all space weather data
      const data = await APIManager.spaceWeather.getAllSpaceWeatherEvents(
        dateRange.startDate,
        dateRange.endDate
      );
      
      this.weatherData = data;
      this.renderCurrentStatus(statusContainer, data);
      this.renderSpaceWeatherEvents(contentContainer, data);
      
    } catch (error) {
      console.error('Failed to load space weather data:', error);
      const errorMessage = ErrorUtils.handleAPIError(error, 'space weather data');
      LoadingUtils.showError(contentContainer, errorMessage);
      LoadingUtils.showError(statusContainer, errorMessage);
    }
  }

  getDateRange() {
    const timePeriod = this.currentFilters.timePeriod;
    
    if (timePeriod === 'custom') {
      return {
        startDate: this.currentFilters.startDate || DateUtils.getDateDaysAgo(30),
        endDate: this.currentFilters.endDate || DateUtils.getTodayString()
      };
    }
    
    const days = parseInt(timePeriod);
    return {
      startDate: DateUtils.getDateDaysAgo(days),
      endDate: DateUtils.getTodayString()
    };
  }

  applyFilters() {
    // Get filter values
    const eventType = document.getElementById('event-type-filter').value;
    const timePeriod = document.getElementById('time-period-filter').value;
    const severity = document.getElementById('severity-filter').value;
    
    let startDate = null;
    let endDate = null;
    
    if (timePeriod === 'custom') {
      startDate = document.getElementById('custom-start-date').value;
      endDate = document.getElementById('custom-end-date').value;
      
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        this.showToast('Start date must be before end date', 'warning');
        return;
      }
    }

    // Update filters
    this.currentFilters = {
      eventType,
      timePeriod,
      severity,
      startDate,
      endDate
    };

    // Reload data
    this.loadSpaceWeatherData();
  }

  resetFilters() {
    // Reset form inputs
    document.getElementById('event-type-filter').value = '';
    document.getElementById('time-period-filter').value = '30';
    document.getElementById('severity-filter').value = '';
    
    // Hide custom date range
    document.getElementById('custom-date-range').style.display = 'none';

    // Reset filters
    this.currentFilters = {
      eventType: '',
      timePeriod: '30',
      severity: '',
      startDate: null,
      endDate: null
    };

    // Reload data
    this.loadSpaceWeatherData();
  }

  async refreshData() {
    // Clear relevant caches
    const dateRange = this.getDateRange();
    const cacheKeys = [
      `cme_${dateRange.startDate}_${dateRange.endDate}`,
      `gst_${dateRange.startDate}_${dateRange.endDate}`,
      `flr_${dateRange.startDate}_${dateRange.endDate}`,
      `notifications_${dateRange.startDate}_${dateRange.endDate}`
    ];
    
    cacheKeys.forEach(key => StorageUtils.remove(`cache_${key}`));
    
    await this.loadSpaceWeatherData();
    this.showToast('Space weather data refreshed', 'success');
  }

  renderCurrentStatus(container, data) {
    const recentEvents = this.getRecentEvents(data);
    const currentActivity = this.assessCurrentActivity(recentEvents);
    
    container.innerHTML = `
      <div class="current-status-grid">
        <div class="row g-4">
          <div class="col-lg-3 col-md-6">
            <div class="status-card glass-card p-4 text-center">
              <div class="status-icon mb-3">
                <i class="fas fa-solar-panel fa-2x ${this.getActivityColor(currentActivity.solar)}"></i>
              </div>
              <h5>Solar Activity</h5>
              <div class="status-level ${this.getActivityColor(currentActivity.solar)}">${currentActivity.solar}</div>
              <small class="text-muted">${recentEvents.solarFlares.length} recent flares</small>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6">
            <div class="status-card glass-card p-4 text-center">
              <div class="status-icon mb-3">
                <i class="fas fa-globe fa-2x ${this.getActivityColor(currentActivity.geomagnetic)}"></i>
              </div>
              <h5>Geomagnetic Field</h5>
              <div class="status-level ${this.getActivityColor(currentActivity.geomagnetic)}">${currentActivity.geomagnetic}</div>
              <small class="text-muted">${recentEvents.geomagneticStorms.length} recent storms</small>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6">
            <div class="status-card glass-card p-4 text-center">
              <div class="status-icon mb-3">
                <i class="fas fa-wind fa-2x ${this.getActivityColor(currentActivity.cme)}"></i>
              </div>
              <h5>Solar Wind</h5>
              <div class="status-level ${this.getActivityColor(currentActivity.cme)}">${currentActivity.cme}</div>
              <small class="text-muted">${recentEvents.coronalMassEjections.length} recent CMEs</small>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6">
            <div class="status-card glass-card p-4 text-center">
              <div class="status-icon mb-3">
                <i class="fas fa-exclamation-triangle fa-2x ${this.getActivityColor(currentActivity.overall)}"></i>
              </div>
              <h5>Overall Alert Level</h5>
              <div class="status-level ${this.getActivityColor(currentActivity.overall)}">${currentActivity.overall}</div>
              <small class="text-muted">${recentEvents.notifications.length} active alerts</small>
            </div>
          </div>
        </div>
        
        <div class="row mt-4">
          <div class="col-12">
            <div class="status-summary glass-card p-4">
              <h5 class="mb-3">Current Space Weather Summary</h5>
              <p class="mb-3">
                ${this.generateStatusSummary(currentActivity, recentEvents)}
              </p>
              <div class="status-actions">
                <button class="btn btn-outline-light btn-sm me-2" onclick="spaceWeatherApp.showLatestEvents()">
                  <i class="fas fa-list me-1"></i>View Latest Events
                </button>
                <button class="btn btn-outline-light btn-sm" onclick="spaceWeatherApp.subscribeToAlerts()">
                  <i class="fas fa-bell me-1"></i>Get Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getRecentEvents(data) {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    return {
      solarFlares: data.solarFlares.filter(event => 
        new Date(event.beginTime) > threeDaysAgo
      ),
      geomagneticStorms: data.geomagneticStorms.filter(event => 
        new Date(event.startTime) > threeDaysAgo
      ),
      coronalMassEjections: data.coronalMassEjections.filter(event => 
        new Date(event.startTime) > threeDaysAgo
      ),
      notifications: data.notifications.filter(event => 
        new Date(event.messageIssueTime) > threeDaysAgo
      )
    };
  }

  assessCurrentActivity(recentEvents) {
    // Simple activity assessment based on recent events
    const solarActivity = recentEvents.solarFlares.length > 5 ? 'High' : 
                         recentEvents.solarFlares.length > 2 ? 'Moderate' : 'Low';
    
    const geomagneticActivity = recentEvents.geomagneticStorms.length > 2 ? 'High' : 
                               recentEvents.geomagneticStorms.length > 0 ? 'Moderate' : 'Low';
    
    const cmeActivity = recentEvents.coronalMassEjections.length > 3 ? 'High' : 
                       recentEvents.coronalMassEjections.length > 1 ? 'Moderate' : 'Low';
    
    const overallActivity = [solarActivity, geomagneticActivity, cmeActivity].includes('High') ? 'High' :
                           [solarActivity, geomagneticActivity, cmeActivity].includes('Moderate') ? 'Moderate' : 'Low';
    
    return {
      solar: solarActivity,
      geomagnetic: geomagneticActivity,
      cme: cmeActivity,
      overall: overallActivity
    };
  }

  getActivityColor(level) {
    switch (level) {
      case 'High': return 'text-danger';
      case 'Moderate': return 'text-warning';
      case 'Low': return 'text-success';
      default: return 'text-muted';
    }
  }

  generateStatusSummary(activity, events) {
    const totalEvents = Object.values(events).reduce((sum, arr) => sum + arr.length, 0);
    
    if (activity.overall === 'High') {
      return `Current space weather conditions show elevated activity with ${totalEvents} recent events. Enhanced monitoring is recommended for satellite operations and power grid systems.`;
    } else if (activity.overall === 'Moderate') {
      return `Space weather conditions are moderately active with ${totalEvents} recent events. Normal precautions should be observed for sensitive operations.`;
    } else {
      return `Space weather conditions are currently quiet with minimal activity. Normal operations can proceed without special precautions.`;
    }
  }

  renderSpaceWeatherEvents(container, data) {
    const filteredEvents = this.filterEvents(this.combineAndSortEvents(data));
    
    if (filteredEvents.length === 0) {
      LoadingUtils.showEmpty(container, 'No space weather events found for the selected criteria.');
      return;
    }

    if (this.viewMode === 'timeline') {
      this.renderEventsTimeline(container, filteredEvents);
    } else if (this.viewMode === 'cards') {
      this.renderEventsCards(container, filteredEvents);
    } else if (this.viewMode === 'table') {
      this.renderEventsTable(container, filteredEvents);
    }
  }

  combineAndSortEvents(data) {
    const allEvents = [];
    
    // Add solar flares
    data.solarFlares.forEach(event => {
      allEvents.push({
        ...event,
        type: 'Solar Flare',
        typeClass: 'solar-flare',
        icon: 'fa-solar-panel',
        color: 'text-solar-orange',
        date: event.beginTime,
        severity: this.getSolarFlareSeverity(event.classType)
      });
    });
    
    // Add geomagnetic storms
    data.geomagneticStorms.forEach(event => {
      allEvents.push({
        ...event,
        type: 'Geomagnetic Storm',
        typeClass: 'geomagnetic-storm',
        icon: 'fa-globe',
        color: 'text-earth-blue',
        date: event.startTime,
        severity: this.getGeomagneticSeverity(event.kpIndex)
      });
    });
    
    // Add coronal mass ejections
    data.coronalMassEjections.forEach(event => {
      allEvents.push({
        ...event,
        type: 'Coronal Mass Ejection',
        typeClass: 'coronal-mass-ejection',
        icon: 'fa-wind',
        color: 'text-cosmic-purple',
        date: event.startTime,
        severity: this.getCMESeverity(event.speed)
      });
    });
    
    // Add notifications
    data.notifications.forEach(event => {
      allEvents.push({
        ...event,
        type: 'Space Weather Alert',
        typeClass: 'notification',
        icon: 'fa-exclamation-triangle',
        color: 'text-saturn-gold',
        date: event.messageIssueTime,
        severity: 'Moderate'
      });
    });
    
    // Sort by date (newest first)
    return allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  filterEvents(events) {
    return events.filter(event => {
      // Event type filter
      if (this.currentFilters.eventType) {
        const typeMap = {
          'solar-flares': 'Solar Flare',
          'geomagnetic-storms': 'Geomagnetic Storm',
          'coronal-mass-ejections': 'Coronal Mass Ejection',
          'notifications': 'Space Weather Alert'
        };
        
        if (event.type !== typeMap[this.currentFilters.eventType]) {
          return false;
        }
      }
      
      // Severity filter
      if (this.currentFilters.severity) {
        const severityMap = {
          'minor': ['Low', 'Minor'],
          'moderate': ['Moderate'],
          'strong': ['Strong', 'High'],
          'severe': ['Severe', 'Extreme']
        };
        
        const allowedSeverities = severityMap[this.currentFilters.severity] || [];
        if (!allowedSeverities.includes(event.severity)) {
          return false;
        }
      }
      
      return true;
    });
  }

  renderEventsTimeline(container, events) {
    container.innerHTML = `
      <div class="space-weather-timeline">
        ${events.slice(0, 20).map((event, index) => `
          <div class="timeline-event ${index % 2 === 0 ? 'timeline-left' : 'timeline-right'}">
            <div class="timeline-content glass-card p-3" onclick="spaceWeatherApp.showEventDetails('${event.type}', ${index})">
              <div class="event-header">
                <div class="event-type">
                  <i class="fas ${event.icon} me-2 ${event.color}"></i>
                  ${event.type}
                </div>
                <div class="event-date">${DateUtils.formatDateTime(event.date)}</div>
              </div>
              
              <div class="event-content mt-2">
                <div class="event-severity">
                  <span class="badge badge-${this.getSeverityBadgeClass(event.severity)}">${event.severity}</span>
                </div>
                <div class="event-description mt-2">
                  ${this.getEventDescription(event)}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderEventsCards(container, events) {
    container.innerHTML = `
      <div class="space-weather-cards">
        <div class="row g-4">
          ${events.slice(0, 12).map((event, index) => `
            <div class="col-lg-4 col-md-6">
              <div class="weather-event-card data-card glass-card p-4" onclick="spaceWeatherApp.showEventDetails('${event.type}', ${index})">
                <div class="card-header mb-3">
                  <div class="event-type-header">
                    <i class="fas ${event.icon} fa-2x ${event.color} mb-2"></i>
                    <h5>${event.type}</h5>
                  </div>
                  <span class="badge badge-${this.getSeverityBadgeClass(event.severity)}">${event.severity}</span>
                </div>
                
                <div class="event-details">
                  <div class="detail-row">
                    <span class="detail-label">
                      <i class="fas fa-calendar me-1"></i>Date:
                    </span>
                    <span class="detail-value">${DateUtils.formatDateTime(event.date)}</span>
                  </div>
                  
                  <div class="event-summary mt-3">
                    ${this.getEventDescription(event)}
                  </div>
                </div>
                
                <div class="card-actions mt-3">
                  <button class="btn btn-sm btn-primary w-100" onclick="event.stopPropagation(); spaceWeatherApp.showEventDetails('${event.type}', ${index})">
                    <i class="fas fa-info-circle me-1"></i>View Details
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderEventsTable(container, events) {
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-glass">
          <thead>
            <tr>
              <th>Type</th>
              <th>Date/Time</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${events.slice(0, 20).map((event, index) => `
              <tr>
                <td>
                  <i class="fas ${event.icon} me-2 ${event.color}"></i>
                  ${event.type}
                </td>
                <td>${DateUtils.formatDateTime(event.date)}</td>
                <td>
                  <span class="badge badge-${this.getSeverityBadgeClass(event.severity)}">${event.severity}</span>
                </td>
                <td>${this.getEventDescription(event)}</td>
                <td>
                  <button class="btn btn-sm btn-outline-light" onclick="spaceWeatherApp.showEventDetails('${event.type}', ${index})">
                    <i class="fas fa-info-circle"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  getEventDescription(event) {
    switch (event.type) {
      case 'Solar Flare':
        return `Class ${event.classType} solar flare detected from active region ${event.activeRegionNum || 'Unknown'}`;
      case 'Geomagnetic Storm':
        return `Geomagnetic storm with Kp index of ${event.kpIndex || 'Unknown'}`;
      case 'Coronal Mass Ejection':
        return `CME with speed of ${event.speed ? NumberUtils.formatLargeNumber(event.speed) + ' km/s' : 'Unknown speed'}`;
      case 'Space Weather Alert':
        return event.messageType || 'Space weather notification issued';
      default:
        return 'Space weather event detected';
    }
  }

  getSolarFlareSeverity(classType) {
    if (!classType) return 'Unknown';
    const firstChar = classType.charAt(0).toUpperCase();
    
    switch (firstChar) {
      case 'A':
      case 'B': return 'Low';
      case 'C': return 'Moderate';
      case 'M': return 'Strong';
      case 'X': return 'Severe';
      default: return 'Unknown';
    }
  }

  getGeomagneticSeverity(kpIndex) {
    if (!kpIndex) return 'Unknown';
    const kp = parseFloat(kpIndex);
    
    if (kp < 4) return 'Low';
    if (kp < 5) return 'Moderate';
    if (kp < 6) return 'Strong';
    return 'Severe';
  }

  getCMESeverity(speed) {
    if (!speed) return 'Unknown';
    const speedNum = parseFloat(speed);
    
    if (speedNum < 500) return 'Low';
    if (speedNum < 1000) return 'Moderate';
    if (speedNum < 1500) return 'Strong';
    return 'Severe';
  }

  getSeverityBadgeClass(severity) {
    switch (severity) {
      case 'Low': return 'success';
      case 'Moderate': return 'warning';
      case 'Strong': return 'danger';
      case 'Severe': return 'danger';
      default: return 'info';
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    
    // Update button states
    const buttons = document.querySelectorAll('[data-view]');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === mode);
    });
    
    // Re-render events
    if (this.weatherData) {
      const contentContainer = document.getElementById('space-weather-content');
      this.renderSpaceWeatherEvents(contentContainer, this.weatherData);
    }
  }

  showEventDetails(eventType, index) {
    // This would show detailed information about the specific event
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    const contentContainer = document.getElementById('event-details-content');
    
    contentContainer.innerHTML = `
      <div class="event-details">
        <h5>${eventType} Details</h5>
        <p>Detailed information about this space weather event would be displayed here.</p>
        <div class="alert alert-info alert-glass">
          <i class="fas fa-info-circle me-2"></i>
          For the most current and detailed space weather information, visit the 
          <a href="https://www.swpc.noaa.gov/" target="_blank" class="alert-link">NOAA Space Weather Prediction Center</a>.
        </div>
      </div>
    `;
    
    modal.show();
  }

  showLatestEvents() {
    // Scroll to events section or highlight recent events
    const eventsSection = document.getElementById('space-weather-content');
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  subscribeToAlerts() {
    // This would implement notification subscription
    this.showToast('Alert subscription feature coming soon!', 'info');
  }

  showToast(message, type = 'info') {
    if (window.CosmosConnect && window.CosmosConnect.app) {
      window.CosmosConnect.app.showToast(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  showError(message) {
    const contentContainer = document.getElementById('space-weather-content');
    if (contentContainer) {
      LoadingUtils.showError(contentContainer, message);
    }
  }
}

// Initialize Space Weather app
const spaceWeatherApp = new SpaceWeatherApp();

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => spaceWeatherApp.init(), 500);
  });
} else {
  setTimeout(() => spaceWeatherApp.init(), 500);
}