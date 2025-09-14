class GlobalSearchService {
    constructor() {
        this.searchProviders = {
            apod: new APODSearchProvider(),
            asteroids: new AsteroidSearchProvider(),
            rovers: new RoverSearchProvider(),
            exoplanets: new ExoplanetSearchProvider(),
            spaceWeather: new SpaceWeatherSearchProvider()
        };
        
        this.searchHistory = [];
        this.searchFilters = {
            dateRange: null,
            categories: [],
            sortBy: 'relevance',
            resultsPerPage: 10
        };
        
        this.initializeSearch();
    }

    initializeSearch() {
        this.setupSearchInput();
        this.setupKeyboardShortcuts();
        this.loadSearchHistory();
    }

    setupSearchInput() {
        // Use existing mobile search input
        const existingSearch = document.getElementById('mobile-search');
        if (existingSearch && !document.getElementById('searchResults')) {
            // Add search results and suggestions containers to the mobile search
            const searchContainer = existingSearch.parentNode.parentNode;
            
            // Add missing elements for search functionality
            const searchExtensions = document.createElement('div');
            searchExtensions.innerHTML = `
                <button class="search-clear d-none" id="clearSearch">
                    <i class="fas fa-times"></i>
                </button>
                <div id="searchResults" class="search-results d-none"></div>
                <div id="searchSuggestions" class="search-suggestions d-none"></div>
            `;
            
            searchContainer.appendChild(searchExtensions);
            
            // Update the existing search input to have the global search ID
            existingSearch.id = 'globalSearch';
            
            this.attachSearchEvents();
        }
    }

    attachSearchEvents() {
        const searchInput = document.getElementById('globalSearch');
        const clearButton = document.getElementById('clearSearch');
        const resultsContainer = document.getElementById('searchResults');
        const suggestionsContainer = document.getElementById('searchSuggestions');

        // Check if all required elements exist
        if (!searchInput) {
            console.warn('Search input not found, skipping search event attachment');
            return;
        }

        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (query.length > 0) {
                if (clearButton) clearButton.classList.remove('d-none');
                
                // Debounce search
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
                
                // Show suggestions
                this.showSearchSuggestions(query);
            } else {
                if (clearButton) clearButton.classList.add('d-none');
                this.hideSearchResults();
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    this.navigateToSearchResults(query);
                }
            } else if (e.key === 'Escape') {
                this.hideSearchResults();
                searchInput.blur();
            }
        });

        searchInput.addEventListener('focus', () => {
            const query = searchInput.value.trim();
            if (query) {
                this.showSearchResults();
            } else {
                this.showRecentSearches();
            }
        });

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                clearButton.classList.add('d-none');
                this.hideSearchResults();
                searchInput.focus();
            });
        }

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mobile-search-container')) {
                this.hideSearchResults();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('globalSearch');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });
    }

    async performSearch(query) {
        try {
            this.showSearchLoading();
            
            const results = await this.searchAllProviders(query);
            const sortedResults = this.sortAndRankResults(results, query);
            
            this.displaySearchResults(sortedResults, query);
            this.addToSearchHistory(query);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError('Search failed. Please try again.');
        }
    }

    async searchAllProviders(query) {
        const searchPromises = Object.entries(this.searchProviders).map(async ([type, provider]) => {
            try {
                const results = await provider.search(query, this.searchFilters);
                return results.map(result => ({
                    ...result,
                    type,
                    provider: provider.name
                }));
            } catch (error) {
                console.warn(`Search failed for ${type}:`, error);
                return [];
            }
        });

        const allResults = await Promise.all(searchPromises);
        return allResults.flat();
    }

    sortAndRankResults(results, query) {
        return results.map(result => ({
            ...result,
            relevanceScore: this.calculateRelevanceScore(result, query)
        })).sort((a, b) => {
            if (this.searchFilters.sortBy === 'relevance') {
                return b.relevanceScore - a.relevanceScore;
            } else if (this.searchFilters.sortBy === 'date') {
                return new Date(b.date || 0) - new Date(a.date || 0);
            }
            return 0;
        }).slice(0, this.searchFilters.resultsPerPage);
    }

    calculateRelevanceScore(result, query) {
        const queryLower = query.toLowerCase();
        let score = 0;

        // Title match (highest weight)
        if (result.title && result.title.toLowerCase().includes(queryLower)) {
            score += 100;
            if (result.title.toLowerCase().startsWith(queryLower)) {
                score += 50;
            }
        }

        // Description match
        if (result.description && result.description.toLowerCase().includes(queryLower)) {
            score += 50;
        }

        // Tags/keywords match
        if (result.tags) {
            result.tags.forEach(tag => {
                if (tag.toLowerCase().includes(queryLower)) {
                    score += 25;
                }
            });
        }

        // Exact match bonus
        if (result.title && result.title.toLowerCase() === queryLower) {
            score += 200;
        }

        // Recent content bonus
        if (result.date) {
            const daysSinceCreated = (Date.now() - new Date(result.date)) / (1000 * 60 * 60 * 24);
            if (daysSinceCreated < 30) {
                score += Math.max(0, 20 - daysSinceCreated);
            }
        }

        return score;
    }

    displaySearchResults(results, query) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <i class="bi bi-search text-muted mb-2"></i>
                    <p class="mb-2">No results found for "${query}"</p>
                    <small class="text-muted">Try different keywords or check spelling</small>
                </div>
            `;
        } else {
            const groupedResults = this.groupResultsByType(results);
            resultsContainer.innerHTML = this.renderSearchResults(groupedResults, query);
        }
        
        resultsContainer.classList.remove('d-none');
    }

    groupResultsByType(results) {
        const grouped = {};
        results.forEach(result => {
            if (!grouped[result.type]) {
                grouped[result.type] = [];
            }
            grouped[result.type].push(result);
        });
        return grouped;
    }

    renderSearchResults(groupedResults, query) {
        let html = `
            <div class="search-results-header">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">Search Results for "${query}"</h6>
                    <a href="#" onclick="globalSearch.navigateToSearchResults('${query}')" class="btn btn-sm btn-primary">
                        View All
                    </a>
                </div>
            </div>
        `;

        Object.entries(groupedResults).forEach(([type, results]) => {
            html += `
                <div class="search-category mb-3">
                    <h6 class="search-category-title">${this.getCategoryDisplayName(type)} (${results.length})</h6>
                    <div class="search-category-results">
                        ${results.slice(0, 3).map(result => this.renderSearchResult(result)).join('')}
                    </div>
                </div>
            `;
        });

        return html;
    }

    renderSearchResult(result) {
        return `
            <div class="search-result-item" onclick="globalSearch.openSearchResult('${result.type}', '${result.id}')">
                <div class="search-result-content">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-description">${result.description || ''}</div>
                    <div class="search-result-meta">
                        <span class="search-result-type">${this.getCategoryDisplayName(result.type)}</span>
                        ${result.date ? `<span class="search-result-date">${formatDate(result.date)}</span>` : ''}
                    </div>
                </div>
                ${result.thumbnail ? `<div class="search-result-thumbnail">
                    <img src="${result.thumbnail}" alt="${result.title}" loading="lazy">
                </div>` : ''}
            </div>
        `;
    }

    getCategoryDisplayName(type) {
        const displayNames = {
            apod: 'Astronomy Pictures',
            asteroids: 'Near Earth Objects',
            rovers: 'Mars Rover Photos',
            exoplanets: 'Exoplanets',
            spaceWeather: 'Space Weather'
        };
        return displayNames[type] || type;
    }

    showSearchSuggestions(query) {
        const suggestions = this.generateSearchSuggestions(query);
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (suggestions.length > 0) {
            suggestionsContainer.innerHTML = `
                <div class="search-suggestions-content">
                    ${suggestions.map(suggestion => `
                        <div class="search-suggestion-item" onclick="globalSearch.applySuggestion('${suggestion}')">
                            <i class="bi bi-search me-2"></i>${suggestion}
                        </div>
                    `).join('')}
                </div>
            `;
            suggestionsContainer.classList.remove('d-none');
        }
    }

    generateSearchSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();

        // Common search terms
        const commonTerms = [
            'mars', 'earth', 'asteroid', 'comet', 'galaxy', 'nebula', 
            'black hole', 'exoplanet', 'solar flare', 'aurora', 'meteor',
            'jupiter', 'saturn', 'venus', 'mercury', 'uranus', 'neptune',
            'curiosity', 'perseverance', 'opportunity', 'spirit',
            'hubble', 'james webb', 'nasa', 'space station'
        ];

        // Find matching terms
        commonTerms.forEach(term => {
            if (term.startsWith(queryLower) && term !== queryLower) {
                suggestions.push(term);
            }
        });

        // Add recent searches that match
        this.searchHistory.forEach(item => {
            if (item.query.toLowerCase().includes(queryLower) && 
                item.query.toLowerCase() !== queryLower &&
                !suggestions.includes(item.query)) {
                suggestions.push(item.query);
            }
        });

        return suggestions.slice(0, 5);
    }

    showRecentSearches() {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (this.searchHistory.length > 0) {
            suggestionsContainer.innerHTML = `
                <div class="search-suggestions-content">
                    <div class="search-suggestions-header">Recent Searches</div>
                    ${this.searchHistory.slice(0, 5).map(item => `
                        <div class="search-suggestion-item" onclick="globalSearch.applySuggestion('${item.query}')">
                            <i class="bi bi-clock me-2"></i>${item.query}
                            <button class="search-suggestion-remove" onclick="event.stopPropagation(); globalSearch.removeFromHistory('${item.query}')">
                                <i class="bi bi-x"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
            suggestionsContainer.classList.remove('d-none');
        }
    }

    applySuggestion(suggestion) {
        const searchInput = document.getElementById('globalSearch');
        searchInput.value = suggestion;
        this.performSearch(suggestion);
    }

    navigateToSearchResults(query) {
        // Create a dedicated search results page or navigate to specific section
        const url = `pages/search-results.html?q=${encodeURIComponent(query)}`;
        window.location.href = url;
    }

    openSearchResult(type, id) {
        const urls = {
            apod: `pages/apod.html?date=${id}`,
            asteroids: `pages/asteroids.html#${id}`,
            rovers: `pages/mars-rovers.html?photo=${id}`,
            exoplanets: `pages/exoplanets.html?planet=${id}`,
            spaceWeather: `pages/space-weather.html?event=${id}`
        };

        if (urls[type]) {
            window.location.href = urls[type];
        }
    }

    addToSearchHistory(query) {
        const existing = this.searchHistory.findIndex(item => item.query === query);
        
        if (existing !== -1) {
            this.searchHistory.splice(existing, 1);
        }
        
        this.searchHistory.unshift({
            query,
            timestamp: Date.now()
        });
        
        // Keep only last 20 searches
        this.searchHistory = this.searchHistory.slice(0, 20);
        
        // Save to local storage
        localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
    }

    removeFromHistory(query) {
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
        this.showRecentSearches();
    }

    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('search_history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load search history:', error);
            this.searchHistory = [];
        }
    }

    showSearchLoading() {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                Searching...
            </div>
        `;
        resultsContainer.classList.remove('d-none');
    }

    showSearchError(message) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = `
            <div class="search-error">
                <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                ${message}
            </div>
        `;
        resultsContainer.classList.remove('d-none');
    }

    showSearchResults() {
        document.getElementById('searchResults').classList.remove('d-none');
    }

    hideSearchResults() {
        document.getElementById('searchResults').classList.add('d-none');
        document.getElementById('searchSuggestions').classList.add('d-none');
    }
}

// Search provider base class
class SearchProvider {
    constructor(name) {
        this.name = name;
    }

    async search(query, filters) {
        throw new Error('Search method must be implemented by subclass');
    }
}

// APOD Search Provider
class APODSearchProvider extends SearchProvider {
    constructor() {
        super('Astronomy Picture of the Day');
        this.apodService = new APODService();
    }

    async search(query, filters) {
        // Search in cached APOD data or perform new search
        const queryLower = query.toLowerCase();
        const results = [];

        // Check recent APOD entries from cache
        const recentAPODs = this.getRecentAPODsFromCache();
        
        recentAPODs.forEach(apod => {
            if (this.matchesQuery(apod, queryLower)) {
                results.push({
                    id: apod.date,
                    title: apod.title,
                    description: apod.explanation,
                    date: apod.date,
                    thumbnail: apod.media_type === 'image' ? apod.url : null,
                    tags: this.extractTags(apod)
                });
            }
        });

        return results;
    }

    getRecentAPODsFromCache() {
        const cached = [];
        // Get last 30 days of APOD data from cache
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const cachedAPOD = window.cacheManager?.get(`apod_${dateStr}`);
            if (cachedAPOD) {
                cached.push(cachedAPOD);
            }
        }
        return cached;
    }

    matchesQuery(apod, query) {
        return (apod.title && apod.title.toLowerCase().includes(query)) ||
               (apod.explanation && apod.explanation.toLowerCase().includes(query));
    }

    extractTags(apod) {
        const tags = [];
        const text = `${apod.title} ${apod.explanation}`.toLowerCase();
        
        const commonTags = ['galaxy', 'nebula', 'star', 'planet', 'moon', 'comet', 'asteroid', 'mars', 'jupiter', 'saturn'];
        commonTags.forEach(tag => {
            if (text.includes(tag)) {
                tags.push(tag);
            }
        });
        
        return tags;
    }
}

// Similar search providers for other data types...
class AsteroidSearchProvider extends SearchProvider {
    constructor() {
        super('Near Earth Objects');
    }

    async search(query, filters) {
        // Implementation for asteroid search
        return [];
    }
}

class RoverSearchProvider extends SearchProvider {
    constructor() {
        super('Mars Rover Photos');
    }

    async search(query, filters) {
        // Implementation for rover photo search
        return [];
    }
}

class ExoplanetSearchProvider extends SearchProvider {
    constructor() {
        super('Exoplanets');
    }

    async search(query, filters) {
        // Implementation for exoplanet search
        return [];
    }
}

class SpaceWeatherSearchProvider extends SearchProvider {
    constructor() {
        super('Space Weather');
    }

    async search(query, filters) {
        // Implementation for space weather search
        return [];
    }
}

// Initialize global search
document.addEventListener('DOMContentLoaded', () => {
    if (!window.globalSearch) {
        window.globalSearch = new GlobalSearchService();
    }
});

// Export for use in other modules
window.GlobalSearchService = GlobalSearchService;