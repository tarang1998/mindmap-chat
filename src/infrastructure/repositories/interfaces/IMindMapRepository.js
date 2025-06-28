/**
 * Interface for MindMap repository operations
 * This defines the contract that all MindMap repositories must implement
 */
export class IMindMapRepository {
    /**
     * Save a mind map
     * @param {MindMap} mindMap - The mind map to save
     * @returns {Promise<MindMap>} The saved mind map
     */
    async save(mindMap) {
        throw new Error('save method must be implemented');
    }

    /**
     * Find a mind map by ID
     * @param {string} id - The mind map ID
     * @returns {Promise<MindMap|null>} The mind map or null if not found
     */
    async findById(id) {
        throw new Error('findById method must be implemented');
    }

    /**
     * Find all mind maps
     * @returns {Promise<MindMap[]>} Array of all mind maps
     */
    async findAll() {
        throw new Error('findAll method must be implemented');
    }

    /**
     * Delete a mind map by ID
     * @param {string} id - The mind map ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        throw new Error('delete method must be implemented');
    }

    /**
     * Check if a mind map exists
     * @param {string} id - The mind map ID
     * @returns {Promise<boolean>} True if exists, false otherwise
     */
    async exists(id) {
        throw new Error('exists method must be implemented');
    }

    /**
     * Get mind maps by search criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<MindMap[]>} Array of matching mind maps
     */
    async findByCriteria(criteria) {
        throw new Error('findByCriteria method must be implemented');
    }
} 