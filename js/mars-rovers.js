class MarsRoversPage {
    constructor() {
        this.apiService = new MarsRoverService();
        this.currentPhotos = [];
        this.filteredPhotos = [];
        this.currentPage = 1;
        this.photosPerPage = 12;
        this.currentView = 'grid';
        this.currentRover = 'perseverance';
        this.currentSol = 1000;
        
        this.roverInfo = {
            perseverance: {
                name: 'Perseverance',
                description: 'NASA\'s most advanced Mars rover, searching for signs of ancient life.',
                launchDate: 'July 30, 2020',
                landingDate: 'February 18, 2021',
                status: 'Active',
                cameras: {
                    'FRONT_HAZCAM': 'Front Hazard Avoidance Camera',
                    'REAR_HAZCAM': 'Rear Hazard Avoidance Camera',
                    'MAST_CAM': 'Mast Camera',
                    'MARDI': 'Mars Descent Imager',
                    'MAHLI': 'Mars Hand Lens Imager',
                    'SUPERCAM': 'SuperCam Remote Micro-Imager'
                }
            },
            curiosity: {
                name: 'Curiosity',
                description: 'Nuclear-powered rover studying Mars geology and climate.',
                launchDate: 'November 26, 2011',
                landingDate: 'August 5, 2012',
                status: 'Active',
                cameras: {
                    'FHAZ': 'Front Hazard Avoidance Camera',
                    'RHAZ': 'Rear Hazard Avoidance Camera',
                    'MAST': 'Mast Camera',
                    'CHEMCAM': 'Chemistry and Camera Complex',
                    'MAHLI': 'Mars Hand Lens Imager',
                    'MARDI': 'Mars Descent Imager',
                    'NAVCAM': 'Navigation Camera'
                }
            },
            opportunity: {
                name: 'Opportunity',
                description: 'Long-duration rover that operated for nearly 15 years.',
                launchDate: 'July 7, 2003',
                landingDate: 'January 25, 2004',
                status: 'Mission Complete (2018)',
                cameras: {
                    'FHAZ': 'Front Hazard Avoidance Camera',
                    'RHAZ': 'Rear Hazard Avoidance Camera',
                    'NAVCAM': 'Navigation Camera',
                    'PANCAM': 'Panoramic Camera',
                    'MINITES': 'Miniature Thermal Emission Spectrometer'
                }
            },
            spirit: {
                name: 'Spirit',
                description: 'Twin rover to Opportunity, operated from 2004 to 2010.',
                launchDate: 'June 10, 2003',
                landingDate: 'January 4, 2004',
                status: 'Mission Complete (2010)',
                cameras: {
                    'FHAZ': 'Front Hazard Avoidance Camera',
                    'RHAZ': 'Rear Hazard Avoidance Camera',
                    'NAVCAM': 'Navigation Camera',
                    'PANCAM': 'Panoramic Camera',
                    'MINITES': 'Miniature Thermal Emission Spectrometer'
                }
            }
        };

        this.initializeEventListeners();
        this.updateRoverInfo();
        this.updateCameraOptions();
    }

    initializeEventListeners() {
        // Rover selection
        document.getElementById('roverSelect').addEventListener('change', (e) => {
            this.currentRover = e.target.value;
            this.updateRoverInfo();
            this.updateCameraOptions();
            this.loadRoverManifest();
        });

        // Load photos button
        document.getElementById('loadPhotosBtn').addEventListener('click', () => {
            this.currentSol = parseInt(document.getElementById('solInput').value) || 1000;
            this.loadPhotos();
        });

        // Sol input enter key
        document.getElementById('solInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.currentSol = parseInt(e.target.value) || 1000;
                this.loadPhotos();
            }
        });

        // Camera filter
        document.getElementById('cameraFilter').addEventListener('change', () => {
            this.filterPhotos();
        });

        // View toggle buttons
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.setView('grid');
        });

        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.setView('list');
        });

        // Download button
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadSelectedPhotos();
        });

        // Global sol loading function
        window.loadSol = (sol) => {
            document.getElementById('solInput').value = sol;
            this.currentSol = sol;
            this.loadPhotos();
        };
    }

    updateRoverInfo() {
        const rover = this.roverInfo[this.currentRover];
        
        document.getElementById('roverName').textContent = rover.name;
        document.getElementById('roverDescription').textContent = rover.description;
        document.getElementById('roverLaunchDate').textContent = rover.launchDate;
        document.getElementById('roverLandingDate').textContent = rover.landingDate;
        document.getElementById('roverStatus').textContent = rover.status;
    }

    updateCameraOptions() {
        const rover = this.roverInfo[this.currentRover];
        const cameraSelect = document.getElementById('cameraSelect');
        const cameraFilter = document.getElementById('cameraFilter');
        
        // Clear existing options
        cameraSelect.innerHTML = '<option value="all">All Cameras</option>';
        cameraFilter.innerHTML = '<option value="all">All Cameras</option>';
        
        // Add camera options
        Object.entries(rover.cameras).forEach(([abbrev, fullName]) => {
            const option1 = new Option(`${abbrev} - ${fullName}`, abbrev);
            const option2 = new Option(`${abbrev} - ${fullName}`, abbrev);
            cameraSelect.appendChild(option1);
            cameraFilter.appendChild(option2);
        });
    }

    async loadRoverManifest() {
        try {
            const manifest = await this.apiService.getRoverManifest(this.currentRover);
            
            if (manifest && manifest.photo_manifest) {
                document.getElementById('totalPhotos').textContent = 
                    manifest.photo_manifest.total_photos.toLocaleString();
                document.getElementById('maxSol').textContent = 
                    manifest.photo_manifest.max_sol.toLocaleString();
            }
        } catch (error) {
            console.warn('Could not load rover manifest:', error);
        }
    }

    async loadPhotos() {
        this.showLoading();
        this.hideStates();

        try {
            const selectedCamera = document.getElementById('cameraSelect').value;
            const camera = selectedCamera === 'all' ? null : selectedCamera;
            
            const response = await this.apiService.getRoverPhotos(
                this.currentRover,
                this.currentSol,
                camera
            );

            // Extract photos array from API response
            this.currentPhotos = (response && response.photos) ? response.photos : [];
            
            // Ensure currentPhotos is always an array
            if (!Array.isArray(this.currentPhotos)) {
                console.warn('currentPhotos is not an array, forcing to empty array');
                this.currentPhotos = [];
            }
            this.filterPhotos();
            
            if (this.currentPhotos.length === 0) {
                this.showNoPhotos();
            } else {
                this.showPhotos();
                this.updateResultsInfo();
                this.renderPhotos();
            }
            
        } catch (error) {
            console.error('Error loading photos:', error);
            this.showError('Failed to load photos. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    filterPhotos() {
        // Ensure currentPhotos is an array before filtering
        if (!Array.isArray(this.currentPhotos)) {
            console.warn('currentPhotos is not an array in filterPhotos, initializing to empty array');
            this.currentPhotos = [];
        }
        
        const cameraFilter = document.getElementById('cameraFilter').value;
        
        if (cameraFilter === 'all') {
            this.filteredPhotos = [...this.currentPhotos];
        } else {
            this.filteredPhotos = this.currentPhotos.filter(photo => 
                photo.camera && photo.camera.name === cameraFilter
            );
        }

        this.currentPage = 1;
        this.updatePhotoCount();
        this.renderPhotos();
    }

    renderPhotos() {
        const photoGrid = document.getElementById('photoGrid');
        const startIndex = (this.currentPage - 1) * this.photosPerPage;
        const endIndex = startIndex + this.photosPerPage;
        const pagePhotos = this.filteredPhotos.slice(startIndex, endIndex);

        if (this.currentView === 'grid') {
            this.renderGridView(photoGrid, pagePhotos);
        } else {
            this.renderListView(photoGrid, pagePhotos);
        }

        this.renderPagination();
        this.populateCameraFilter();
    }

    renderGridView(container, photos) {
        container.className = 'row g-4';
        container.innerHTML = '';

        photos.forEach(photo => {
            const col = document.createElement('div');
            col.className = 'col-md-4 col-lg-3';
            
            col.innerHTML = `
                <div class="photo-card glass-card h-100" data-photo-id="${photo.id}">
                    <div class="photo-image-container">
                        <img src="${photo.img_src}" alt="Mars photo ${photo.id}" 
                             class="photo-image" loading="lazy"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Available'">
                        <div class="photo-overlay">
                            <button class="btn btn-primary btn-sm" onclick="marsRoversPage.showPhotoModal('${photo.id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="marsRoversPage.downloadPhoto('${photo.img_src}', '${photo.id}')">
                                <i class="bi bi-download"></i>
                            </button>
                        </div>
                    </div>
                    <div class="photo-details p-3">
                        <div class="photo-camera mb-2">
                            <span class="badge bg-primary">${photo.camera.name}</span>
                        </div>
                        <div class="photo-info small text-muted">
                            <div>Sol ${photo.sol}</div>
                            <div>${DateUtils.formatDate(photo.earth_date)}</div>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
    }

    renderListView(container, photos) {
        container.className = 'row';
        container.innerHTML = '';

        const col = document.createElement('div');
        col.className = 'col-12';

        const listHTML = photos.map(photo => `
            <div class="photo-list-item glass-card mb-3 p-3" data-photo-id="${photo.id}">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${photo.img_src}" alt="Mars photo ${photo.id}" 
                             class="img-fluid rounded" style="max-height: 80px; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/100x80?text=No+Image'">
                    </div>
                    <div class="col-md-6">
                        <h6 class="mb-1">Photo ID: ${photo.id}</h6>
                        <div class="text-muted small">
                            <div><strong>Camera:</strong> ${photo.camera.full_name}</div>
                            <div><strong>Sol:</strong> ${photo.sol} | <strong>Earth Date:</strong> ${DateUtils.formatDate(photo.earth_date)}</div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary btn-sm me-2" onclick="marsRoversPage.showPhotoModal('${photo.id}')">
                            <i class="bi bi-eye me-1"></i>View
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="marsRoversPage.downloadPhoto('${photo.img_src}', '${photo.id}')">
                            <i class="bi bi-download me-1"></i>Download
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        col.innerHTML = listHTML;
        container.appendChild(col);
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredPhotos.length / this.photosPerPage);
        const pagination = document.getElementById('photoPagination');

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '<ul class="pagination pagination-sm">';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link glass-input" href="#" onclick="marsRoversPage.goToPage(${this.currentPage - 1})">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link glass-input" href="#" onclick="marsRoversPage.goToPage(1)">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link glass-input" href="#" onclick="marsRoversPage.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link glass-input" href="#" onclick="marsRoversPage.goToPage(${totalPages})">${totalPages}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link glass-input" href="#" onclick="marsRoversPage.goToPage(${this.currentPage + 1})">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;

        paginationHTML += '</ul>';
        pagination.innerHTML = paginationHTML;
    }

    populateCameraFilter() {
        const cameraFilter = document.getElementById('cameraFilter');
        const cameras = new Set();
        
        // Ensure currentPhotos is an array before processing
        if (Array.isArray(this.currentPhotos)) {
            this.currentPhotos.forEach(photo => {
                if (photo.camera && photo.camera.name) {
                    cameras.add(photo.camera.name);
                }
            });
        }

        // Save current selection
        const currentSelection = cameraFilter.value;
        
        // Clear and rebuild options
        cameraFilter.innerHTML = '<option value="all">All Cameras</option>';
        
        Array.from(cameras).sort().forEach(camera => {
            const option = new Option(camera, camera);
            cameraFilter.appendChild(option);
        });

        // Restore selection if still valid
        if (Array.from(cameraFilter.options).some(opt => opt.value === currentSelection)) {
            cameraFilter.value = currentSelection;
        }
    }

    showPhotoModal(photoId) {
        const photo = this.filteredPhotos.find(p => p.id == photoId);
        if (!photo) return;

        const modal = new bootstrap.Modal(document.getElementById('photoModal'));
        
        document.getElementById('photoModalTitle').textContent = `Mars Photo - Sol ${photo.sol}`;
        document.getElementById('modalPhotoImg').src = photo.img_src;
        document.getElementById('downloadLink').href = photo.img_src;

        const photoDetails = document.getElementById('photoDetails');
        photoDetails.innerHTML = `
            <div class="detail-item mb-3">
                <strong>Photo ID:</strong> ${photo.id}
            </div>
            <div class="detail-item mb-3">
                <strong>Rover:</strong> ${photo.rover.name}
            </div>
            <div class="detail-item mb-3">
                <strong>Camera:</strong> ${photo.camera.full_name} (${photo.camera.name})
            </div>
            <div class="detail-item mb-3">
                <strong>Sol:</strong> ${photo.sol}
            </div>
            <div class="detail-item mb-3">
                <strong>Earth Date:</strong> ${DateUtils.formatDate(photo.earth_date)}
            </div>
            <div class="detail-item mb-3">
                <strong>Status:</strong> ${photo.rover.status}
            </div>
        `;

        modal.show();
    }

    downloadPhoto(url, photoId) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `mars-photo-${photoId}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadSelectedPhotos() {
        const selectedPhotos = this.filteredPhotos.slice(
            (this.currentPage - 1) * this.photosPerPage,
            this.currentPage * this.photosPerPage
        );

        selectedPhotos.forEach((photo, index) => {
            setTimeout(() => {
                this.downloadPhoto(photo.img_src, photo.id);
            }, index * 100); // Stagger downloads
        });
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredPhotos.length / this.photosPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderPhotos();
            
            // Scroll to top of results
            document.getElementById('photoResults').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    setView(view) {
        this.currentView = view;
        
        // Update button states
        document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
        document.getElementById('listViewBtn').classList.toggle('active', view === 'list');
        
        this.renderPhotos();
    }

    updateResultsInfo() {
        document.getElementById('resultsTitle').textContent = 
            `${this.roverInfo[this.currentRover].name} Photos`;
        document.getElementById('resultsSubtitle').textContent = 
            `Photos from Sol ${this.currentSol}`;
    }

    updatePhotoCount() {
        const count = this.filteredPhotos.length;
        document.getElementById('photoCount').textContent = 
            `${count} photo${count !== 1 ? 's' : ''}`;
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

    showPhotos() {
        document.getElementById('photoResults').style.display = 'block';
    }

    showNoPhotos() {
        document.getElementById('noPhotosState').style.display = 'block';
    }

    hideStates() {
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('photoResults').style.display = 'none';
        document.getElementById('noPhotosState').style.display = 'none';
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.marsRoversPage = new MarsRoversPage();
    
    // Load initial rover manifest
    window.marsRoversPage.loadRoverManifest();
});