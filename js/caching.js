class AdvancedCacheManager {
    constructor() {
        this.cachePrefix = 'cosmos_connect_';
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
        this.cachePriorities = {
            'user_preferences': 100,
            'favorites': 90,
            'recent_searches': 80,
            'apod_data': 70,
            'mars_weather': 60,
            'asteroids': 50,
            'space_weather': 40,
            'rover_photos': 30,
            'exoplanets': 20
        };
        
        this.init();
    }

    init() {
        this.cleanupExpiredCache();
        this.enforceStorageLimit();
        this.setupStorageListener();
    }

    // Enhanced cache operations
    set(key, data, options = {}) {
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            expires: options.expires || Date.now() + (options.ttl || 3600000), // 1 hour default
            priority: options.priority || this.getCachePriority(key),
            size: this.calculateSize(data),
            version: options.version || '1.0',
            tags: options.tags || [],
            metadata: options.metadata || {}
        };

        try {
            localStorage.setItem(this.cachePrefix + key, JSON.stringify(cacheEntry));
            this.enforceStorageLimit();
            return true;
        } catch (error) {
            console.warn('Cache storage failed:', error);
            this.clearLowPriorityCache();
            try {
                localStorage.setItem(this.cachePrefix + key, JSON.stringify(cacheEntry));
                return true;
            } catch (retryError) {
                console.error('Cache storage failed after cleanup:', retryError);
                return false;
            }
        }
    }

    get(key, options = {}) {
        try {
            const cached = localStorage.getItem(this.cachePrefix + key);
            if (!cached) return null;

            const cacheEntry = JSON.parse(cached);
            
            // Check expiration
            if (Date.now() > cacheEntry.expires) {
                this.delete(key);
                return null;
            }

            // Check version compatibility
            if (options.version && cacheEntry.version !== options.version) {
                this.delete(key);
                return null;
            }

            // Update access time for LRU
            cacheEntry.lastAccessed = Date.now();
            localStorage.setItem(this.cachePrefix + key, JSON.stringify(cacheEntry));

            return cacheEntry.data;
        } catch (error) {
            console.warn('Cache retrieval failed:', error);
            this.delete(key);
            return null;
        }
    }

    delete(key) {
        localStorage.removeItem(this.cachePrefix + key);
    }

    // Cache management
    getCachePriority(key) {
        for (const [pattern, priority] of Object.entries(this.cachePriorities)) {
            if (key.includes(pattern)) {
                return priority;
            }
        }
        return 10; // Default low priority
    }

    calculateSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }

    getStorageInfo() {
        let totalSize = 0;
        let itemCount = 0;
        const items = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                try {
                    const value = localStorage.getItem(key);
                    const cacheEntry = JSON.parse(value);
                    const size = new Blob([value]).size;
                    
                    totalSize += size;
                    itemCount++;
                    
                    items.push({
                        key: key.replace(this.cachePrefix, ''),
                        size,
                        expires: cacheEntry.expires,
                        priority: cacheEntry.priority,
                        lastAccessed: cacheEntry.lastAccessed || cacheEntry.timestamp
                    });
                } catch (error) {
                    // Remove corrupted cache entry
                    localStorage.removeItem(key);
                }
            }
        }

        return {
            totalSize,
            itemCount,
            items: items.sort((a, b) => b.priority - a.priority),
            maxSize: this.maxCacheSize,
            utilizationPercent: (totalSize / this.maxCacheSize) * 100
        };
    }

    cleanupExpiredCache() {
        const now = Date.now();
        const keysToDelete = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                try {
                    const cacheEntry = JSON.parse(localStorage.getItem(key));
                    if (now > cacheEntry.expires) {
                        keysToDelete.push(key);
                    }
                } catch (error) {
                    keysToDelete.push(key);
                }
            }
        }

        keysToDelete.forEach(key => localStorage.removeItem(key));
        
        if (keysToDelete.length > 0) {
            console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
        }
    }

    enforceStorageLimit() {
        const storageInfo = this.getStorageInfo();
        
        if (storageInfo.totalSize <= this.maxCacheSize) return;

        // Sort by priority (ascending) and last accessed (ascending) for removal
        const itemsForRemoval = storageInfo.items
            .sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority; // Lower priority first
                }
                return a.lastAccessed - b.lastAccessed; // Older access first
            });

        let freedSize = 0;
        const targetReduction = storageInfo.totalSize - (this.maxCacheSize * 0.8); // Reduce to 80%

        for (const item of itemsForRemoval) {
            if (freedSize >= targetReduction) break;
            
            localStorage.removeItem(this.cachePrefix + item.key);
            freedSize += item.size;
        }

        console.log(`Freed ${freedSize} bytes from cache`);
    }

    clearLowPriorityCache() {
        const storageInfo = this.getStorageInfo();
        const lowPriorityItems = storageInfo.items.filter(item => item.priority < 50);
        
        lowPriorityItems.forEach(item => {
            localStorage.removeItem(this.cachePrefix + item.key);
        });
    }

    clearCache(pattern = null) {
        const keysToDelete = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                if (!pattern || key.includes(pattern)) {
                    keysToDelete.push(key);
                }
            }
        }
        
        keysToDelete.forEach(key => localStorage.removeItem(key));
        
        return keysToDelete.length;
    }

    // Bulk operations
    setMultiple(entries) {
        const results = [];
        
        for (const { key, data, options } of entries) {
            results.push({
                key,
                success: this.set(key, data, options)
            });
        }
        
        return results;
    }

    getMultiple(keys) {
        const results = {};
        
        keys.forEach(key => {
            results[key] = this.get(key);
        });
        
        return results;
    }

    // Cache statistics
    getStatistics() {
        const storageInfo = this.getStorageInfo();
        const now = Date.now();
        
        const stats = {
            ...storageInfo,
            expiredItems: 0,
            categoryCounts: {},
            averageAge: 0
        };

        let totalAge = 0;
        
        storageInfo.items.forEach(item => {
            if (now > item.expires) {
                stats.expiredItems++;
            }
            
            // Categorize by key pattern
            for (const pattern of Object.keys(this.cachePriorities)) {
                if (item.key.includes(pattern)) {
                    stats.categoryCounts[pattern] = (stats.categoryCounts[pattern] || 0) + 1;
                    break;
                }
            }
            
            totalAge += now - item.lastAccessed;
        });
        
        stats.averageAge = storageInfo.itemCount > 0 ? totalAge / storageInfo.itemCount : 0;
        
        return stats;
    }

    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith(this.cachePrefix)) {
                console.log('Cache updated from another tab:', e.key);
            }
        });
    }

    // Migration and versioning
    migrateCache(migrations = {}) {
        for (const [oldVersion, migration] of Object.entries(migrations)) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.cachePrefix)) {
                    try {
                        const cacheEntry = JSON.parse(localStorage.getItem(key));
                        if (cacheEntry.version === oldVersion) {
                            const newData = migration(cacheEntry.data);
                            cacheEntry.data = newData;
                            cacheEntry.version = '1.0'; // Update to current version
                            localStorage.setItem(key, JSON.stringify(cacheEntry));
                        }
                    } catch (error) {
                        console.warn('Migration failed for key:', key, error);
                    }
                }
            }
        }
    }
}

