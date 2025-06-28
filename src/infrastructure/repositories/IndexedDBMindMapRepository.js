import { IMindMapRepository } from './interfaces/IMindMapRepository.js';
import { MindMap } from '../../domain/entities/MindMap.js';

export class IndexedDBMindMapRepository extends IMindMapRepository {
    constructor(dbName = 'MindMapDB', version = 1) {
        super();
        this.dbName = dbName;
        this.version = version;
        this.storeName = 'mindmaps';
        this.db = null;
    }

    async _initDB() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(new Error('Failed to open IndexedDB'));
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('title', 'title', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
            };
        });
    }

    async save(mindMap) {
        try {
            await this._initDB();
            const mindMapData = mindMap.toJSON();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(mindMapData);

                request.onsuccess = () => resolve(MindMap.fromJSON(mindMapData));
                request.onerror = () => reject(new Error('Failed to save mind map'));
            });
        } catch (error) {
            throw new Error(`Failed to save mind map: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            await this._initDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(id);

                request.onsuccess = () => {
                    const data = request.result;
                    resolve(data ? MindMap.fromJSON(data) : null);
                };
                request.onerror = () => reject(new Error('Failed to find mind map'));
            });
        } catch (error) {
            throw new Error(`Failed to find mind map: ${error.message}`);
        }
    }

    async findAll() {
        try {
            await this._initDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    const data = request.result;
                    resolve(data.map(item => MindMap.fromJSON(item)));
                };
                request.onerror = () => reject(new Error('Failed to load mind maps'));
            });
        } catch (error) {
            throw new Error(`Failed to load mind maps: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            await this._initDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(id);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(new Error('Failed to delete mind map'));
            });
        } catch (error) {
            throw new Error(`Failed to delete mind map: ${error.message}`);
        }
    }

    async exists(id) {
        try {
            const mindMap = await this.findById(id);
            return mindMap !== null;
        } catch (error) {
            throw new Error(`Failed to check mind map existence: ${error.message}`);
        }
    }

    async findByCriteria(criteria) {
        try {
            await this._initDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    let data = request.result;

                    // Apply filters
                    if (criteria.title) {
                        data = data.filter(m =>
                            m.title.toLowerCase().includes(criteria.title.toLowerCase())
                        );
                    }

                    if (criteria.createdAfter) {
                        data = data.filter(m =>
                            new Date(m.createdAt) >= new Date(criteria.createdAfter)
                        );
                    }

                    if (criteria.updatedAfter) {
                        data = data.filter(m =>
                            new Date(m.updatedAt) >= new Date(criteria.updatedAfter)
                        );
                    }

                    resolve(data.map(item => MindMap.fromJSON(item)));
                };
                request.onerror = () => reject(new Error('Failed to search mind maps'));
            });
        } catch (error) {
            throw new Error(`Failed to search mind maps: ${error.message}`);
        }
    }

    async clearAll() {
        try {
            await this._initDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error('Failed to clear database'));
            });
        } catch (error) {
            throw new Error(`Failed to clear database: ${error.message}`);
        }
    }
} 