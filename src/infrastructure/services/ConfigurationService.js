export class ConfigurationService {
    constructor() {
        this.config = this._loadDefaultConfig();
        this._loadUserConfig();
    }

    _loadDefaultConfig() {
        return {
            storage: {
                type: 'localStorage', // 'localStorage', 'indexedDB', 'api'
                key: 'mindmaps',
                maxSize: 50 * 1024 * 1024 // 50MB
            },
            api: {
                baseURL: '/api/mindmaps',
                timeout: 30000,
                retryAttempts: 3
            },
            ui: {
                theme: 'light', // 'light', 'dark', 'auto'
                language: 'en',
                autoSave: true,
                autoSaveInterval: 30000 // 30 seconds
            },
            mindmap: {
                defaultNodeStyle: {
                    backgroundColor: '#ffffff',
                    textColor: '#333333',
                    borderColor: '#cccccc',
                    borderWidth: 1,
                    borderRadius: 8,
                    fontSize: '14px',
                    fontFamily: 'Arial, sans-serif'
                },
                defaultEdgeStyle: {
                    color: '#666666',
                    width: 2,
                    opacity: 1,
                    type: 'solid'
                },
                layout: {
                    spacing: 100,
                    direction: 'horizontal' // 'horizontal', 'vertical', 'radial'
                }
            },
            features: {
                search: true,
                export: true,
                import: true,
                collaboration: false,
                versioning: false
            }
        };
    }

    _loadUserConfig() {
        try {
            const userConfig = localStorage.getItem('mindmap_config');
            if (userConfig) {
                const parsed = JSON.parse(userConfig);
                this.config = this._deepMerge(this.config, parsed);
            }
        } catch (error) {
            console.warn('Failed to load user configuration:', error);
        }
    }

    _deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    get(key) {
        const keys = key.split('.');
        let value = this.config;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return value;
    }

    set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let current = this.config;

        for (const k of keys) {
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }

        current[lastKey] = value;
        this._saveUserConfig();
    }

    _saveUserConfig() {
        try {
            localStorage.setItem('mindmap_config', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Failed to save user configuration:', error);
        }
    }

    reset() {
        this.config = this._loadDefaultConfig();
        localStorage.removeItem('mindmap_config');
    }

    getAll() {
        return { ...this.config };
    }
} 