// User preferences management
class UserPreferencesManager {
    constructor() {
        this.cache = new AdvancedCacheManager();
        this.defaultPreferences = {
            theme: 'dark',
            units: 'metric',
            language: 'en',
            autoRefresh: true,
            refreshInterval: 300000, // 5 minutes
            notifications: true,
            favorites: [],
            recentSearches: [],
            viewPreferences: {
                apodView: 'detailed',
                marsWeatherView: 'dashboard',
                asteroidsView: 'cards',
                spaceWeatherView: 'timeline',
                roversView: 'grid',
                exoplanetsView: 'cards'
            },
            filterDefaults: {},
            customSettings: {}
        };
    }

    getPreferences() {
        const cached = this.cache.get('user_preferences', { version: '1.0' });
        if (cached) {
            return { ...this.defaultPreferences, ...cached };
        }
        return { ...this.defaultPreferences };
    }

    setPreferences(preferences) {
        const current = this.getPreferences();
        const updated = { ...current, ...preferences };
        
        return this.cache.set('user_preferences', updated, {
            priority: 100,
            ttl: 365 * 24 * 60 * 60 * 1000, // 1 year
            version: '1.0'
        });
    }

    updatePreference(key, value) {
        const preferences = this.getPreferences();
        
        // Handle nested keys
        if (key.includes('.')) {
            const keys = key.split('.');
            let target = preferences;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!target[keys[i]]) {
                    target[keys[i]] = {};
                }
                target = target[keys[i]];
            }
            
