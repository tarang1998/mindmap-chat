export class Edge {
    constructor(id, sourceNodeId, targetNodeId, type = 'default') {
        this.id = id;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.type = type; // 'default', 'dashed', 'dotted', etc.
        this.sourceHandleId = null; // Store the source handle ID
        this.targetHandleId = null; // Store the target handle ID
        this.style = {
            color: '#666',
            width: 2,
            opacity: 1
        };
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.metadata = {};
    }

    // Business logic methods
    updateStyle(newStyle) {
        this.style = { ...this.style, ...newStyle };
        this.updatedAt = new Date();
    }

    updateType(newType) {
        this.type = newType;
        this.updatedAt = new Date();
    }

    // Set handle information
    setHandleIds(sourceHandleId, targetHandleId) {
        this.sourceHandleId = sourceHandleId;
        this.targetHandleId = targetHandleId;
        this.updatedAt = new Date();
    }

    addMetadata(key, value) {
        this.metadata[key] = value;
        this.updatedAt = new Date();
    }

    // Validation methods
    isValid() {
        return this.id && this.sourceNodeId && this.targetNodeId &&
            this.sourceNodeId !== this.targetNodeId;
    }

    // Check if edge connects to a specific node
    connectsTo(nodeId) {
        return this.sourceNodeId === nodeId || this.targetNodeId === nodeId;
    }

    // Get the other node connected to this edge
    getOtherNode(nodeId) {
        if (this.sourceNodeId === nodeId) return this.targetNodeId;
        if (this.targetNodeId === nodeId) return this.sourceNodeId;
        return null;
    }

    // Factory method
    static create(sourceNodeId, targetNodeId, type = 'default') {
        const id = crypto.randomUUID();
        return new Edge(id, sourceNodeId, targetNodeId, type);
    }

    // Serialization
    toJSON() {
        return {
            id: this.id,
            sourceNodeId: this.sourceNodeId,
            targetNodeId: this.targetNodeId,
            type: this.type,
            sourceHandleId: this.sourceHandleId,
            targetHandleId: this.targetHandleId,
            style: this.style,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            metadata: this.metadata
        };
    }

    static fromJSON(data) {
        const edge = new Edge(data.id, data.sourceNodeId, data.targetNodeId, data.type);
        edge.sourceHandleId = data.sourceHandleId || null;
        edge.targetHandleId = data.targetHandleId || null;
        edge.style = data.style || { color: '#666', width: 2, opacity: 1 };
        edge.createdAt = new Date(data.createdAt);
        edge.updatedAt = new Date(data.updatedAt);
        edge.metadata = data.metadata || {};
        return edge;
    }
} 