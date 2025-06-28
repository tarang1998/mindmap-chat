import { IMindMapRepository } from './interfaces/IMindMapRepository.js';
import { MindMap } from '../../domain/entities/MindMap.js';

export class LocalStorageMindMapRepository extends IMindMapRepository {
    constructor(storageKey = 'mindmaps') {
        super();
        this.storageKey = storageKey;
    }

    async save(mindMap) {
        try {
            const mindMaps = await this._loadAll();
            const mindMapData = mindMap.toJSON();

            // Update existing or add new
            const existingIndex = mindMaps.findIndex(m => m.id === mindMap.id);
            if (existingIndex >= 0) {
                mindMaps[existingIndex] = mindMapData;
            } else {
                mindMaps.push(mindMapData);
            }

            await this._saveAll(mindMaps);
            return MindMap.fromJSON(mindMapData);
        } catch (error) {
            throw new Error(`Failed to save mind map: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            const mindMaps = await this._loadAll();
            const mindMapData = mindMaps.find(m => m.id === id);

            if (!mindMapData) {
                return null;
            }

            return MindMap.fromJSON(mindMapData);
        } catch (error) {
            throw new Error(`Failed to find mind map: ${error.message}`);
        }
    }

    async findAll() {
        try {
            const mindMaps = await this._loadAll();
            return mindMaps.map(data => MindMap.fromJSON(data));
        } catch (error) {
            throw new Error(`Failed to load mind maps: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            const mindMaps = await this._loadAll();
            const initialLength = mindMaps.length;
            const filteredMaps = mindMaps.filter(m => m.id !== id);

            if (filteredMaps.length === initialLength) {
                return false; // Not found
            }

            await this._saveAll(filteredMaps);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete mind map: ${error.message}`);
        }
    }

    async exists(id) {
        try {
            const mindMaps = await this._loadAll();
            return mindMaps.some(m => m.id === id);
        } catch (error) {
            throw new Error(`Failed to check mind map existence: ${error.message}`);
        }
    }

    async findByCriteria(criteria) {
        try {
            const mindMaps = await this._loadAll();
            let filteredMaps = mindMaps;

            // Apply search criteria
            if (criteria.title) {
                filteredMaps = filteredMaps.filter(m =>
                    m.title.toLowerCase().includes(criteria.title.toLowerCase())
                );
            }

            if (criteria.createdAfter) {
                filteredMaps = filteredMaps.filter(m =>
                    new Date(m.createdAt) >= new Date(criteria.createdAfter)
                );
            }

            if (criteria.updatedAfter) {
                filteredMaps = filteredMaps.filter(m =>
                    new Date(m.updatedAt) >= new Date(criteria.updatedAfter)
                );
            }

            return filteredMaps.map(data => MindMap.fromJSON(data));
        } catch (error) {
            throw new Error(`Failed to search mind maps: ${error.message}`);
        }
    }

    // Private helper methods
    async _loadAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('Failed to load from localStorage, returning empty array:', error);
            return [];
        }
    }

    async _saveAll(mindMaps) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(mindMaps));
        } catch (error) {
            throw new Error(`Failed to save to localStorage: ${error.message}`);
        }
    }

    // Utility methods
    async clearAll() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            throw new Error(`Failed to clear localStorage: ${error.message}`);
        }
    }

    async getStorageSize() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? new Blob([data]).size : 0;
        } catch (error) {
            return 0;
        }
    }
} 