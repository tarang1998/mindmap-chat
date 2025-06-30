export class ExportMindMapUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(mindMapId, format = 'json') {
        try {
            const mindMap = await this.mindMapRepository.findById(mindMapId);
            if (!mindMap) {
                throw new Error('Mind map not found');
            }

            switch (format.toLowerCase()) {
                case 'json':
                    return { success: true, data: mindMap.toJSON(), format: 'json' };
                case 'text':
                    return { success: true, data: this.convertToText(mindMap), format: 'text' };
                default:
                    throw new Error('Unsupported export format');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    convertToText(mindMap) {
        const lines = [`# ${mindMap.title}`, ''];

        const addNodeToText = (nodeId, level = 0) => {
            const node = mindMap.getNode(nodeId);
            if (!node) return;

            const indent = '  '.repeat(level);
            lines.push(`${indent}- ${node.content}`);

            node.children.forEach(childId => {
                addNodeToText(childId, level + 1);
            });
        };

        if (mindMap.rootNodeId) {
            addNodeToText(mindMap.rootNodeId);
        }

        return lines.join('\n');
    }
}

export class ImportMindMapUseCase {
    constructor(mindMapRepository) {
        this.mindMapRepository = mindMapRepository;
    }

    async execute(data, format = 'json') {
        try {
            let mindMap;

            switch (format.toLowerCase()) {
                case 'json':
                    mindMap = MindMap.fromJSON(data);
                    break;
                case 'text':
                    mindMap = this.convertFromText(data);
                    break;
                default:
                    throw new Error('Unsupported import format');
            }

            const savedMindMap = await this.mindMapRepository.save(mindMap);
            return { success: true, mindMap: savedMindMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    convertFromText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const mindMap = MindMap.create('Imported Mind Map');

        let currentLevel = 0;
        let nodeStack = [];
        let lastNodeId = null;

        lines.forEach(line => {
            if (line.startsWith('# ')) {
                mindMap.title = line.substring(2);
                return;
            }

            const match = line.match(/^(\s*)- (.+)$/);
            if (!match) return;

            const level = match[1].length / 2;
            const content = match[2];

            const node = Node.create(false, content);
            mindMap.addNode(node);

            if (level === 0) {
                nodeStack = [node.id];
                lastNodeId = node.id;
            } else {
                while (nodeStack.length > level) {
                    nodeStack.pop();
                }

                if (nodeStack.length > 0) {
                    const parentId = nodeStack[nodeStack.length - 1];
                    const edge = Edge.create(parentId, node.id);
                    mindMap.addEdge(edge);
                }

                nodeStack.push(node.id);
                lastNodeId = node.id;
            }
        });

        return mindMap;
    }
} 