import { Edge } from '../../domain/entities/Edge.js';

export class ConnectNodesUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, sourceNodeId, targetNodeId, edgeType = 'default') {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            // Check if nodes exist
            if (!mindMap.getNode(sourceNodeId) || !mindMap.getNode(targetNodeId)) {
                throw new Error('Source or target node not found');
            }

            // Check if connection already exists
            const existingEdges = mindMap.getAllEdges();
            const connectionExists = existingEdges.some(edge =>
                (edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId) ||
                (edge.sourceNodeId === targetNodeId && edge.targetNodeId === sourceNodeId)
            );

            if (connectionExists) {
                throw new Error('Connection already exists between these nodes');
            }

            const edge = Edge.create(sourceNodeId, targetNodeId, edgeType);
            mindMap.addEdge(edge);

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, edge, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class DisconnectNodesUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, sourceNodeId, targetNodeId) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const edges = mindMap.getAllEdges();
            const edgeToRemove = edges.find(edge =>
                (edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId) ||
                (edge.sourceNodeId === targetNodeId && edge.targetNodeId === sourceNodeId)
            );

            if (!edgeToRemove) {
                throw new Error('No connection found between these nodes');
            }

            mindMap.removeEdge(edgeToRemove.id);

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class UpdateEdgeUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, edgeId, updates) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const edge = mindMap.getEdge(edgeId);
            if (!edge) {
                throw new Error('Edge not found');
            }

            // Apply updates
            if (updates.style !== undefined) {
                edge.updateStyle(updates.style);
            }

            if (updates.type !== undefined) {
                edge.updateType(updates.type);
            }

            if (updates.metadata !== undefined) {
                Object.entries(updates.metadata).forEach(([key, value]) => {
                    edge.addMetadata(key, value);
                });
            }

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, edge, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class GetNodeConnectionsUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, nodeId) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const connections = mindMap.getConnectedEdges(nodeId);
            return { success: true, connections };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
} 