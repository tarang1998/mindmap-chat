export class CacheService {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.accessOrder = [];
    }

    set(key, value, ttl = 300000) { // 5 minutes default TTL
        // Remove oldest items if cache is full
        if (this.cache.size >= this.maxSize) {
            this._evictOldest();
        }

        const item = {
            value,
            timestamp: Date.now(),
            ttl,
            accessCount: 0
        };

        this.cache.set(key, item);
        this._updateAccessOrder(key);
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if item has expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this._removeFromAccessOrder(key);
            return null;
        }

        // Update access count and order
        item.accessCount++;
        this._updateAccessOrder(key);

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this._removeFromAccessOrder(key);
        }
        return deleted;
    }

    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    size() {
        return this.cache.size;
    }

    keys() {
        return Array.from(this.cache.keys());
    }

    getStats() {
        const items = Array.from(this.cache.values());
        const totalAccess = items.reduce((sum, item) => sum + item.accessCount, 0);

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            totalAccess,
            averageAccess: items.length > 0 ? totalAccess / items.length : 0,
            oldestItem: items.length > 0 ? Math.min(...items.map(item => item.timestamp)) : null,
            newestItem: items.length > 0 ? Math.max(...items.map(item => item.timestamp)) : null
        };
    }

    _updateAccessOrder(key) {
        this._removeFromAccessOrder(key);
        this.accessOrder.push(key);
    }

    _removeFromAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    _evictOldest() {
        if (this.accessOrder.length === 0) return;

        const oldestKey = this.accessOrder.shift();
        this.cache.delete(oldestKey);
    }
}

// Specialized cache for mind maps
export class MindMapCache extends CacheService {
    constructor() {
        super(10); // Limit to 10 mind maps in cache
    }

    // Cache mind map data with longer TTL
    cacheMindMap(id, mindMap) {
        this.set(`mindmap_${id}`, mindMap, 1800000); // 30 minutes
    }

    // Cache mind map metadata
    cacheMindMapMeta(id, metadata) {
        this.set(`mindmap_meta_${id}`, metadata, 3600000); // 1 hour
    }

    // Cache search results
    cacheSearchResults(query, results) {
        this.set(`search_${query}`, results, 300000); // 5 minutes
    }

    // Get cached mind map
    getMindMap(id) {
        return this.get(`mindmap_${id}`);
    }

    // Get cached metadata
    getMindMapMeta(id) {
        return this.get(`mindmap_meta_${id}`);
    }

    // Get cached search results
    getSearchResults(query) {
        return this.get(`search_${query}`);
    }
} 