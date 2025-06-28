// Export all infrastructure components
export * from './repositories/interfaces/IMindMapRepository.js';
export * from './repositories/LocalStorageMindMapRepository.js';
export * from './repositories/IndexedDBMindMapRepository.js';
export * from './repositories/APIMindMapRepository.js';
export * from './repositories/RepositoryFactory.js';

export * from './services/StorageService.js';
export * from './services/ExportImportService.js';
export * from './services/ConfigurationService.js';

// Infrastructure setup utility
export class InfrastructureSetup {
    constructor() {
        this.configService = new ConfigurationService();
        this.repositoryFactory = new RepositoryFactory(this.configService);
        this.storageService = new StorageService(this.configService.get('storage.type'));
        this.exportImportService = new ExportImportService();
    }

    async initialize() {
        try {
            // Initialize configuration
            console.log('Initializing infrastructure...');

            // Test storage availability
            await this.storageService.set('test', 'test');
            await this.storageService.remove('test');

            console.log('Infrastructure initialized successfully');
            return true;
        } catch (error) {
            console.error('Infrastructure initialization failed:', error);
            return false;
        }
    }

    getMindMapRepository() {
        return this.repositoryFactory.createMindMapRepository();
    }

    getConfigurationService() {
        return this.configService;
    }

    getStorageService() {
        return this.storageService;
    }

    getExportImportService() {
        return this.exportImportService;
    }
} 