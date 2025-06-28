import { IMindMapRepository } from './interfaces/IMindMapRepository.js';
import { MindMap } from '../../domain/entities/MindMap.js';

export class APIMindMapRepository extends IMindMapRepository {
    constructor(baseURL = '/api/mindmaps', apiClient = null) {
        super();
        this.baseURL = baseURL;
        this.apiClient = apiClient || this._createDefaultAPIClient();
    }

    _createDefaultAPIClient() {
        return {
            async request(endpoint, options = {}) {
                const url = `${this.baseURL}${endpoint}`;
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                };

                try {
                    const response = await fetch(url, config);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return await response.json();
                } catch (error) {
                    throw new Error(`API request failed: ${error.message}`);
                }
            }
        };
    }

    async save(mindMap) {
        try {
            const mindMapData = mindMap.toJSON();
            const isNew = !mindMap.id || mindMap.id.startsWith('temp_');

            let response;
            if (isNew) {
                response = await this.apiClient.request('', {
                    method: 'POST',
                    body: JSON.stringify(mindMapData)
                });
            } else {
                response = await this.apiClient.request(`/${mindMap.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(mindMapData)
                });
            }

            return MindMap.fromJSON(response);
        } catch (error) {
            throw new Error(`Failed to save mind map: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            const response = await this.apiClient.request(`/${id}`, {
                method: 'GET'
            });

            return MindMap.fromJSON(response);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw new Error(`Failed to find mind map: ${error.message}`);
        }
    }

    async findAll() {
        try {
            const response = await this.apiClient.request('', {
                method: 'GET'
            });

            return response.map(data => MindMap.fromJSON(data));
        } catch (error) {
            throw new Error(`Failed to load mind maps: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            await this.apiClient.request(`/${id}`, {
                method: 'DELETE'
            });
            return true;
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
            const queryParams = new URLSearchParams();

            if (criteria.title) queryParams.append('title', criteria.title);
            if (criteria.createdAfter) queryParams.append('createdAfter', criteria.createdAfter);
            if (criteria.updatedAfter) queryParams.append('updatedAfter', criteria.updatedAfter);

            const queryString = queryParams.toString();
            const endpoint = queryString ? `?${queryString}` : '';

            const response = await this.apiClient.request(endpoint, {
                method: 'GET'
            });

            return response.map(data => MindMap.fromJSON(data));
        } catch (error) {
            throw new Error(`Failed to search mind maps: ${error.message}`);
        }
    }
} 