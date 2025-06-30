import { Node } from '../../domain/entities/Node.js';

export class AddNodeUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, content, position = { x: 0, y: 0 }, parentId = null) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const node = Node.create(false, content, position, parentId);
            mindMap.addNode(node);

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, node, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class UpdateNodeUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, nodeId, updates) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const node = mindMap.getNode(nodeId);
            if (!node) {
                throw new Error('Node not found');
            }

            // Apply updates
            if (updates.content !== undefined) {
                node.updateContent(updates.content);
            }

            if (updates.position !== undefined) {
                node.updatePosition(updates.position);
            }

            if (updates.parentId !== undefined) {
                node.setParent(updates.parentId);
            }

            if (updates.metadata !== undefined) {
                Object.entries(updates.metadata).forEach(([key, value]) => {
                    node.addMetadata(key, value);
                });
            }

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, node, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class DeleteNodeUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, nodeId) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const success = mindMap.removeNode(nodeId);
            if (!success) {
                throw new Error('Node not found');
            }

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class GetNodeUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, nodeId) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const node = mindMap.getNode(nodeId);
            if (!node) {
                throw new Error('Node not found');
            }

            return { success: true, node };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class GetNodeChildrenUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, nodeId) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const children = mindMap.getChildren(nodeId);
            return { success: true, children };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class MoveNodeUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, nodeId, newParentId) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const node = mindMap.getNode(nodeId);
            if (!node) {
                throw new Error('Node not found');
            }

            // Check if new parent exists
            if (newParentId && !mindMap.getNode(newParentId)) {
                throw new Error('New parent node not found');
            }

            // Remove from old parent
            if (node.parentId) {
                const oldParent = mindMap.getNode(node.parentId);
                if (oldParent) {
                    oldParent.removeChild(nodeId);
                }
            }

            // Add to new parent
            node.setParent(newParentId);
            if (newParentId) {
                const newParent = mindMap.getNode(newParentId);
                newParent.addChild(nodeId);
            }

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, node, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
} 