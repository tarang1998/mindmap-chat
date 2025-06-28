export class SearchNodesUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, searchTerm) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const allNodes = mindMap.getAllNodes();
            const searchResults = allNodes.filter(node =>
                node.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return { success: true, results: searchResults };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class GetMindMapStatisticsUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            const statistics = {
                totalNodes: mindMap.nodes.size,
                totalEdges: mindMap.edges.size,
                rootNodeId: mindMap.rootNodeId,
                createdAt: mindMap.createdAt,
                updatedAt: mindMap.updatedAt,
                nodeDepth: this.calculateNodeDepth(mindMap),
                averageChildrenPerNode: this.calculateAverageChildren(mindMap)
            };

            return { success: true, statistics };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    calculateNodeDepth(mindMap) {
        const depths = new Map();

        const calculateDepth = (nodeId, depth = 0) => {
            if (depths.has(nodeId)) return depths.get(nodeId);

            const node = mindMap.getNode(nodeId);
            if (!node) return 0;

            if (!node.parentId) {
                depths.set(nodeId, depth);
                return depth;
            }

            const parentDepth = calculateDepth(node.parentId, depth + 1);
            depths.set(nodeId, parentDepth);
            return parentDepth;
        };

        mindMap.getAllNodes().forEach(node => {
            calculateDepth(node.id);
        });

        return Math.max(...depths.values());
    }

    calculateAverageChildren(mindMap) {
        const nodes = mindMap.getAllNodes();
        if (nodes.length === 0) return 0;

        const totalChildren = nodes.reduce((sum, node) => sum + node.children.length, 0);
        return totalChildren / nodes.length;
    }
} 