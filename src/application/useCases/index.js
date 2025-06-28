// Export all use cases for easy importing
export * from './mindMapUseCases.js';
export * from './nodeUseCases.js';
export * from './edgeUseCases.js';
export * from './searchUseCases.js';
export * from './importExportUseCases.js';

// Use case factory for dependency injection
export class UseCaseFactory {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    // Mind Map use cases
    createMindMap() { return new CreateMindMapUseCase(this.mindMapRepository); }
    loadMindMap() { return new LoadMindMapUseCase(this.mindMapRepository); }
    saveMindMap() { return new SaveMindMapUseCase(this.mindMapRepository); }
    deleteMindMap() { return new DeleteMindMapUseCase(this.mindMapRepository); }
    listMindMaps() { return new ListMindMapsUseCase(this.mindMapRepository); }
    updateMindMapTitle() { return new UpdateMindMapTitleUseCase(this.mindMapRepository); }

    // Node use cases
    addNode() { return new AddNodeUseCase(this.mindMapRepository); }
    updateNode() { return new UpdateNodeUseCase(this.mindMapRepository); }
    deleteNode() { return new DeleteNodeUseCase(this.mindMapRepository); }
    getNode() { return new GetNodeUseCase(this.mindMapRepository); }
    getNodeChildren() { return new GetNodeChildrenUseCase(this.mindMapRepository); }
    moveNode() { return new MoveNodeUseCase(this.mindMapRepository); }

    // Edge use cases
    connectNodes() { return new ConnectNodesUseCase(this.mindMapRepository); }
    disconnectNodes() { return new DisconnectNodesUseCase(this.mindMapRepository); }
    updateEdge() { return new UpdateEdgeUseCase(this.mindMapRepository); }
    getNodeConnections() { return new GetNodeConnectionsUseCase(this.mindMapRepository); }

    // Search use cases
    searchNodes() { return new SearchNodesUseCase(this.mindMapRepository); }
    getMindMapStatistics() { return new GetMindMapStatisticsUseCase(this.mindMapRepository); }

    // Import/Export use cases
    exportMindMap() { return new ExportMindMapUseCase(this.mindMapRepository); }
    importMindMap() { return new ImportMindMapUseCase(this.mindMapRepository); }
} 