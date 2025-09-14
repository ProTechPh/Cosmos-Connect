// Cosmos Connect - Mars Weather Module

class MarsWeatherApp {
  constructor() {
    this.weatherData = null;
    this.charts = {};
    this.viewMode = 'table';
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.setupEventListeners();
      await this.loadWeatherData();
      this.initialized = true;
      
      // Hide loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        setTimeout(() => loadingScreen.classList.add('hidden'), 1000);
      }
      
    } catch (error) {
      console.error('Failed to initialize Mars Weather app:', error);
      this.showError('Failed to initialize Mars Weather viewer. Please refresh the page.');
    }
  }

  setupEventListeners() {
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshWeatherData());
    }

    // View mode toggles
    const viewButtons = document.querySelectorAll('[data-view]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.setViewMode(e.target.dataset.view));
    });

    // Units change listener
    document.addEventListener('unitsChanged', (e) => {
      this.updateDisplayUnits(e.detail.units);
    });
  }

  async loadWeatherData() {
    const currentWeatherContainer = document.getElementById('current-weather');
    const historyContainer = document.getElementById('weather-history-content');
    
    try {
      LoadingUtils.showLoading(currentWeatherContainer, 'Connecting to Mars weather station...');
      LoadingUtils.showLoading(historyContainer, 'Loading historical data...');
      
      // Load current weather data
      const weatherData = await APIManager.marsWeather.getCurrentWeather();
      this.weatherData = weatherData;
      
      if (weatherData && weatherData.sol_keys && weatherData.sol_keys.length > 0) {
        this.renderCurrentWeather(currentWeatherContainer, weatherData);
        this.renderHistoricalData(historyContainer, weatherData);
        this.createCharts(weatherData);
      } else {
        this.showNoDataMessage(currentWeatherContainer);
        this.showNoDataMessage(historyContainer);
      }
      
    } catch (error) {
      console.error('Failed to load Mars weather data:', error);
      const errorMessage = ErrorUtils.handleAPIError(error, 'Mars weather data');
      LoadingUtils.showError(currentWeatherContainer, errorMessage);
      LoadingUtils.showError(historyContainer, errorMessage);
    }
  }

  async refreshWeatherData() {
    // Clear cache and reload
    const cacheKeys = Object.keys(localStorage).filter(key => key.includes('mars_weather'));
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    await this.loadWeatherData();
    this.showToast('Weather data refreshed', 'success');
  }

  renderCurrentWeather(container, data) {
    const latestSol = data.sol_keys[data.sol_keys.length - 1];
    const solData = data[latestSol];
    
    if (!solData) {
      this.showNoDataMessage(container);
      return;
    }

    const isMetric = this.getCurrentUnits() === 'metric';
    
    container.innerHTML = `
      <div class="current-weather-grid">
        <div class="row g-4">
          <!-- Temperature Card -->
          <div class="col-lg-3 col-md-6">
            <div class="weather-card glass-card p-4 text-center">
              <div class="weather-icon mb-3">
                <i class="fas fa-thermometer-half fa-3x text-mars-red"></i>
              </div>
              <h5>Temperature</h5>
              <div class="weather-value">
                <span class="value-main">${this.formatTemperature(solData.AT?.av, isMetric)}</span>
                <span class="value-unit">${isMetric ? '°C' : '°F'}</span>
              </div>
              <div class="weather-range mt-2">
                <small class="text-muted">
                  High: ${this.formatTemperature(solData.AT?.mx, isMetric)}${isMetric ? '°C' : '°F'} | 
                  Low: ${this.formatTemperature(solData.AT?.mn, isMetric)}${isMetric ? '°C' : '°F'}
                </small>
              </div>
            </div>
          </div>
          
          <!-- Pressure Card -->
          <div class="col-lg-3 col-md-6">
            <div class="weather-card glass-card p-4 text-center">
              <div class="weather-icon mb-3">
                <i class="fas fa-tachometer-alt fa-3x text-earth-blue"></i>
              </div>
              <h5>Pressure</h5>
              <div class="weather-value">
                <span class="value-main">${this.formatPressure(solData.PRE?.av)}</span>
                <span class="value-unit">Pa</span>
              </div>
              <div class="weather-range mt-2">
                <small class="text-muted">
                  High: ${this.formatPressure(solData.PRE?.mx)} Pa | 
                  Low: ${this.formatPressure(solData.PRE?.mn)} Pa
                </small>
              </div>
            </div>
          </div>
          
          <!-- Wind Card -->
          <div class="col-lg-3 col-md-6">
            <div class="weather-card glass-card p-4 text-center">
              <div class="weather-icon mb-3">
                <i class="fas fa-wind fa-3x text-cosmic-purple"></i>
              </div>
              <h5>Wind Speed</h5>
              <div class="weather-value">
                <span class="value-main">${this.formatWindSpeed(solData.HWS?.av, isMetric)}</span>
                <span class="value-unit">${isMetric ? 'm/s' : 'mph'}</span>
              </div>
              <div class="weather-range mt-2">
                <small class="text-muted">
                  Max: ${this.formatWindSpeed(solData.HWS?.mx, isMetric)} ${isMetric ? 'm/s' : 'mph'}
                </small>
              </div>
            </div>
          </div>
          
          <!-- Sol Info Card -->
          <div class="col-lg-3 col-md-6">
            <div class="weather-card glass-card p-4 text-center">
              <div class="weather-icon mb-3">
                <i class="fas fa-calendar-day fa-3x text-saturn-gold"></i>
              </div>
              <h5>Sol Information</h5>
              <div class="weather-value">
                <span class="value-main">${latestSol}</span>
                <span class="value-unit">Sol</span>
              </div>
              <div class="weather-range mt-2">
                <small class="text-muted">
                  ${DateUtils.formatDate(solData.First_UTC?.split('T')[0])}
                </small>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Additional Info -->
        <div class="row mt-4">
          <div class="col-12">
            <div class="weather-summary glass-card p-4">
              <h5 class="mb-3">Latest Weather Summary</h5>
              <div class="row">
                <div class="col-md-6">
                  <div class="summary-item">
                    <strong>Sol ${latestSol} Weather Report:</strong>
                  </div>
                  <div class="summary-item">
                    <i class="fas fa-thermometer-half me-2"></i>
                    Average temperature: ${this.formatTemperature(solData.AT?.av, isMetric)}${isMetric ? '°C' : '°F'}
                  </div>
                  <div class="summary-item">
                    <i class="fas fa-tachometer-alt me-2"></i>
                    Atmospheric pressure: ${this.formatPressure(solData.PRE?.av)} Pa
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="summary-item">
                    <i class="fas fa-wind me-2"></i>
                    Wind speed: ${this.formatWindSpeed(solData.HWS?.av, isMetric)} ${isMetric ? 'm/s' : 'mph'}
                  </div>
                  <div class="summary-item">
                    <i class="fas fa-calendar me-2"></i>
                    Earth date: ${DateUtils.formatDate(solData.First_UTC?.split('T')[0])}
                  </div>
                  <div class="summary-item">
                    <i class="fas fa-clock me-2"></i>
                    Data age: ${DateUtils.formatRelativeTime(solData.First_UTC)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderHistoricalData(container, data) {
    if (this.viewMode === 'table') {
      this.renderHistoricalTable(container, data);
    } else {
      this.renderHistoricalCards(container, data);
    }
  }

  renderHistoricalTable(container, data) {
    const isMetric = this.getCurrentUnits() === 'metric';
    const sols = data.sol_keys.slice(-10).reverse(); // Show last 10 sols
    
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-glass">
          <thead>
            <tr>
              <th>Sol</th>
              <th>Earth Date</th>
              <th>Avg Temp</th>
              <th>High/Low Temp</th>
              <th>Pressure</th>
              <th>Wind Speed</th>
            </tr>
          </thead>
          <tbody>
            ${sols.map(sol => {
              const solData = data[sol];
              if (!solData) return '';
              
              return `
                <tr>
                  <td><strong>${sol}</strong></td>
                  <td>${DateUtils.formatDate(solData.First_UTC?.split('T')[0])}</td>
                  <td>${this.formatTemperature(solData.AT?.av, isMetric)}${isMetric ? '°C' : '°F'}</td>
                  <td>
                    <span class="text-danger">${this.formatTemperature(solData.AT?.mx, isMetric)}</span> / 
                    <span class="text-info">${this.formatTemperature(solData.AT?.mn, isMetric)}</span>
                  </td>
                  <td>${this.formatPressure(solData.PRE?.av)} Pa</td>
                  <td>${this.formatWindSpeed(solData.HWS?.av, isMetric)} ${isMetric ? 'm/s' : 'mph'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      ${sols.length === 0 ? `
        <div class="text-center py-4">
          <i class="fas fa-exclamation-triangle fa-2x text-muted mb-3"></i>
          <p class="text-muted">No historical weather data available</p>
        </div>
      ` : ''}
    `;
  }

  renderHistoricalCards(container, data) {
    const isMetric = this.getCurrentUnits() === 'metric';
    const sols = data.sol_keys.slice(-6).reverse(); // Show last 6 sols for cards
    
    container.innerHTML = `
      <div class="historical-cards">
        <div class="row g-3">
          ${sols.map(sol => {
            const solData = data[sol];
            if (!solData) return '';
            
            return `
              <div class="col-lg-4 col-md-6">
                <div class="historical-card glass-card p-3">
                  <div class="card-header d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">Sol ${sol}</h6>
                    <small class="text-muted">${DateUtils.formatDate(solData.First_UTC?.split('T')[0])}</small>
                  </div>
                  
                  <div class="weather-metrics">
                    <div class="metric-row">
                      <span class="metric-label">
                        <i class="fas fa-thermometer-half me-1"></i>Temperature:
                      </span>
                      <span class="metric-value">${this.formatTemperature(solData.AT?.av, isMetric)}${isMetric ? '°C' : '°F'}</span>
                    </div>
                    
                    <div class="metric-row">
                      <span class="metric-label">
                        <i class="fas fa-tachometer-alt me-1"></i>Pressure:
                      </span>
                      <span class="metric-value">${this.formatPressure(solData.PRE?.av)} Pa</span>
                    </div>
                    
                    <div class="metric-row">
                      <span class="metric-label">
                        <i class="fas fa-wind me-1"></i>Wind:
                      </span>
                      <span class="metric-value">${this.formatWindSpeed(solData.HWS?.av, isMetric)} ${isMetric ? 'm/s' : 'mph'}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      ${sols.length === 0 ? `
        <div class="text-center py-4">
          <i class="fas fa-exclamation-triangle fa-2x text-muted mb-3"></i>
          <p class="text-muted">No historical weather data available</p>
        </div>
      ` : ''}
    `;
  }

  createCharts(data) {
    const sols = data.sol_keys.slice(-14); // Last 14 sols for charts
    const isMetric = this.getCurrentUnits() === 'metric';
    
    // Prepare data for charts
    const chartData = sols.map(sol => {
      const solData = data[sol];
      return {
        sol: sol,
        date: solData.First_UTC?.split('T')[0],
        temperature: solData.AT?.av,
        tempHigh: solData.AT?.mx,
        tempLow: solData.AT?.mn,
        pressure: solData.PRE?.av,
        windSpeed: solData.HWS?.av
      };
    }).filter(item => item.temperature !== undefined);

    // Create temperature chart
    this.createTemperatureChart(chartData, isMetric);
    
    // Create pressure chart
    this.createPressureChart(chartData);
    
    // Create wind chart
    this.createWindChart(chartData, isMetric);
  }

  createTemperatureChart(data, isMetric) {
    const ctx = document.getElementById('temperatureChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.charts.temperature) {
      this.charts.temperature.destroy();
    }

    const tempUnit = isMetric ? '°C' : '°F';
    
    this.charts.temperature = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => `Sol ${item.sol}`),
        datasets: [
          {
            label: `Average Temperature (${tempUnit})`,
            data: data.map(item => this.formatTemperature(item.temperature, isMetric, false)),
            borderColor: 'rgb(255, 107, 53)',
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            tension: 0.4
          },
          {
            label: `High Temperature (${tempUnit})`,
            data: data.map(item => this.formatTemperature(item.tempHigh, isMetric, false)),
            borderColor: 'rgb(205, 92, 92)',
            backgroundColor: 'rgba(205, 92, 92, 0.1)',
            tension: 0.4
          },
          {
            label: `Low Temperature (${tempUnit})`,
            data: data.map(item => this.formatTemperature(item.tempLow, isMetric, false)),
            borderColor: 'rgb(74, 144, 226)',
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  createPressureChart(data) {
    const ctx = document.getElementById('pressureChart');
    if (!ctx) return;

    if (this.charts.pressure) {
      this.charts.pressure.destroy();
    }

    this.charts.pressure = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => `Sol ${item.sol}`),
        datasets: [{
          label: 'Atmospheric Pressure (Pa)',
          data: data.map(item => this.formatPressure(item.pressure, false)),
          borderColor: 'rgb(74, 144, 226)',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  createWindChart(data, isMetric) {
    const ctx = document.getElementById('windChart');
    if (!ctx) return;

    if (this.charts.wind) {
      this.charts.wind.destroy();
    }

    const windUnit = isMetric ? 'm/s' : 'mph';

    this.charts.wind = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(item => `Sol ${item.sol}`),
        datasets: [{
          label: `Wind Speed (${windUnit})`,
          data: data.map(item => this.formatWindSpeed(item.windSpeed, isMetric, false)),
          backgroundColor: 'rgba(108, 92, 231, 0.7)',
          borderColor: 'rgb(108, 92, 231)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  setViewMode(mode) {
    this.viewMode = mode;
    
    // Update button states
    const buttons = document.querySelectorAll('[data-view]');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === mode);
    });
    
    // Re-render historical data
    if (this.weatherData) {
      const historyContainer = document.getElementById('weather-history-content');
      this.renderHistoricalData(historyContainer, this.weatherData);
    }
  }

  updateDisplayUnits(units) {
    // Re-render all data with new units
    if (this.weatherData) {
      const currentWeatherContainer = document.getElementById('current-weather');
      const historyContainer = document.getElementById('weather-history-content');
      
      this.renderCurrentWeather(currentWeatherContainer, this.weatherData);
      this.renderHistoricalData(historyContainer, this.weatherData);
      this.createCharts(this.weatherData);
    }
  }

  getCurrentUnits() {
    return window.CosmosConnect?.AppState?.units || StorageUtils.get('app_units', 'metric');
  }

  formatTemperature(celsius, isMetric = true, includeSymbol = true) {
    if (celsius === undefined || celsius === null) return 'N/A';
    
    let value;
    if (isMetric) {
      value = Math.round(celsius);
    } else {
      value = Math.round(celsius * 9/5 + 32);
    }
    
    return includeSymbol ? value : value;
  }

  formatPressure(pascals, includeUnit = true) {
    if (pascals === undefined || pascals === null) return 'N/A';
    
    const value = Math.round(pascals);
    return includeUnit ? value : value;
  }

  formatWindSpeed(mps, isMetric = true, includeUnit = true) {
    if (mps === undefined || mps === null) return 'N/A';
    
    let value;
    if (isMetric) {
      value = Math.round(mps * 10) / 10; // Round to 1 decimal
    } else {
      value = Math.round(mps * 2.237 * 10) / 10; // Convert to mph
    }
    
    return includeUnit ? value : value;
  }

  showNoDataMessage(container) {
    container.innerHTML = `
      <div class="no-data-message glass-card p-5 text-center">
        <i class="fas fa-exclamation-triangle fa-3x text-warning mb-4"></i>
        <h4>No Weather Data Available</h4>
        <p class="mb-4">
          The InSight mission concluded in December 2022. Historical weather data 
          may be limited or unavailable through the current API endpoint.
        </p>
        <div class="alert alert-info alert-glass">
          <i class="fas fa-info-circle me-2"></i>
          For the most comprehensive Mars weather data, visit the 
          <a href="https://mars.nasa.gov/insight/weather/" target="_blank" class="alert-link">
            official InSight weather page
          </a>.
        </div>
      </div>
    `;
  }

  showToast(message, type = 'info') {
    if (window.CosmosConnect && window.CosmosConnect.app) {
      window.CosmosConnect.app.showToast(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  showError(message) {
    const contentContainer = document.getElementById('current-weather');
    if (contentContainer) {
      LoadingUtils.showError(contentContainer, message);
    }
  }
}

// Initialize Mars Weather app
const marsWeatherApp = new MarsWeatherApp();

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => marsWeatherApp.init(), 500);
  });
} else {
  setTimeout(() => marsWeatherApp.init(), 500);
}