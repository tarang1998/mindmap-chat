import { Node } from './Node.js';
import { Edge } from './Edge.js';

export class MindMap {
    constructor(id, title = 'Untitled Mind Map') {
        this.id = id;
        this.title = title;
        this.nodes = new Map(); // id -> Node
        this.edges = new Map(); // id -> Edge
        this.rootNodeId = null;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.metadata = {};
    }

    // Node operations
    addNode(node) {
        if (!(node instanceof Node)) {
            throw new Error('Invalid node object');
        }

        if (!node.isValid()) {
            throw new Error('Invalid node data');
        }

        this.nodes.set(node.id, node);
        this.updatedAt = new Date();

        // Set as root if it's the first node
        if (this.nodes.size === 1) {
            this.rootNodeId = node.id;
        }

        return node;
    }

    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return false;

        // Remove all edges connected to this node
        const edgesToRemove = [];
        for (const [edgeId, edge] of this.edges) {
            if (edge.connectsTo(nodeId)) {
                edgesToRemove.push(edgeId);
            }
        }
        edgesToRemove.forEach(edgeId => this.edges.delete(edgeId));

        // Set parentId to null for all child nodes of this node
        for (const [childNodeId, childNode] of this.nodes) {
            if (childNode.parentId === nodeId) {
                childNode.setParent(null);
            }
        }

        // Remove node from parent's children
        if (node.parentId) {
            const parent = this.nodes.get(node.parentId);
            if (parent) {
                parent.removeChild(nodeId);
            }
        }

        // Remove node
        this.nodes.delete(nodeId);
        this.updatedAt = new Date();

        // Update root if necessary
        if (this.rootNodeId === nodeId) {
            this.rootNodeId = this.nodes.size > 0 ? Array.from(this.nodes.keys())[0] : null;
        }

        return true;
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    // Edge operations
    addEdge(edge) {
        if (!(edge instanceof Edge)) {
            throw new Error('Invalid edge object');
        }

        if (!edge.isValid()) {
            throw new Error('Invalid edge data');
        }

        // Check if nodes exist
        if (!this.nodes.has(edge.sourceNodeId) || !this.nodes.has(edge.targetNodeId)) {
            throw new Error('Edge connects to non-existent nodes');
        }

        this.edges.set(edge.id, edge);
        this.updatedAt = new Date();

        // Update parent-child relationship
        const sourceNode = this.nodes.get(edge.sourceNodeId);
        const targetNode = this.nodes.get(edge.targetNodeId);

        sourceNode.addChild(edge.targetNodeId);
        targetNode.setParent(edge.sourceNodeId);

        return edge;
    }

    removeEdge(edgeId) {
        const edge = this.edges.get(edgeId);
        if (!edge) return false;

        // Remove parent-child relationship
        const sourceNode = this.nodes.get(edge.sourceNodeId);
        const targetNode = this.nodes.get(edge.targetNodeId);

        if (sourceNode) {
            sourceNode.removeChild(edge.targetNodeId);
        }
        if (targetNode) {
            targetNode.setParent(null);
        }

        this.edges.delete(edgeId);
        this.updatedAt = new Date();
        return true;
    }

    getEdge(edgeId) {
        return this.edges.get(edgeId);
    }

    getAllEdges() {
        return Array.from(this.edges.values());
    }

    // Query methods
    getChildren(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return [];

        return node.children.map(childId => this.nodes.get(childId)).filter(Boolean);
    }

    getParent(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node || !node.parentId) return null;

        return this.nodes.get(node.parentId);
    }

    getConnectedEdges(nodeId) {
        return Array.from(this.edges.values()).filter(edge => edge.connectsTo(nodeId));
    }

    // Validation
    isValid() {
        return this.id && this.title && this.nodes.size >= 0;
    }

    // Factory method
    static create(title = 'Untitled Mind Map') {
        const id = crypto.randomUUID();
        return new MindMap(id, title);
    }

    // Serialization
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            nodes: Array.from(this.nodes.values()).map(node => node.toJSON()),
            edges: Array.from(this.edges.values()).map(edge => edge.toJSON()),
            rootNodeId: this.rootNodeId,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            metadata: this.metadata
        };
    }

    static fromJSON(data) {
        const mindMap = new MindMap(data.id, data.title);
        mindMap.rootNodeId = data.rootNodeId;
        mindMap.createdAt = new Date(data.createdAt);
        mindMap.updatedAt = new Date(data.updatedAt);
        mindMap.metadata = data.metadata || {};

        // First reconstruct edges to compute children data
        data.edges.forEach(edgeData => {
            const edge = Edge.fromJSON(edgeData);
            mindMap.edges.set(edge.id, edge);
        });

        // Compute children data from edges
        const childrenMap = new Map(); // nodeId -> array of child nodeIds
        mindMap.edges.forEach(edge => {
            const sourceNodeId = edge.sourceNodeId;
            const targetNodeId = edge.targetNodeId;

            if (!childrenMap.has(sourceNodeId)) {
                childrenMap.set(sourceNodeId, []);
            }
            childrenMap.get(sourceNodeId).push(targetNodeId);
        });

        // Reconstruct nodes with computed children data
        data.nodes.forEach(nodeData => {
            // Add computed children data to nodeData
            const children = childrenMap.get(nodeData.id) || [];
            const nodeWithChildren = { ...nodeData, children };

            const node = Node.fromJSON(nodeWithChildren);
            mindMap.nodes.set(node.id, node);
        });

        return mindMap;
    }
} 