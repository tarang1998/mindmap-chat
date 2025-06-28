export class ExportImportService {
    constructor() {
        this.supportedFormats = ['json', 'txt', 'md', 'csv'];
    }

    async exportToFile(mindMap, format = 'json', filename = null) {
        try {
            let content, mimeType, extension;

            switch (format.toLowerCase()) {
                case 'json':
                    content = JSON.stringify(mindMap.toJSON(), null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;

                case 'txt':
                case 'md':
                    content = this._convertToText(mindMap, format === 'md');
                    mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
                    extension = format;
                    break;

                case 'csv':
                    content = this._convertToCSV(mindMap);
                    mimeType = 'text/csv';
                    extension = 'csv';
                    break;

                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `${mindMap.title || 'mindmap'}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            return { success: true, filename: link.download };
        } catch (error) {
            throw new Error(`Export failed: ${error.message}`);
        }
    }

    async importFromFile(file) {
        try {
            const content = await this._readFile(file);
            const extension = file.name.split('.').pop().toLowerCase();

            let mindMapData;

            switch (extension) {
                case 'json':
                    mindMapData = JSON.parse(content);
                    break;

                case 'txt':
                case 'md':
                    mindMapData = this._parseFromText(content);
                    break;

                case 'csv':
                    mindMapData = this._parseFromCSV(content);
                    break;

                default:
                    throw new Error(`Unsupported file format: ${extension}`);
            }

            return { success: true, mindMapData };
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    _convertToText(mindMap, isMarkdown = false) {
        const lines = [];

        if (isMarkdown) {
            lines.push(`# ${mindMap.title}`, '');
        } else {
            lines.push(`${mindMap.title}`, '');
        }

        const addNodeToText = (nodeId, level = 0) => {
            const node = mindMap.getNode(nodeId);
            if (!node) return;

            const indent = '  '.repeat(level);
            const prefix = isMarkdown ? '#' : '-';
            lines.push(`${indent}${prefix} ${node.content}`);

            node.children.forEach(childId => {
                addNodeToText(childId, level + 1);
            });
        };

        if (mindMap.rootNodeId) {
            addNodeToText(mindMap.rootNodeId);
        }

        return lines.join('\n');
    }

    _convertToCSV(mindMap) {
        const lines = ['id,content,parentId,position.x,position.y,createdAt,updatedAt'];

        mindMap.getAllNodes().forEach(node => {
            const row = [
                node.id,
                `"${node.content.replace(/"/g, '""')}"`,
                node.parentId || '',
                node.position.x,
                node.position.y,
                node.createdAt.toISOString(),
                node.updatedAt.toISOString()
            ];
            lines.push(row.join(','));
        });

        return lines.join('\n');
    }

    _parseFromText(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const mindMapData = {
            id: `imported_${Date.now()}`,
            title: 'Imported Mind Map',
            nodes: [],
            edges: [],
            rootNodeId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {}
        };

        let currentLevel = 0;
        let nodeStack = [];
        let lastNodeId = null;

        lines.forEach((line, index) => {
            if (line.startsWith('# ')) {
                mindMapData.title = line.substring(2);
                return;
            }

            const match = line.match(/^(\s*)[-#] (.+)$/);
            if (!match) return;

            const level = match[1].length / 2;
            const content = match[2];

            const nodeId = `node_${index}`;
            const node = {
                id: nodeId,
                content: content,
                position: { x: level * 100, y: index * 50 },
                parentId: null,
                children: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {}
            };

            mindMapData.nodes.push(node);

            if (level === 0) {
                nodeStack = [nodeId];
                lastNodeId = nodeId;
                if (!mindMapData.rootNodeId) {
                    mindMapData.rootNodeId = nodeId;
                }
            } else {
                while (nodeStack.length > level) {
                    nodeStack.pop();
                }

                if (nodeStack.length > 0) {
                    const parentId = nodeStack[nodeStack.length - 1];
                    node.parentId = parentId;

                    const edge = {
                        id: `edge_${parentId}_${nodeId}`,
                        sourceNodeId: parentId,
                        targetNodeId: nodeId,
                        type: 'default',
                        style: { color: '#666', width: 2, opacity: 1 },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        metadata: {}
                    };

                    mindMapData.edges.push(edge);
                }

                nodeStack.push(nodeId);
                lastNodeId = nodeId;
            }
        });

        return mindMapData;
    }

    _parseFromCSV(content) {
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        const mindMapData = {
            id: `imported_${Date.now()}`,
            title: 'Imported Mind Map',
            nodes: [],
            edges: [],
            rootNodeId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {}
        };

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const values = this._parseCSVLine(line);
            const node = {
                id: values[0],
                content: values[1].replace(/^"|"$/g, '').replace(/""/g, '"'),
                parentId: values[2] || null,
                position: { x: parseFloat(values[3]) || 0, y: parseFloat(values[4]) || 0 },
                children: [],
                createdAt: values[5] || new Date().toISOString(),
                updatedAt: values[6] || new Date().toISOString(),
                metadata: {}
            };

            mindMapData.nodes.push(node);

            if (node.parentId) {
                const edge = {
                    id: `edge_${node.parentId}_${node.id}`,
                    sourceNodeId: node.parentId,
                    targetNodeId: node.id,
                    type: 'default',
                    style: { color: '#666', width: 2, opacity: 1 },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {}
                };

                mindMapData.edges.push(edge);
            } else if (!mindMapData.rootNodeId) {
                mindMapData.rootNodeId = node.id;
            }
        }

        return mindMapData;
    }

    _parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current);
        return values;
    }

    _readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
} 