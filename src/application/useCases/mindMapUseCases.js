import { MindMap } from '../../domain/entities/MindMap.js';

export class CreateMindMapUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(title = 'Untitled Mind Map') {
        try {
            const mindMap = MindMap.create(title);
            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class LoadMindMapUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }
            return { success: true, mindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class SaveMindMapUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMap) {
        try {
            if (!mindMap.isValid()) {
                throw new Error('Invalid mind map data');
            }

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class DeleteMindMapUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId) {
        try {
            await this.mindMapRepository.delete(mindMapId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class ListMindMapsUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute() {
        try {
            const mindMaps = await this.mindMapRepository.findAll();
            return { success: true, mindMaps };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export class UpdateMindMapTitleUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, newTitle) {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            mindMap.title = newTitle;
            mindMap.updatedAt = new Date();

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
} 