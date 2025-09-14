/**
 * Navigation System for Cosmos Connect
 * Handles mobile menu, scroll effects, active states, and search integration
 */
class NavigationSystem {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.burgerMenu = document.querySelector('.burger-menu');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.navLinks = document.querySelectorAll('.nav-link, .nav-card');
        
        this.isScrolled = false;
        this.isMenuOpen = false;
        
        this.initializeEventListeners();
        this.handleScrollEffects();
        this.setActiveNavItem();
        this.initializeSearch();
    }

    initializeEventListeners() {
        // Scroll effects
        window.addEventListener('scroll', () => {
            this.handleScrollEffects();
        });

        // Mobile menu toggle
        if (this.burgerMenu) {
            this.burgerMenu.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMobileMenu();
            });
        }

        // Close mobile menu when clicking nav links
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMenuOpen) {
                    this.closeMobileMenu();
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && this.mobileMenu && !this.mobileMenu.contains(e.target) && !this.burgerMenu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href !== '#' && href !== '#!') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        this.smoothScrollTo(target);
                    }
                }
            });
        });
    }

    initializeSearch() {
        const searchInputs = document.querySelectorAll('#global-search, #mobile-search');
        
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(e.target.value);
                }
            });
        });
    }

    handleSearch(query) {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (query.length > 2) {
                this.showSearchSuggestions(query);
            } else {
                this.hideSearchSuggestions();
            }
        }, 300);
    }

    showSearchSuggestions(query) {
        // This would integrate with your search functionality
        console.log('Search suggestions for:', query);
    }

    hideSearchSuggestions() {
        // Hide search suggestions
    }

    performSearch(query) {
        if (query.trim()) {
            // Navigate to search page or perform search
            window.location.href = `pages/search.html?q=${encodeURIComponent(query)}`;
        }
    }

    handleScrollEffects() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldAddScrollClass = scrollTop > 50;

        if (shouldAddScrollClass !== this.isScrolled) {
            this.isScrolled = shouldAddScrollClass;
            
            if (this.isScrolled) {
                this.navbar.classList.add('navbar-scrolled');
            } else {
                this.navbar.classList.remove('navbar-scrolled');
            }
        }
    }

    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.isMenuOpen = true;
        
        if (this.mobileMenu) {
            this.mobileMenu.classList.add('show');
        }
        
        if (this.burgerMenu) {
            this.burgerMenu.setAttribute('aria-expanded', 'true');
            this.burgerMenu.classList.add('active');
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const firstNavLink = this.mobileMenu?.querySelector('.nav-card, .nav-link');
        if (firstNavLink) {
            setTimeout(() => firstNavLink.focus(), 100);
        }
    }

    closeMobileMenu() {
        this.isMenuOpen = false;
        
        if (this.mobileMenu) {
            this.mobileMenu.classList.remove('show');
        }
        
        if (this.burgerMenu) {
            this.burgerMenu.setAttribute('aria-expanded', 'false');
            this.burgerMenu.classList.remove('active');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    setActiveNavItem() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        // Remove active class from all nav links and cards
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current page link
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            const linkPage = href.split('/').pop();
            
            if (linkPage === currentPage || 
                (currentPage === '' && linkPage === 'index.html') ||
                (currentPage === 'index.html' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    smoothScrollTo(target) {
        const targetPosition = target.offsetTop - this.navbar.offsetHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    // Utility method to programmatically navigate
    navigateTo(url) {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        }
        
        // Add small delay for menu close animation
        setTimeout(() => {
            window.location.href = url;
        }, 100);
    }

    // Method to update navigation based on user preferences
    updateTheme(theme) {
        if (theme === 'dark') {
            this.navbar.classList.add('navbar-dark');
            this.navbar.classList.remove('navbar-light');
        } else {
            this.navbar.classList.add('navbar-light');
            this.navbar.classList.remove('navbar-dark');
        }
    }

    // Method to highlight navigation during search
    highlightNavigation() {
        this.navbar.classList.add('nav-highlight');
        setTimeout(() => {
            this.navbar.classList.remove('nav-highlight');
        }, 2000);
    }

    // Responsive navigation adjustments
    handleResize() {
        const isLargeScreen = window.innerWidth >= 992;
        
        if (isLargeScreen && this.isMenuOpen) {
            this.closeMobileMenu();
        }
    }
}

// Theme and units management functions
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    
    // Update navigation theme
    if (window.navigationSystem) {
        window.navigationSystem.updateTheme(newTheme);
    }
    
    // Show notification
    showNotification(`Theme changed to ${newTheme} mode`, 'info');
}

function toggleUnits() {
    const currentUnits = localStorage.getItem('units') || 'metric';
    const newUnits = currentUnits === 'metric' ? 'imperial' : 'metric';
    
    localStorage.setItem('units', newUnits);
    
    // Update UI
    const unitsDisplay = document.getElementById('current-units');
    if (unitsDisplay) {
        unitsDisplay.textContent = newUnits.charAt(0).toUpperCase() + newUnits.slice(1);
    }
    
    // Trigger units change event for other components
    window.dispatchEvent(new CustomEvent('unitsChanged', { 
        detail: { units: newUnits } 
    }));
    
    // Show notification
    showNotification(`Units changed to ${newUnits}`, 'info');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;
    notification.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getNotificationIcon(type)} me-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'error': return 'fa-times-circle';
        case 'info':
        default: return 'fa-info-circle';
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationSystem = new NavigationSystem();
    
    // Initialize theme and units from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedUnits = localStorage.getItem('units') || 'metric';
    
    document.body.setAttribute('data-theme', savedTheme);
    
    const unitsDisplay = document.getElementById('current-units');
    if (unitsDisplay) {
        unitsDisplay.textContent = savedUnits.charAt(0).toUpperCase() + savedUnits.slice(1);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.navigationSystem) {
            window.navigationSystem.handleResize();
        }
    });
    
    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
        if (window.navigationSystem) {
            window.navigationSystem.setActiveNavItem();
        }
    });
});

// Breadcrumb navigation helper
function updateBreadcrumb(items) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;
    
    breadcrumb.innerHTML = items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast) {
            return `<li class="breadcrumb-item active" aria-current="page">${item.text}</li>`;
        } else {
            return `<li class="breadcrumb-item"><a href="${item.url}">${item.text}</a></li>`;
        }
    }).join('');
}

// Export for global use
window.toggleTheme = toggleTheme;
window.toggleUnits = toggleUnits;
window.showNotification = showNotification;
window.updateBreadcrumb = updateBreadcrumb;