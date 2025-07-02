export class Node {
    constructor(id, isRoot, content, position = { x: 0, y: 0 }, parentId = null) {
        this.id = id;
        this.isRoot = isRoot;
        this.content = content || '';
        this.position = position;
        this.parentId = parentId;
        this.children = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.metadata = {};
        this.height = 75
        this.width = 150
        this.handleConfig = null; // Store handle configuration
    }

    // Business logic methods
    addChild(childId) {
        if (!this.children.includes(childId)) {
            this.children.push(childId);
            this.updatedAt = new Date();
        }
    }

    removeChild(childId) {
        const index = this.children.indexOf(childId);
        if (index > -1) {
            this.children.splice(index, 1);
            this.updatedAt = new Date();
        }
    }

    updateContent(newContent) {
        this.content = newContent || '';
        this.updatedAt = new Date();
    }

    updateDimensions(height, width) {
        this.height = height ?? this.height
        this.width = width ?? this.width
        this.updatedAt = new Date();
    }

    updatePosition(newPosition) {
        this.position = { ...this.position, ...newPosition };
        this.updatedAt = new Date();
    }

    setParent(newParentId) {
        this.parentId = newParentId;
        this.updatedAt = new Date();
    }

    // Set handle configuration
    setHandleConfig(handleConfig) {
        this.handleConfig = handleConfig;
        this.updatedAt = new Date();
    }

    addMetadata(key, value) {
        this.metadata[key] = value;
        this.updatedAt = new Date();
    }

    // Validation methods
    isValid() {
        return this.id && this.content && typeof this.content === 'string' && this.content.trim().length > 0;
    }

    // Factory method
    static create(isRoot = false, content, position = { x: 0, y: 0 }, parentId = null) {
        const id = crypto.randomUUID();
        return new Node(id, isRoot, content, position, parentId);
    }

    // Serialization
    toJSON() {
        return {
            id: this.id,
            isRoot: this.isRoot,
            content: this.content,
            position: this.position,
            parentId: this.parentId,
            children: this.children,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            metadata: this.metadata,
            height: this.height,
            width: this.width,
            handleConfig: this.handleConfig
        };
    }

    static fromJSON(data) {
        const node = new Node(data.id, data.isRoot, data.content, data.position, data.parentId);
        node.children = data.children || [];
        node.createdAt = new Date(data.createdAt);
        node.updatedAt = new Date(data.updatedAt);
        node.metadata = data.metadata || {};
        node.height = data.height
        node.width = data.width
        node.handleConfig = data.handleConfig
        return node;
    }
} 