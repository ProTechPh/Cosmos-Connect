class ExoplanetsPage {
    constructor() {
        this.apiService = new ExoplanetService();
        this.allExoplanets = [];
        this.filteredExoplanets = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentView = 'cards';
        this.currentSort = { field: 'pl_name', order: 'asc' };
        this.filters = {
            search: '',
            method: 'all',
            size: 'all',
            maxDistance: 1000,
            maxTemp: 3000
        };

        this.initializeEventListeners();
        this.loadExoplanetData();
    }

    initializeEventListeners() {
        // Search input
        document.getElementById('planetSearch').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.debounceFilter();
        });

        // Filter controls
        document.getElementById('methodFilter').addEventListener('change', (e) => {
            this.filters.method = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sizeFilter').addEventListener('change', (e) => {
            this.filters.size = e.target.value;
            this.applyFilters();
        });

        // Range sliders
        document.getElementById('distanceRange').addEventListener('input', (e) => {
            this.filters.maxDistance = parseInt(e.target.value);
            document.getElementById('distanceValue').textContent = `0-${e.target.value}`;
        });

        document.getElementById('tempRange').addEventListener('input', (e) => {
            this.filters.maxTemp = parseInt(e.target.value);
            document.getElementById('tempValue').textContent = `0-${e.target.value}`;
        });

        // Filter buttons
        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('clearFiltersBtn2').addEventListener('click', () => {
            this.clearFilters();
        });

        // View toggles
        document.getElementById('cardViewBtn').addEventListener('click', () => {
            this.setView('cards');
        });

        document.getElementById('tableViewBtn').addEventListener('click', () => {
            this.setView('table');
        });

        document.getElementById('chartViewBtn').addEventListener('click', () => {
            this.setView('chart');
        });

        // Sort controls
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.currentSort.field = e.target.value;
            this.applySort();
        });

        document.getElementById('sortOrder').addEventListener('change', (e) => {
            this.currentSort.order = e.target.value;
            this.applySort();
        });

        // Results per page
        document.getElementById('resultsPerPage').addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderCurrentView();
        });

        // Debounced filter function
        this.debounceFilter = this.debounce(() => this.applyFilters(), 300);
    }

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
    }

    async loadExoplanetData() {
        this.showLoading();
        this.hideStates();

        try {
            const data = await this.apiService.getAllPlanets(500);
            
            // Check if we received sample data (fallback scenario)
            const isSampleData = data && data.length === 10 && data[0].pl_name === "Kepler-452b";
            
            this.allExoplanets = data || [];
            this.filteredExoplanets = [...this.allExoplanets];
            
            this.updateStatistics();
            this.applyFilters();
            this.showResults();
            
            // Show notification if using sample data
            if (isSampleData) {
                this.showFallbackNotification();
            }
            
        } catch (error) {
            console.error('Error loading exoplanet data:', error);
            this.showError('Failed to load exoplanet data. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    updateStatistics() {
        const stats = this.calculateStatistics();
        
        document.getElementById('totalExoplanets').textContent = stats.total.toLocaleString();
        document.getElementById('totalStars').textContent = stats.stars.toLocaleString();
        document.getElementById('totalSystems').textContent = stats.systems.toLocaleString();
        document.getElementById('habitableZone').textContent = stats.habitable.toLocaleString();
    }

    calculateStatistics() {
        const total = this.allExoplanets.length;
        const uniqueStars = new Set(this.allExoplanets.map(p => p.hostname)).size;
        const uniqueSystems = new Set(this.allExoplanets.map(p => p.sys_name || p.hostname)).size;
        
        // Estimate potentially habitable planets
        const habitable = this.allExoplanets.filter(planet => {
            const temp = parseFloat(planet.pl_eqt);
            const radius = parseFloat(planet.pl_rade);
            return temp >= 175 && temp <= 350 && radius >= 0.5 && radius <= 2.5;
        }).length;

        return { total, stars: uniqueStars, systems: uniqueSystems, habitable };
    }

    applyFilters() {
        let filtered = [...this.allExoplanets];

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(planet => 
                (planet.pl_name || '').toLowerCase().includes(this.filters.search) ||
                (planet.hostname || '').toLowerCase().includes(this.filters.search)
            );
        }

        // Discovery method filter
        if (this.filters.method !== 'all') {
            filtered = filtered.filter(planet => 
                planet.discoverymethod === this.filters.method
            );
        }

        // Size filter
        if (this.filters.size !== 'all') {
            filtered = filtered.filter(planet => {
                const radius = parseFloat(planet.pl_rade);
                if (isNaN(radius)) return false;

                switch (this.filters.size) {
                    case 'small': return radius < 1.25;
                    case 'medium': return radius >= 1.25 && radius < 2;
                    case 'large': return radius >= 2 && radius < 6;
                    case 'giant': return radius >= 6;
                    default: return true;
                }
            });
        }

        // Distance filter
        filtered = filtered.filter(planet => {
            const distance = parseFloat(planet.sy_dist);
            return isNaN(distance) || distance <= this.filters.maxDistance;
        });

        // Temperature filter
        filtered = filtered.filter(planet => {
            const temp = parseFloat(planet.pl_eqt);
            return isNaN(temp) || temp <= this.filters.maxTemp;
        });

        this.filteredExoplanets = filtered;
        this.currentPage = 1;
        this.applySort();
    }

    applySort() {
        this.filteredExoplanets.sort((a, b) => {
            const field = this.currentSort.field;
            let valueA = a[field] || '';
            let valueB = b[field] || '';

            // Handle numeric fields
            if (['disc_year', 'sy_dist', 'pl_rade', 'pl_masse', 'pl_orbper'].includes(field)) {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else {
                valueA = valueA.toString().toLowerCase();
                valueB = valueB.toString().toLowerCase();
            }

            let result;
            if (valueA < valueB) result = -1;
            else if (valueA > valueB) result = 1;
            else result = 0;

            return this.currentSort.order === 'desc' ? -result : result;
        });

        this.updateResultsCount();
        this.renderCurrentView();
    }

    updateResultsCount() {
        const count = this.filteredExoplanets.length;
        document.getElementById('resultsCount').textContent = 
            `Found ${count.toLocaleString()} exoplanet${count !== 1 ? 's' : ''}`;
    }

    setView(view) {
        this.currentView = view;
        
        // Update button states
        document.getElementById('cardViewBtn').classList.toggle('active', view === 'cards');
        document.getElementById('tableViewBtn').classList.toggle('active', view === 'table');
        document.getElementById('chartViewBtn').classList.toggle('active', view === 'chart');
        
        this.renderCurrentView();
    }

    renderCurrentView() {
        const container = document.getElementById('exoplanetsContainer');
        
        if (this.filteredExoplanets.length === 0) {
            this.showNoResults();
            return;
        } else {
            this.hideNoResults();
        }

        switch (this.currentView) {
            case 'cards':
                this.renderCardView(container);
                break;
            case 'table':
                this.renderTableView(container);
                break;
            case 'chart':
                this.renderChartView(container);
                break;
        }

        if (this.currentView !== 'chart') {
            this.renderPagination();
        }
    }

    renderCardView(container) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredExoplanets.slice(startIndex, endIndex);

        container.className = 'row g-4';
        container.innerHTML = '';

        pageItems.forEach(planet => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            
            col.innerHTML = `
                <div class="exoplanet-card glass-card h-100" data-planet-id="${planet.pl_name}">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">${planet.pl_name || 'Unknown'}</h5>
                            <div class="planet-badges">
                                ${this.getPlanetTypeBadge(planet)}
                                ${this.getHabitabilityBadge(planet)}
                            </div>
                        </div>
                        
                        <h6 class="text-muted mb-3">
                            <i class="bi bi-star me-1"></i>${planet.hostname || 'Unknown Host'}
                        </h6>
                        
                        <div class="planet-properties">
                            <div class="property-row">
                                <span class="property-label">Discovery:</span>
                                <span class="property-value">${planet.disc_year || 'Unknown'} 
                                    (${planet.discoverymethod || 'Unknown method'})</span>
                            </div>
                            
                            ${planet.sy_dist ? `
                                <div class="property-row">
                                    <span class="property-label">Distance:</span>
                                    <span class="property-value">${parseFloat(planet.sy_dist).toFixed(1)} light-years</span>
                                </div>
                            ` : ''}
                            
                            ${planet.pl_rade ? `
                                <div class="property-row">
                                    <span class="property-label">Radius:</span>
                                    <span class="property-value">${parseFloat(planet.pl_rade).toFixed(2)} R⊕</span>
                                </div>
                            ` : ''}
                            
                            ${planet.pl_orbper ? `
                                <div class="property-row">
                                    <span class="property-label">Orbital Period:</span>
                                    <span class="property-value">${parseFloat(planet.pl_orbper).toFixed(1)} days</span>
                                </div>
                            ` : ''}
                            
                            ${planet.pl_eqt ? `
                                <div class="property-row">
                                    <span class="property-label">Temperature:</span>
                                    <span class="property-value">${Math.round(parseFloat(planet.pl_eqt))} K</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="mt-3">
                            <button class="btn btn-primary btn-sm w-100" onclick="exoplanetsPage.showPlanetDetails('${planet.pl_name}')">
                                <i class="bi bi-info-circle me-1"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
    }

    renderTableView(container) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredExoplanets.slice(startIndex, endIndex);

        container.className = 'row';
        container.innerHTML = `
            <div class="col-12">
                <div class="table-responsive">
                    <table class="table table-glass">
                        <thead>
                            <tr>
                                <th>Planet Name</th>
                                <th>Host Star</th>
                                <th>Discovery Year</th>
                                <th>Method</th>
                                <th>Distance (ly)</th>
                                <th>Radius (R⊕)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageItems.map(planet => `
                                <tr>
                                    <td>
                                        <strong>${planet.pl_name || 'Unknown'}</strong>
                                        ${this.getPlanetTypeBadge(planet)}
                                    </td>
                                    <td>${planet.hostname || 'Unknown'}</td>
                                    <td>${planet.disc_year || '—'}</td>
                                    <td><small>${planet.discoverymethod || '—'}</small></td>
                                    <td>${planet.sy_dist ? parseFloat(planet.sy_dist).toFixed(1) : '—'}</td>
                                    <td>${planet.pl_rade ? parseFloat(planet.pl_rade).toFixed(2) : '—'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" 
                                                onclick="exoplanetsPage.showPlanetDetails('${planet.pl_name}')">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getPlanetTypeBadge(planet) {
        const radius = parseFloat(planet.pl_rade);
        if (isNaN(radius)) return '';

        let type, color;
        if (radius < 1.25) {
            type = 'Earth-like';
            color = 'success';
        } else if (radius < 2) {
            type = 'Super-Earth';
            color = 'info';
        } else if (radius < 6) {
            type = 'Neptune-like';
            color = 'warning';
        } else {
            type = 'Jupiter-like';
            color = 'danger';
        }

        return `<span class="badge bg-${color} ms-1">${type}</span>`;
    }

    getHabitabilityBadge(planet) {
        const temp = parseFloat(planet.pl_eqt);
        const radius = parseFloat(planet.pl_rade);
        
        if (!isNaN(temp) && !isNaN(radius) && 
            temp >= 175 && temp <= 350 && 
            radius >= 0.5 && radius <= 2.5) {
            return '<span class="badge bg-success ms-1">Potentially Habitable</span>';
        }
        return '';
    }

    showPlanetDetails(planetName) {
        const planet = this.filteredExoplanets.find(p => p.pl_name === planetName);
        if (!planet) return;

        const modal = new bootstrap.Modal(document.getElementById('exoplanetModal'));
        
        document.getElementById('exoplanetModalTitle').textContent = 
            `${planet.pl_name || 'Unknown Planet'} Details`;

        this.populateModalContent(planet);
        modal.show();
    }

    populateModalContent(planet) {
        const basicInfo = document.getElementById('exoplanetBasicInfo');
        const detailedInfo = document.getElementById('exoplanetDetailedInfo');

        basicInfo.innerHTML = `
            <h5>Basic Information</h5>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Planet Name:</strong> ${planet.pl_name || 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Host Star:</strong> ${planet.hostname || 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Discovery Year:</strong> ${planet.disc_year || 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Discovery Method:</strong> ${planet.discoverymethod || 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Distance:</strong> ${planet.sy_dist ? `${parseFloat(planet.sy_dist).toFixed(2)} light-years` : 'Unknown'}
                </div>
            </div>
        `;

        detailedInfo.innerHTML = `
            <h5>Physical Properties</h5>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Radius:</strong> ${planet.pl_rade ? `${parseFloat(planet.pl_rade).toFixed(3)} R⊕` : 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Mass:</strong> ${planet.pl_masse ? `${parseFloat(planet.pl_masse).toFixed(3)} M⊕` : 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Orbital Period:</strong> ${planet.pl_orbper ? `${parseFloat(planet.pl_orbper).toFixed(2)} days` : 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Temperature:</strong> ${planet.pl_eqt ? `${Math.round(parseFloat(planet.pl_eqt))} K` : 'Unknown'}
                </div>
            </div>
        `;
    }

    clearFilters() {
        document.getElementById('planetSearch').value = '';
        document.getElementById('methodFilter').value = 'all';
        document.getElementById('sizeFilter').value = 'all';
        document.getElementById('distanceRange').value = 1000;
        document.getElementById('tempRange').value = 3000;
        document.getElementById('distanceValue').textContent = '0-1000';
        document.getElementById('tempValue').textContent = '0-3000';
        
        this.filters = {
            search: '',
            method: 'all',
            size: 'all',
            maxDistance: 1000,
            maxTemp: 3000
        };
        
        this.applyFilters();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredExoplanets.length / this.itemsPerPage);
        const pagination = document.getElementById('exoplanetPagination');

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '<ul class="pagination">';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link glass-input" href="#" onclick="exoplanetsPage.goToPage(${this.currentPage - 1})">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers (simplified)
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link glass-input" href="#" onclick="exoplanetsPage.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link glass-input" href="#" onclick="exoplanetsPage.goToPage(${this.currentPage + 1})">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;

        paginationHTML += '</ul>';
        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredExoplanets.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderCurrentView();
        }
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorState').style.display = 'block';
    }

    showResults() {
        document.getElementById('resultsSection').style.display = 'block';
    }

    showNoResults() {
        document.getElementById('noResultsState').style.display = 'block';
    }

    hideStates() {
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('noResultsState').style.display = 'none';
    }

    hideNoResults() {
        document.getElementById('noResultsState').style.display = 'none';
    }

    showFallbackNotification() {
        // Create and show a temporary notification about using sample data
        const notification = document.createElement('div');
        notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 1060; max-width: 400px;';
        notification.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>Note:</strong> Using sample exoplanet data due to API limitations. 
            This includes 10 representative exoplanets for demonstration purposes.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.exoplanetsPage = new ExoplanetsPage();
});