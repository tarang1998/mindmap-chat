import { LocalStorageMindMapRepository } from './LocalStorageMindMapRepository.js';
import { IndexedDBMindMapRepository } from './IndexedDBMindMapRepository.js';
import { APIMindMapRepository } from './APIMindMapRepository.js';

export class RepositoryFactory {
    constructor(configService) {
        this.configService = configService;
    }

    createMindMapRepository() {
        const storageType = this.configService.get('storage.type');

        switch (storageType) {
            case 'localStorage':
                return new LocalStorageMindMapRepository(
                    this.configService.get('storage.key')
                );

            case 'indexedDB':
                return new IndexedDBMindMapRepository(
                    this.configService.get('storage.dbName') || 'MindMapDB',
                    this.configService.get('storage.version') || 1
                );

            case 'api':
                return new APIMindMapRepository(
                    this.configService.get('api.baseURL'),
                    this._createAPIClient()
                );

            default:
                throw new Error(`Unsupported storage type: ${storageType}`);
        }
    }

    _createAPIClient() {
        const baseURL = this.configService.get('api.baseURL');
        const timeout = this.configService.get('api.timeout');
        const retryAttempts = this.configService.get('api.retryAttempts');

        return {
            async request(endpoint, options = {}) {
                const url = `${baseURL}${endpoint}`;
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                };

                let lastError;

                for (let attempt = 0; attempt <= retryAttempts; attempt++) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), timeout);

                        const response = await fetch(url, {
                            ...config,
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        return await response.json();
                    } catch (error) {
                        lastError = error;

                        if (attempt === retryAttempts) {
                            throw error;
                        }

                        // Wait before retrying (exponential backoff)
                        await new Promise(resolve =>
                            setTimeout(resolve, Math.pow(2, attempt) * 1000)
                        );
                    }
                }
            }
        };
    }
} 