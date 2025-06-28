// Type definitions for better code documentation and IDE support

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} NodeStyle
 * @property {string} backgroundColor - Background color
 * @property {string} textColor - Text color
 * @property {string} borderColor - Border color
 * @property {number} borderWidth - Border width
 * @property {number} borderRadius - Border radius
 * @property {string} fontSize - Font size
 * @property {string} fontFamily - Font family
 */

/**
 * @typedef {Object} EdgeStyle
 * @property {string} color - Line color
 * @property {number} width - Line width
 * @property {number} opacity - Line opacity
 * @property {string} type - Line type ('solid', 'dashed', 'dotted')
 */

/**
 * @typedef {Object} MindMapMetadata
 * @property {string} description - Mind map description
 * @property {string} author - Author name
 * @property {string} version - Version number
 * @property {Array<string>} tags - Tags for categorization
 */

// Export types for use in other modules
export const TYPES = {
    Position: 'Position',
    NodeStyle: 'NodeStyle',
    EdgeStyle: 'EdgeStyle',
    MindMapMetadata: 'MindMapMetadata'
}; 