// Cosmos Connect - APOD (Astronomy Picture of the Day) Module

class APODApp {
  constructor() {
    this.currentAPOD = null;
    this.favorites = StorageUtils.get('apod_favorites', []);
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.setupDatePicker();
      this.setupEventListeners();
      await this.loadTodayAPOD();
      this.initialized = true;
      
      // Hide loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        setTimeout(() => loadingScreen.classList.add('hidden'), 1000);
      }
      
    } catch (error) {
      console.error('Failed to initialize APOD app:', error);
      this.showError('Failed to initialize APOD viewer. Please refresh the page.');
    }
  }

  setupDatePicker() {
    const dateInput = document.getElementById('apod-date');
    if (!dateInput) return;

    // Set max date to a known working date to avoid future dates that don't exist in APOD
    const maxDate = '2024-09-13';
    dateInput.max = maxDate;
    
    // Set default to a known working date
    const defaultDate = DateUtils.getTodayString();
    const currentYear = new Date().getFullYear();
    
    // If system date is in future, use a safe default
    if (currentYear > 2024) {
      dateInput.value = '2024-09-13';
    } else {
      dateInput.value = defaultDate;
    }

    // Set min date to APOD launch date (June 16, 1995)
    dateInput.min = '1995-06-16';
  }

  setupEventListeners() {
    // Load date button
    const loadDateBtn = document.getElementById('load-date-btn');
    if (loadDateBtn) {
      loadDateBtn.addEventListener('click', () => this.loadAPODByDate());
    }

    // Quick action buttons
    const todayBtn = document.getElementById('today-btn');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => this.loadTodayAPOD());
    }

    const randomBtn = document.getElementById('random-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => this.loadRandomAPOD());
    }

    const favoritesBtn = document.getElementById('favorites-btn');
    if (favoritesBtn) {
      favoritesBtn.addEventListener('click', () => this.showFavorites());
    }

    // Clear favorites button
    const clearFavoritesBtn = document.getElementById('clear-favorites-btn');
    if (clearFavoritesBtn) {
      clearFavoritesBtn.addEventListener('click', () => this.clearFavorites());
    }

    // Date input change
    const dateInput = document.getElementById('apod-date');
    if (dateInput) {
      dateInput.addEventListener('change', () => this.loadAPODByDate());
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  handleKeyboardShortcuts(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 't':
        if (event.ctrlKey || event.altKey) {
          event.preventDefault();
          this.loadTodayAPOD();
        }
        break;
      case 'r':
        if (event.ctrlKey || event.altKey) {
          event.preventDefault();
          this.loadRandomAPOD();
        }
        break;
      case 'f':
        if (event.ctrlKey || event.altKey) {
          event.preventDefault();
          this.showFavorites();
        }
        break;
      case 's':
        if (event.ctrlKey || event.altKey) {
          event.preventDefault();
          this.toggleFavorite();
        }
        break;
    }
  }

  async loadTodayAPOD() {
    // Get today's date, but use a safe fallback if system date is in the future
    let today = DateUtils.getTodayString();
    
    // If today's date appears to be in the future relative to real time,
    // use a known working date
    const currentYear = new Date().getFullYear();
    if (currentYear > 2024) {
      today = '2024-09-13'; // Use a known working recent date
    }
    
    const dateInput = document.getElementById('apod-date');
    if (dateInput) {
      dateInput.value = today;
    }
    await this.loadAPOD(today);
  }

  async loadAPODByDate() {
    const dateInput = document.getElementById('apod-date');
    if (!dateInput || !dateInput.value) return;

    await this.loadAPOD(dateInput.value);
  }

  async loadRandomAPOD() {
    const contentContainer = document.getElementById('apod-content');
    if (!contentContainer) return;

    try {
      LoadingUtils.showLoading(contentContainer, 'Loading random cosmic wonder...');
      
      const randomData = await APIManager.apod.getRandomAPOD(1);
      if (randomData && randomData.length > 0) {
        const apod = randomData[0];
        
        // Update date picker
        const dateInput = document.getElementById('apod-date');
        if (dateInput) {
          dateInput.value = apod.date;
        }
        
        this.currentAPOD = apod;
        this.renderAPOD(contentContainer, apod);
      } else {
        LoadingUtils.showError(contentContainer, 'No random APOD data available.');
      }
      
    } catch (error) {
      console.error('Failed to load random APOD:', error);
      const errorMessage = ErrorUtils.handleAPIError(error, 'random APOD');
      LoadingUtils.showError(contentContainer, errorMessage);
    }
  }

  async loadAPOD(date) {
    const contentContainer = document.getElementById('apod-content');
    if (!contentContainer) return;

    try {
      LoadingUtils.showLoading(contentContainer, 'Loading astronomical wonder...');
      
      const apodData = await APIManager.apod.getAPODByDate(date);
      this.currentAPOD = apodData;
      this.renderAPOD(contentContainer, apodData);
      
      // Update page title
      document.title = `${apodData.title} - APOD | Cosmos Connect`;
      
    } catch (error) {
      console.error('Failed to load APOD:', error);
      
      // If the requested date returns 404, try a fallback date
      if (error.status === 404 && date !== '2024-09-13') {
        console.log('Requested date not available, falling back to September 13, 2024');
        LoadingUtils.showLoading(contentContainer, 'Date not available, loading fallback...');
        
        try {
          const fallbackData = await APIManager.apod.getAPODByDate('2024-09-13');
          this.currentAPOD = fallbackData;
          this.renderAPOD(contentContainer, fallbackData);
          
          // Update date picker to show the fallback date
          const dateInput = document.getElementById('apod-date');
          if (dateInput) {
            dateInput.value = '2024-09-13';
          }
          
          // Show notification about fallback
          if (window.showNotification) {
            window.showNotification(`Date ${date} not available. Showing APOD for September 13, 2024 instead.`, 'warning');
          }
          
          document.title = `${fallbackData.title} - APOD | Cosmos Connect`;
          return;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      
      const errorMessage = ErrorUtils.handleAPIError(error, 'APOD');
      LoadingUtils.showError(contentContainer, errorMessage);
    }
  }

  renderAPOD(container, data) {
    const isVideo = data.media_type === 'video';
    const isFavorite = this.isFavorite(data.date);
    
    container.innerHTML = `
      <div class="apod-display">
        <div class="row">
          <!-- Media Section -->
          <div class="col-lg-8 mb-4">
            <div class="apod-media glass-card p-4">
              <div class="media-container position-relative">
                ${isVideo 
                  ? this.renderVideoMedia(data)
                  : this.renderImageMedia(data)
                }
                
                <!-- Media Controls -->
                <div class="media-controls position-absolute top-0 end-0 m-3">
                  <div class="btn-group-vertical">
                    <button class="btn btn-sm btn-outline-light mb-2" onclick="apodApp.toggleFavorite()" title="Add to Favorites">
                      <i class="fas fa-heart ${isFavorite ? 'text-danger' : ''}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-light mb-2" onclick="apodApp.shareAPOD()" title="Share">
                      <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-light" onclick="apodApp.downloadImage()" title="Download" ${isVideo ? 'disabled' : ''}>
                      <i class="fas fa-download"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Information Section -->
          <div class="col-lg-4 mb-4">
            <div class="apod-info glass-card p-4 h-100">
              <div class="apod-header mb-4">
                <h2 class="apod-title">${data.title}</h2>
                <div class="apod-meta">
                  <span class="badge badge-glass me-2">
                    <i class="fas fa-calendar me-1"></i>
                    ${DateUtils.formatDate(data.date)}
                  </span>
                  <span class="badge badge-glass">
                    <i class="fas fa-${isVideo ? 'video' : 'image'} me-1"></i>
                    ${isVideo ? 'Video' : 'Image'}
                  </span>
                </div>
              </div>
              
              <div class="apod-description">
                <h5>Description</h5>
                <p class="text-justify">${data.explanation}</p>
              </div>
              
              ${data.copyright ? `
                <div class="apod-copyright mt-4">
                  <h6>Copyright</h6>
                  <p class="text-muted">© ${data.copyright}</p>
                </div>
              ` : ''}
              
              <div class="apod-actions mt-4">
                <button class="btn btn-primary w-100 mb-2" onclick="apodApp.viewFullscreen()">
                  <i class="fas fa-expand me-2"></i>View Fullscreen
                </button>
                <button class="btn btn-outline-light w-100" onclick="apodApp.showImageDetails()">
                  <i class="fas fa-info-circle me-2"></i>Technical Details
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Navigation -->
        <div class="apod-navigation mt-4">
          <div class="row">
            <div class="col-md-6 mb-3">
              <button class="btn btn-outline-light w-100" onclick="apodApp.navigateDate(-1)">
                <i class="fas fa-chevron-left me-2"></i>Previous Day
              </button>
            </div>
            <div class="col-md-6 mb-3">
              <button class="btn btn-outline-light w-100" onclick="apodApp.navigateDate(1)" ${this.isToday(data.date) ? 'disabled' : ''}>
                Next Day<i class="fas fa-chevron-right ms-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize lazy loading for images
    ImageUtils.lazyLoad();
    
    // Scroll to top of content
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderImageMedia(data) {
    return `
      <div class="image-container">
        <img src="${data.url}" 
             alt="${data.title}" 
             class="img-fluid rounded apod-image"
             onclick="apodApp.viewFullscreen()"
             style="cursor: pointer;">
        ${data.hdurl ? `
          <div class="image-quality-toggle mt-2">
            <div class="btn-group w-100" role="group">
              <button class="btn btn-sm btn-outline-light active" onclick="apodApp.toggleImageQuality('standard')">
                Standard
              </button>
              <button class="btn btn-sm btn-outline-light" onclick="apodApp.toggleImageQuality('hd')">
                HD Quality
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderVideoMedia(data) {
    // Extract video ID from URL for better embedding
    let embedUrl = data.url;
    
    if (data.url.includes('youtube.com') || data.url.includes('youtu.be')) {
      const videoId = this.extractYouTubeVideoId(data.url);
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
      }
    }

    return `
      <div class="video-container">
        <div class="ratio ratio-16x9">
          <iframe src="${embedUrl}" 
                  class="rounded"
                  allowfullscreen
                  title="${data.title}">
          </iframe>
        </div>
        <div class="video-actions mt-2">
          <a href="${data.url}" target="_blank" class="btn btn-sm btn-outline-light">
            <i class="fas fa-external-link-alt me-1"></i>
            Watch on Original Site
          </a>
        </div>
      </div>
    `;
  }

  extractYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  toggleImageQuality(quality) {
    if (!this.currentAPOD || !this.currentAPOD.hdurl) return;

    const image = document.querySelector('.apod-image');
    const buttons = document.querySelectorAll('.image-quality-toggle .btn');
    
    if (image && buttons) {
      // Update image source
      if (quality === 'hd') {
        image.src = this.currentAPOD.hdurl;
      } else {
        image.src = this.currentAPOD.url;
      }

      // Update button states
      buttons.forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
    }
  }

  navigateDate(direction) {
    const dateInput = document.getElementById('apod-date');
    if (!dateInput || !dateInput.value) return;

    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + direction);
    
    const newDate = currentDate.toISOString().split('T')[0];
    
    // Check bounds
    if (newDate < '1995-06-16' || newDate > DateUtils.getTodayString()) {
      return;
    }

    dateInput.value = newDate;
    this.loadAPOD(newDate);
  }

  toggleFavorite() {
    if (!this.currentAPOD) return;

    const date = this.currentAPOD.date;
    const favoriteIndex = this.favorites.findIndex(fav => fav.date === date);

    if (favoriteIndex > -1) {
      // Remove from favorites
      this.favorites.splice(favoriteIndex, 1);
      this.showToast('Removed from favorites', 'info');
    } else {
      // Add to favorites
      this.favorites.push({
        date: date,
        title: this.currentAPOD.title,
        url: this.currentAPOD.url,
        thumbnail: this.currentAPOD.url,
        media_type: this.currentAPOD.media_type
      });
      this.showToast('Added to favorites', 'success');
    }

    // Save to localStorage
    StorageUtils.set('apod_favorites', this.favorites);
    
    // Update heart icon
    const heartIcon = document.querySelector('.media-controls .fa-heart');
    if (heartIcon) {
      heartIcon.classList.toggle('text-danger', this.isFavorite(date));
    }
  }

  isFavorite(date) {
    return this.favorites.some(fav => fav.date === date);
  }

  isToday(date) {
    return date === DateUtils.getTodayString();
  }

  shareAPOD() {
    if (!this.currentAPOD) return;

    const shareData = {
      title: `${this.currentAPOD.title} - NASA APOD`,
      text: `Check out today's Astronomy Picture of the Day: ${this.currentAPOD.title}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('Link copied to clipboard', 'success');
      }).catch(() => {
        this.showToast('Unable to copy link', 'error');
      });
    }
  }

  downloadImage() {
    if (!this.currentAPOD || this.currentAPOD.media_type === 'video') return;

    const imageUrl = this.currentAPOD.hdurl || this.currentAPOD.url;
    const fileName = `apod_${this.currentAPOD.date}_${this.currentAPOD.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;

    // Create download link
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    link.target = '_blank';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Download started', 'success');
  }

  viewFullscreen() {
    if (!this.currentAPOD) return;

    const isVideo = this.currentAPOD.media_type === 'video';
    
    // Create fullscreen modal
    const modal = document.createElement('div');
    modal.className = 'fullscreen-modal';
    modal.innerHTML = `
      <div class="fullscreen-content">
        <div class="fullscreen-header">
          <h3>${this.currentAPOD.title}</h3>
          <button class="btn btn-outline-light" onclick="this.closest('.fullscreen-modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="fullscreen-media">
          ${isVideo 
            ? `<iframe src="${this.currentAPOD.url}" class="w-100 h-100" allowfullscreen></iframe>`
            : `<img src="${this.currentAPOD.hdurl || this.currentAPOD.url}" class="img-fluid" alt="${this.currentAPOD.title}">`
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Close on escape key
    const closeHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', closeHandler);
      }
    };
    document.addEventListener('keydown', closeHandler);
  }

  showImageDetails() {
    if (!this.currentAPOD) return;

    const modal = new bootstrap.Modal(document.createElement('div'));
    modal._element.className = 'modal fade';
    modal._element.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Image Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <table class="table table-glass">
              <tr><td><strong>Title:</strong></td><td>${this.currentAPOD.title}</td></tr>
              <tr><td><strong>Date:</strong></td><td>${DateUtils.formatDate(this.currentAPOD.date)}</td></tr>
              <tr><td><strong>Media Type:</strong></td><td>${this.currentAPOD.media_type}</td></tr>
              ${this.currentAPOD.copyright ? `<tr><td><strong>Copyright:</strong></td><td>${this.currentAPOD.copyright}</td></tr>` : ''}
              <tr><td><strong>URL:</strong></td><td><a href="${this.currentAPOD.url}" target="_blank">View Original</a></td></tr>
              ${this.currentAPOD.hdurl ? `<tr><td><strong>HD URL:</strong></td><td><a href="${this.currentAPOD.hdurl}" target="_blank">View HD</a></td></tr>` : ''}
            </table>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal._element);
    modal.show();
    
    modal._element.addEventListener('hidden.bs.modal', () => {
      document.body.removeChild(modal._element);
    });
  }

  showFavorites() {
    const favoritesModal = new bootstrap.Modal(document.getElementById('favoritesModal'));
    const favoritesContent = document.getElementById('favorites-content');
    
    if (this.favorites.length === 0) {
      favoritesContent.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-heart fa-3x text-muted mb-3"></i>
          <p class="text-muted">No favorites yet. Add some APODs to your favorites!</p>
        </div>
      `;
    } else {
      favoritesContent.innerHTML = `
        <div class="favorites-grid">
          ${this.favorites.map(fav => `
            <div class="favorite-item glass-card p-3 mb-3" onclick="apodApp.loadFavorite('${fav.date}')">
              <div class="row align-items-center">
                <div class="col-3">
                  <img src="${fav.thumbnail}" alt="${fav.title}" class="img-fluid rounded">
                </div>
                <div class="col-7">
                  <h6 class="mb-1">${fav.title}</h6>
                  <small class="text-muted">${DateUtils.formatDate(fav.date)}</small>
                </div>
                <div class="col-2 text-end">
                  <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); apodApp.removeFavorite('${fav.date}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    favoritesModal.show();
  }

  loadFavorite(date) {
    const dateInput = document.getElementById('apod-date');
    if (dateInput) {
      dateInput.value = date;
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('favoritesModal'));
    modal.hide();
    
    // Load the APOD
    this.loadAPOD(date);
  }

  removeFavorite(date) {
    this.favorites = this.favorites.filter(fav => fav.date !== date);
    StorageUtils.set('apod_favorites', this.favorites);
    this.showFavorites(); // Refresh the modal
    this.showToast('Removed from favorites', 'info');
  }

  clearFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
      this.favorites = [];
      StorageUtils.set('apod_favorites', this.favorites);
      this.showFavorites(); // Refresh the modal
      this.showToast('All favorites cleared', 'info');
    }
  }

  showToast(message, type = 'info') {
    // Use the main app's toast function if available
    if (window.CosmosConnect && window.CosmosConnect.app) {
      window.CosmosConnect.app.showToast(message, type);
    } else {
      // Simple fallback
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  showError(message) {
    const contentContainer = document.getElementById('apod-content');
    if (contentContainer) {
      LoadingUtils.showError(contentContainer, message);
    }
  }
}

// Initialize APOD app
const apodApp = new APODApp();

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to initialize first
    setTimeout(() => apodApp.init(), 500);
  });
} else {
  setTimeout(() => apodApp.init(), 500);
}