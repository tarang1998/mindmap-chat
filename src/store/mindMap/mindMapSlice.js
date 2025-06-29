import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MindMap } from '../../domain/entities/MindMap.js';
import { Node } from '../../domain/entities/Node.js';
import { Edge } from '../../domain/entities/Edge.js';
import log from "../../utils/logger.js"
import { getIncomers, getOutgoers, getConnectedEdges } from '@xyflow/react';

// Async thunks for API operations
export const createMindMap = createAsyncThunk(
    'mindMap/createMindMap',
    async ({ id, initial }, { rejectWithValue }) => {
        try {
            // Create a new mind map with the given id
            const mindMap = new MindMap(id, 'Untitled Mind Map');

            const node = Node.create('Node', { x: 250, y: 100 }, null);
            mindMap.addNode(node);

            return mindMap.toJSON();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const loadMindMap = createAsyncThunk(
    'mindMap/loadMindMap',

    async (mindMapId, { rejectWithValue }) => {
        // For now, return null - will be implemented with repository later
        log.debug("minMapSlice", "Retrieving mindmap :", mindMapId)
        return null;
    }
);

export const saveMindMap = createAsyncThunk(
    'mindMap/saveMindMap',
    async (mindMap, { rejectWithValue }) => {
        try {
            // For now, just return the mind map - will be implemented with repository later
            return mindMap;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addNode = createAsyncThunk(
    'mindMap/addNode',
    async ({ content, position, parentId }, { getState, rejectWithValue }) => {
        try {
            const { mindMap } = getState();
            if (!mindMap.currentMindMap) {
                throw new Error('No mind map loaded');
            }

            const node = Node.create(content, position, parentId);
            mindMap.currentMindMap.addNode(node);

            return { node: node.toJSON(), mindMap: mindMap.currentMindMap.toJSON() };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateNode = createAsyncThunk(
    'mindMap/updateNode',
    async ({ nodeId, updates }, { getState, rejectWithValue }) => {
        try {
            const { mindMap } = getState();
            if (!mindMap.currentMindMap) {
                throw new Error('No mind map loaded');
            }

            const node = mindMap.currentMindMap.getNode(nodeId);
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

            if (updates.height !== undefined || updates.width !== undefined) {
                node.updateDimensions(updates.height, updates.width)
            }

            return { node: node.toJSON(), mindMap: mindMap.currentMindMap.toJSON() };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteNode = createAsyncThunk(
    'mindMap/deleteNode',
    async (nodeId, { getState, rejectWithValue }) => {
        try {
            const { mindMap } = getState();
            if (!mindMap.currentMindMap) {
                throw new Error('No mind map loaded');
            }

            const success = mindMap.currentMindMap.removeNode(nodeId);
            if (!success) {
                throw new Error('Node not found');
            }

            return mindMap.currentMindMap.toJSON();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);



export const connectNodes = createAsyncThunk(
    'mindMap/connectNodes',
    async ({ sourceNodeId, targetNodeId, sourceHandleId, targetHandleId, edgeType }, { getState, rejectWithValue }) => {
        try {
            const { mindMap } = getState();
            if (!mindMap.currentMindMap) {
                throw new Error('No mind map loaded');
            }

            const edge = Edge.create(sourceNodeId, targetNodeId, edgeType);
            // Store handle information in the edge
            edge.setHandleIds(sourceHandleId, targetHandleId);
            mindMap.currentMindMap.addEdge(edge);

            return { edge: edge.toJSON(), mindMap: mindMap.currentMindMap.toJSON() };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addNodeWithConnection = createAsyncThunk(
    'mindMap/addNodeWithConnection',
    async ({ content, position, parentId, sourceNodeId, sourceHandleId, handleConfig }, { getState, rejectWithValue }) => {
        try {
            const { mindMap } = getState();
            if (!mindMap.currentMindMap) {
                throw new Error('No mind map loaded');
            }

            // Create the new node
            const node = Node.create(content, position, parentId);

            // Set handle configuration if provided
            if (handleConfig) {
                node.handleConfig = handleConfig;
            }

            mindMap.currentMindMap.addNode(node);

            // Create the edge if sourceNodeId is provided
            let edge = null;
            if (sourceNodeId) {
                edge = Edge.create(sourceNodeId, node.id, 'default');
                // Store handle information in the edge
                edge.setHandleIds(sourceHandleId, `${node.id}-target`);
                mindMap.currentMindMap.addEdge(edge);
            }

            return {
                node: node.toJSON(),
                edge: edge ? edge.toJSON() : null,
                mindMap: mindMap.currentMindMap.toJSON()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const smartDeleteNodes = createAsyncThunk(
    'mindMap/smartDeleteNodes',
    async (nodeIds, { getState, rejectWithValue }) => {
        try {
            const { mindMap } = getState();
            if (!mindMap.currentMindMap) {
                throw new Error('No mind map loaded');
            }

            // Get all nodes and edges as plain arrays
            const nodes = mindMap.currentMindMap.getAllNodes();
            const edges = mindMap.currentMindMap.getAllEdges();

            // Find all nodes to delete
            const nodesToDelete = nodeIds.map(id => mindMap.currentMindMap.getNode(id)).filter(Boolean);
            if (nodesToDelete.length === 0) throw new Error('No valid nodes to delete');

            // Collect all edges that will be affected
            const edgesToRemove = new Set();
            const newEdgesToCreate = [];


            // For each node to delete, find its connections and plan the reconnections
            nodesToDelete.forEach(node => {
                const incomers = getIncomers(node, nodes, edges);
                const outgoers = getOutgoers(node, nodes, edges);
                const connectedEdges = getConnectedEdges([node], edges);

                console.log(incomers, outgoers, connectedEdges)

                // Mark edges for removal
                connectedEdges.forEach(edge => edgesToRemove.add(edge.id));

                // Plan new connections from incomers to outgoers
                incomers.forEach(sourceNode => {
                    // Only create connections if source is not being deleted
                    if (!nodeIds.includes(sourceNode.id)) {
                        outgoers.forEach(targetNode => {
                            // Only create connections if target is not being deleted
                            if (!nodeIds.includes(targetNode.id)) {
                                newEdgesToCreate.push({
                                    sourceId: sourceNode.id,
                                    targetId: targetNode.id
                                });
                            }
                        });
                    }
                });
            });

            // Remove all affected edges
            edgesToRemove.forEach(edgeId => {
                mindMap.currentMindMap.edges.delete(edgeId);
            });

            console.log(nodes, edges, nodesToDelete, edgesToRemove, newEdgesToCreate)

            // Create new edges
            newEdgesToCreate.forEach(({ sourceId, targetId }) => {
                const newEdge = Edge.create(sourceId, targetId, 'default');
                mindMap.currentMindMap.addEdge(newEdge);
            });

            // Remove all nodes
            nodeIds.forEach(nodeId => {
                mindMap.currentMindMap.removeNode(nodeId);
            });

            return mindMap.currentMindMap.toJSON();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteEdge = createAsyncThunk(
    'mindMap/deleteEdge',
    async (edgeId, { getState, rejectWithValue }) => {
        try {
            const { mindMap } = getState();
            if (!mindMap.currentMindMap) {
                throw new Error('No mind map loaded');
            }

            const success = mindMap.currentMindMap.removeEdge(edgeId);
            if (!success) {
                throw new Error('Edge not found');
            }

            return mindMap.currentMindMap.toJSON();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const mindMapSlice = createSlice({
    name: 'mindMap',
    initialState: {
        currentMindMap: null,
        mindMaps: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        loading: false,
        error: null,
        lastSaved: null,
        hasUnsavedChanges: false
    },
    reducers: {
        setCurrentMindMap: (state, action) => {
            state.currentMindMap = action.payload ? MindMap.fromJSON(action.payload) : null;
            state.hasUnsavedChanges = false;
        },
        setSelectedNode: (state, action) => {
            state.selectedNodeId = action.payload;
            state.selectedEdgeId = null;
        },
        setSelectedEdge: (state, action) => {
            state.selectedEdgeId = action.payload;
            state.selectedNodeId = null;
        },
        clearSelection: (state) => {
            state.selectedNodeId = null;
            state.selectedEdgeId = null;
        },
        setHasUnsavedChanges: (state, action) => {
            state.hasUnsavedChanges = action.payload;
        },
        updateNodePosition: (state, action) => {
            const { nodeId, position } = action.payload;
            if (state.currentMindMap) {
                const node = state.currentMindMap.getNode(nodeId);
                if (node) {
                    node.updatePosition(position);
                    state.hasUnsavedChanges = true;
                }
            }
        },
        updateNodeContent: (state, action) => {
            const { nodeId, content } = action.payload;
            if (state.currentMindMap) {
                const node = state.currentMindMap.getNode(nodeId);
                if (node) {
                    node.updateContent(content);
                    state.hasUnsavedChanges = true;
                }
            }
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create MindMap
            .addCase(createMindMap.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createMindMap.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload ? MindMap.fromJSON(action.payload) : null;
                state.hasUnsavedChanges = false;
                state.lastSaved = new Date().toISOString();
            })
            .addCase(createMindMap.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Load MindMap
            .addCase(loadMindMap.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadMindMap.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload ? MindMap.fromJSON(action.payload) : null;
                state.hasUnsavedChanges = false;
                state.lastSaved = new Date().toISOString();
            })
            .addCase(loadMindMap.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Save MindMap
            .addCase(saveMindMap.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveMindMap.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload ? MindMap.fromJSON(action.payload) : null;
                state.hasUnsavedChanges = false;
                state.lastSaved = new Date().toISOString();
            })
            .addCase(saveMindMap.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Add Node
            .addCase(addNode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addNode.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload.mindMap ? MindMap.fromJSON(action.payload.mindMap) : null;
                state.selectedNodeId = action.payload.node.id;
                state.hasUnsavedChanges = true;
            })
            .addCase(addNode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Node
            .addCase(updateNode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateNode.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload.mindMap ? MindMap.fromJSON(action.payload.mindMap) : null;
                state.hasUnsavedChanges = true;
            })
            .addCase(updateNode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Node
            .addCase(deleteNode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteNode.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload ? MindMap.fromJSON(action.payload) : null;
                state.selectedNodeId = null;
                state.hasUnsavedChanges = true;
            })
            .addCase(deleteNode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })


            // Connect Nodes
            .addCase(connectNodes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(connectNodes.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload.mindMap ? MindMap.fromJSON(action.payload.mindMap) : null;
                state.selectedEdgeId = action.payload.edge.id;
                state.hasUnsavedChanges = true;
            })
            .addCase(connectNodes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Add Node with Connection
            .addCase(addNodeWithConnection.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addNodeWithConnection.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload.mindMap ? MindMap.fromJSON(action.payload.mindMap) : null;
                state.selectedNodeId = action.payload.node.id;
                state.selectedEdgeId = action.payload.edge?.id || null;
                state.hasUnsavedChanges = true;
            })
            .addCase(addNodeWithConnection.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Smart Delete Multiple Nodes
            .addCase(smartDeleteNodes.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload ? MindMap.fromJSON(action.payload) : null;
                state.selectedNodeId = null;
                state.hasUnsavedChanges = true;
            })
            .addCase(smartDeleteNodes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Edge
            .addCase(deleteEdge.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMindMap = action.payload ? MindMap.fromJSON(action.payload) : null;
                state.selectedEdgeId = null;
                state.hasUnsavedChanges = true;
            })
            .addCase(deleteEdge.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const {
    setCurrentMindMap,
    setSelectedNode,
    setSelectedEdge,
    clearSelection,
    setHasUnsavedChanges,
    updateNodePosition,
    updateNodeContent,
    clearError
} = mindMapSlice.actions;

export default mindMapSlice.reducer; 