            target[keys[keys.length - 1]] = value;
        } else {
            preferences[key] = value;
        }
        
        return this.setPreferences(preferences);
    }

    getPreference(key, defaultValue = null) {
        const preferences = this.getPreferences();
        
        if (key.includes('.')) {
            const keys = key.split('.');
            let value = preferences;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return defaultValue;
                }
            }
            
            return value;
        }
        
        return preferences[key] !== undefined ? preferences[key] : defaultValue;
    }

    addToFavorites(type, item) {
        const favorites = this.getPreference('favorites', []);
        const existing = favorites.find(f => f.type === type && f.id === item.id);
        
        if (!existing) {
            favorites.push({
                type,
                ...item,
                addedAt: Date.now()
            });
            
            // Limit favorites to 100 items
            if (favorites.length > 100) {
                favorites.sort((a, b) => b.addedAt - a.addedAt);
                favorites.splice(100);
            }
            
            this.updatePreference('favorites', favorites);
        }
        
        return favorites;
    }

    removeFromFavorites(type, id) {
        const favorites = this.getPreference('favorites', []);
        const filtered = favorites.filter(f => !(f.type === type && f.id === id));
        
        this.updatePreference('favorites', filtered);
        return filtered;
    }

    addToRecentSearches(query, type = 'general') {
        const recent = this.getPreference('recentSearches', []);
        
        // Remove existing identical search
        const filtered = recent.filter(r => !(r.query === query && r.type === type));
        
        // Add to beginning
        filtered.unshift({
            query,
            type,
            timestamp: Date.now()
        });
        
        // Limit to 50 recent searches
        if (filtered.length > 50) {
            filtered.splice(50);
        }
        
        this.updatePreference('recentSearches', filtered);
        return filtered;
    }

    getRecentSearches(type = null, limit = 10) {
        const recent = this.getPreference('recentSearches', []);
        
        let filtered = recent;
        if (type) {
            filtered = recent.filter(r => r.type === type);
        }
        
        return filtered.slice(0, limit);
    }

    clearRecentSearches(type = null) {
        if (type) {
            const recent = this.getPreference('recentSearches', []);
            const filtered = recent.filter(r => r.type !== type);
            this.updatePreference('recentSearches', filtered);
        } else {
            this.updatePreference('recentSearches', []);
        }
    }

    exportPreferences() {
        return this.getPreferences();
    }

    importPreferences(preferences) {
        const current = this.getPreferences();
        const merged = { ...current, ...preferences };
        return this.setPreferences(merged);
    }

    resetPreferences() {
        this.cache.delete('user_preferences');
        return this.defaultPreferences;
    }
}

// Offline support manager
class OfflineManager {
    constructor() {
        this.cache = new AdvancedCacheManager();
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });
    }

    handleOnline() {
        console.log('Connection restored');
        document.body.classList.remove('offline');
        
        // Sync cached changes
        this.syncPendingChanges();
        
        // Show notification
        if (window.showNotification) {
            showNotification('Connection restored', 'success');
        }
    }

    handleOffline() {
        console.log('Connection lost');
        document.body.classList.add('offline');
        
        if (window.showNotification) {
            showNotification('You are offline. Some features may be limited.', 'warning');
        }
    }

    cacheForOffline(key, data, options = {}) {
        return this.cache.set(`offline_${key}`, data, {
            ...options,
            ttl: options.ttl || 7 * 24 * 60 * 60 * 1000, // 7 days
            priority: 80
        });
    }

    getOfflineData(key) {
        return this.cache.get(`offline_${key}`);
    }

    addPendingChange(change) {
        const pending = this.cache.get('pending_changes') || [];
        pending.push({
            ...change,
            timestamp: Date.now()
        });
        
        this.cache.set('pending_changes', pending, {
            priority: 90,
            ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
    }

    async syncPendingChanges() {
        const pending = this.cache.get('pending_changes') || [];
        
        if (pending.length === 0) return;
        
        console.log(`Syncing ${pending.length} pending changes`);
        
        // Process pending changes
        for (const change of pending) {
            try {
                await this.processPendingChange(change);
            } catch (error) {
                console.error('Failed to sync change:', error);
            }
        }
        
        // Clear processed changes
        this.cache.delete('pending_changes');
    }

    async processPendingChange(change) {
        // Implementation depends on the type of change
        // This is a placeholder for the actual sync logic
        console.log('Processing change:', change);
    }

    getConnectionStatus() {
        return {
            online: this.isOnline,
            connectionType: navigator.connection?.effectiveType || 'unknown',
            downlink: navigator.connection?.downlink || 0,
            rtt: navigator.connection?.rtt || 0
        };
    }
}

// Initialize global instances
window.cacheManager = new AdvancedCacheManager();
window.userPreferences = new UserPreferencesManager();
window.offlineManager = new OfflineManager();

// Global cache utilities for backward compatibility
window.CacheUtils = {
    set: (key, data, ttl) => window.cacheManager.set(key, data, { ttl: ttl * 60 * 1000 }),
    get: (key) => window.cacheManager.get(key),
    delete: (key) => window.cacheManager.delete(key),
    clear: (pattern) => window.cacheManager.clearCache(pattern),
    getStats: () => window.cacheManager.getStatistics()
};

console.log('Advanced caching system initialized');