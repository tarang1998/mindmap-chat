export class StorageService {
    constructor(storageType = 'localStorage') {
        this.storageType = storageType;
        this.storage = this._getStorage();
    }

    _getStorage() {
        switch (this.storageType) {
            case 'localStorage':
                return window.localStorage;
            case 'sessionStorage':
                return window.sessionStorage;
            default:
                throw new Error(`Unsupported storage type: ${this.storageType}`);
        }
    }

    async set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            this.storage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            throw new Error(`Failed to set storage item: ${error.message}`);
        }
    }

    async get(key) {
        try {
            const item = this.storage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            throw new Error(`Failed to get storage item: ${error.message}`);
        }
    }

    async remove(key) {
        try {
            this.storage.removeItem(key);
            return true;
        } catch (error) {
            throw new Error(`Failed to remove storage item: ${error.message}`);
        }
    }

    async clear() {
        try {
            this.storage.clear();
            return true;
        } catch (error) {
            throw new Error(`Failed to clear storage: ${error.message}`);
        }
    }

    async has(key) {
        try {
            return this.storage.getItem(key) !== null;
        } catch (error) {
            return false;
        }
    }

    async getKeys() {
        try {
            return Object.keys(this.storage);
        } catch (error) {
            return [];
        }
    }

    async getSize() {
        try {
            const keys = await this.getKeys();
            let totalSize = 0;

            for (const key of keys) {
                const item = this.storage.getItem(key);
                if (item) {
                    totalSize += new Blob([item]).size;
                }
            }

            return totalSize;
        } catch (error) {
            return 0;
        }
    }
} 