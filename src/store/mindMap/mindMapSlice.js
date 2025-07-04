import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MindMap } from '../../domain/entities/MindMap.js';
import { Node } from '../../domain/entities/Node.js';
import { Edge } from '../../domain/entities/Edge.js';
import log from "../../utils/logger.js"
import { getIncomers, getOutgoers, getConnectedEdges } from '@xyflow/react';
import { supabase } from '../../utils/supabase.js';


export const fetchAllMindMaps = createAsyncThunk(
    'mindMap/fetchAllMindMaps',
    async (_, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase.from('mindmaps').select('*').order('updated_at', { ascending: false });
            if (error) {
                return rejectWithValue(error.message);
            }
            return data || [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateMindMapTitle = createAsyncThunk(
    'mindMap/updateMindMapTitle',
    async ({ mindMapId, newTitle }, { rejectWithValue }) => {
        try {
            log.debug('Updating mindmap title:', { mindMapId, newTitle });

            // Update in Supabase
            const { data, error } = await supabase
                .from('mindmaps')
                .update({
                    title: newTitle,
                    updated_at: new Date().toISOString()
                })
                .eq('id', mindMapId)
                .select();

            if (error) {
                log.error('Supabase mindmap title update error:', error);
                throw new Error(`Failed to update mindmap title: ${error.message}`);
            }

            log.debug('Mindmap title updated successfully:', data);
            return { mindMapId, newTitle, updatedMindMap: data[0] };
        } catch (error) {
            log.error('updateMindMapTitle error:', error);
            return rejectWithValue(error.message);
        }
    }
);

export const deleteMindMap = createAsyncThunk(
    'mindMap/deleteMindMap',
    async (mindMapId, { rejectWithValue }) => {
        try {
            log.debug('Deleting mindmap:', mindMapId);

            // Delete from Supabase (nodes and edges will be deleted automatically via cascade)
            const { error } = await supabase
                .from('mindmaps')
                .delete()
                .eq('id', mindMapId);

            if (error) {
                log.error('Supabase mindmap delete error:', error);
                throw new Error(`Failed to delete mindmap: ${error.message}`);
            }

            log.debug('Mindmap deleted successfully');
            return mindMapId;
        } catch (error) {
            log.error('deleteMindMap error:', error);
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for API operations
export const createMindMap = createAsyncThunk(
    'mindMap/createMindMap',
    async ({ id, initial }, { rejectWithValue }) => {
        try {
            // Create a new mind map with the given id
            const mindMap = new MindMap(id, 'Untitled Mind Map');

            const node = Node.create(true, 'Root', { x: 250, y: 100 }, null);
            node.setHandleConfig([
                { id: `${node.id}-source-left`, type: 'source', position: 'left' },
                { id: `${node.id}-source-right`, type: 'source', position: 'right' },])
            mindMap.addNode(node);

            // --- Supabase upsert mindmap ---
            try {
                const mindmapData = {
                    id: mindMap.id,
                    title: mindMap.title,
                    created_at: mindMap.createdAt.toISOString(),
                    updated_at: new Date().toISOString()
                };
                log.debug('Upserting mindmap data:', mindmapData);
                const { error } = await supabase.from('mindmaps').upsert(mindmapData);
                if (error) {
                    log.error('Supabase mindmap upsert error:', error);
                    throw new Error(`Failed to upsert mindmap: ${error.message}`);
                }
            } catch (supabaseError) {
                log.error('Supabase mindmap operation failed:', supabaseError);
                throw supabaseError;
            }
            // ---

            // --- Supabase upsert root node ---
            try {
                const rootNodeData = {
                    id: node.id,
                    mindmap_id: mindMap.id,
                    content: node.content,
                    position_x: node.position.x,
                    position_y: node.position.y,
                    parent_id: node.parentId,
                    is_root: node.isRoot,
                    handle_config: node.handleConfig,
                    width: node.width,
                    height: node.height,
                    created_at: node.createdAt.toISOString(),
                    updated_at: new Date().toISOString()
                };
                log.debug('Upserting root node data:', rootNodeData);
                const { error } = await supabase.from('nodes').upsert(rootNodeData);
                if (error) {
                    log.error('Supabase root node upsert error:', error);
                    throw new Error(`Failed to upsert root node: ${error.message}`);
                }
            } catch (supabaseError) {
                log.error('Supabase root node operation failed:', supabaseError);
                throw supabaseError;
            }
            // ---

            return mindMap.toJSON();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const loadMindMap = createAsyncThunk(
    'mindMap/loadMindMap',
    async (mindMapId, { rejectWithValue }) => {
        try {
            log.debug('Loading mind map with ID:', mindMapId);

            // Fetch mindmap
            const { data: mindmapData, error: mindmapError } = await supabase
                .from('mindmaps')
                .select('*')
                .eq('id', mindMapId)
                .single();

            log.debug('Mindmap query result:', { mindmapData, mindmapError });

            if (mindmapError && mindmapError.code !== 'PGRST116') {
                log.error('Failed to fetch mind map:', mindmapError);
                throw new Error(`Failed to fetch mind map: ${mindmapError.message}`);
            }
            if (!mindmapData) {
                log.debug('No mind map found, returning null');
                // Return null to allow createMindMap to proceed
                return null;
            }

            // Fetch nodes
            const { data: nodesData, error: nodesError } = await supabase
                .from('nodes')
                .select('*')
                .eq('mindmap_id', mindMapId);

            log.debug('Nodes query result:', { nodesData, nodesError });

            if (nodesError) {
                log.error('Failed to fetch nodes:', nodesError);
                throw new Error(`Failed to fetch nodes: ${nodesError.message}`);
            }

            // Fetch edges
            const { data: edgesData, error: edgesError } = await supabase
                .from('edges')
                .select('*')
                .eq('mindmap_id', mindMapId);

            log.debug('Edges query result:', { edgesData, edgesError });

            if (edgesError) {
                log.error('Failed to fetch edges:', edgesError);
                throw new Error(`Failed to fetch edges: ${edgesError.message}`);
            }

            // Reconstruct MindMap entity
            const nodes = (nodesData || []).map(node => ({
                id: node.id,
                isRoot: node.is_root,
                content: node.content,
                position: { x: node.position_x, y: node.position_y },
                parentId: node.parent_id,
                children: [], // will be filled by MindMap.fromJSON
                createdAt: node.created_at,
                updatedAt: node.updated_at,
                metadata: {},
                height: node.height,
                width: node.width,
                handleConfig: node.handle_config
            }));
            const edges = (edgesData || []).map(edge => ({
                id: edge.id,
                sourceNodeId: edge.source_node_id,
                targetNodeId: edge.target_node_id,
                type: edge.type,
                sourceHandleId: edge.source_handle_id,
                targetHandleId: edge.target_handle_id,
                style: edge.style,
                createdAt: edge.created_at,
                updatedAt: edge.updated_at,
                metadata: {}
            }));
            const mindMapJson = {
                id: mindmapData.id,
                title: mindmapData.title,
                nodes,
                edges,
                rootNodeId: nodes.find(n => n.isRoot)?.id || null,
                createdAt: mindmapData.created_at,
                updatedAt: mindmapData.updated_at,
                metadata: {}
            };

            log.debug('Reconstructed mind map:', mindMapJson);
            return mindMapJson;
        } catch (error) {
            log.error('loadMindMap error:', error);
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

            // --- Supabase upsert node ---
            try {
                const nodeData = {
                    id: node.id,
                    mindmap_id: mindMap.currentMindMap.id,
                    content: node.content,
                    position_x: node.position.x,
                    position_y: node.position.y,
                    parent_id: node.parentId,
                    is_root: node.isRoot,
                    handle_config: node.handleConfig,
                    width: node.width,
                    height: node.height,
                    created_at: node.createdAt.toISOString(),
                    updated_at: new Date().toISOString()
                };
                log.debug('Upserting node data:', nodeData);
                supabase.from('nodes').upsert(nodeData).then(({ error }) => {
                    if (error) {
                        log.error('Supabase node upsert error:', error);
                        throw new Error(`Failed to upsert node: ${error.message}`);
                    }
                });
            } catch (supabaseError) {
                log.error('Supabase operation failed:', supabaseError);
                throw supabaseError;
            }
            // ---

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

            // --- Supabase delete node (edges will be deleted automatically via cascade) ---
            supabase.from('nodes').delete().eq('id', nodeId).then(({ error }) => {
                if (error) {
                    log.error('Supabase node delete error:', error);
                }
            });
            // ---

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

            // --- Supabase upsert edge ---
            try {
                const edgeData = {
                    id: edge.id,
                    mindmap_id: mindMap.currentMindMap.id,
                    source_node_id: edge.sourceNodeId,
                    target_node_id: edge.targetNodeId,
                    source_handle_id: edge.sourceHandleId,
                    target_handle_id: edge.targetHandleId,
                    type: edge.type,
                    style: edge.style,
                    created_at: edge.createdAt.toISOString(),
                    updated_at: new Date().toISOString()
                };
                log.debug('Upserting edge data:', edgeData);
                supabase.from('edges').upsert(edgeData).then(({ error }) => {
                    if (error) {
                        log.error('Supabase edge upsert error:', error);
                    }
                });
            } catch (supabaseError) {
                log.error('Supabase edge operation failed:', supabaseError);
            }
            // ---

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
            const node = Node.create(false, content, position, parentId);

            let nodeHandleConfigs = []
            if (handleConfig.leftHandleType == "source") {
                nodeHandleConfigs.push({ id: `${node.id}-source`, type: 'source', position: 'left' })
            }
            else {
                nodeHandleConfigs.push({ id: `${node.id}-target`, type: 'target', position: 'left' })
            }


            if (handleConfig.rightHandleType == "source") {
                nodeHandleConfigs.push({ id: `${node.id}-source`, type: 'source', position: 'right' })
            }
            else {
                nodeHandleConfigs.push({ id: `${node.id}-target`, type: 'target', position: 'right' })
            }


            // Set handle configuration if provided
            node.setHandleConfig(nodeHandleConfigs)
            mindMap.currentMindMap.addNode(node);

            // --- Supabase upsert node ---
            try {
                const newNodeData = {
                    id: node.id,
                    mindmap_id: mindMap.currentMindMap.id,
                    content: node.content,
                    position_x: node.position.x,
                    position_y: node.position.y,
                    parent_id: node.parentId,
                    is_root: node.isRoot,
                    handle_config: node.handleConfig,
                    width: node.width,
                    height: node.height,
                    created_at: node.createdAt.toISOString(),
                    updated_at: new Date().toISOString()
                };
                log.debug('Upserting new node data:', newNodeData);
                supabase.from('nodes').upsert(newNodeData).then(({ error }) => {
                    if (error) {
                        log.error('Supabase new node upsert error:', error);
                    }
                });
            } catch (supabaseError) {
                log.error('Supabase new node operation failed:', supabaseError);
            }
            // ---

            // Create the edge if sourceNodeId is provided
            let edge = null;
            if (sourceNodeId) {
                edge = Edge.create(sourceNodeId, node.id, 'default');
                // Store handle information in the edge
                edge.setHandleIds(sourceHandleId, `${node.id}-target`);
                mindMap.currentMindMap.addEdge(edge);

                // --- Supabase upsert edge ---
                try {
                    const newEdgeData = {
                        id: edge.id,
                        mindmap_id: mindMap.currentMindMap.id,
                        source_node_id: edge.sourceNodeId,
                        target_node_id: edge.targetNodeId,
                        source_handle_id: edge.sourceHandleId,
                        target_handle_id: edge.targetHandleId,
                        type: edge.type,
                        style: edge.style,
                        created_at: edge.createdAt.toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    log.debug('Upserting new edge data:', newEdgeData);
                    supabase.from('edges').upsert(newEdgeData).then(({ error }) => {
                        if (error) {
                            log.error('Supabase new edge upsert error:', error);
                        }
                    });
                } catch (supabaseError) {
                    log.error('Supabase new edge operation failed:', supabaseError);
                }
                // ---
            }

            const data = {
                node: node.toJSON(),
                edge: edge ? edge.toJSON() : null,
                mindMap: mindMap.currentMindMap.toJSON()
            };
            return data
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

            // --- Supabase delete edge ---
            supabase.from('edges').delete().eq('id', edgeId).then(({ error }) => {
                if (error) {
                    log.error('Supabase edge delete error:', error);
                }
            });
            // ---

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

            // Fetch All MindMaps
            .addCase(fetchAllMindMaps.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllMindMaps.fulfilled, (state, action) => {
                state.loading = false;
                state.mindMaps = action.payload;
            })
            .addCase(fetchAllMindMaps.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update MindMap Title
            .addCase(updateMindMapTitle.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateMindMapTitle.fulfilled, (state, action) => {
                state.loading = false;
                // Update the mindmap in the list
                const { mindMapId, newTitle, updatedMindMap } = action.payload;
                const mindMapIndex = state.mindMaps.findIndex(map => map.id === mindMapId);
                if (mindMapIndex !== -1) {
                    state.mindMaps[mindMapIndex] = updatedMindMap;
                }
                // Update current mindmap if it's the one being renamed
                if (state.currentMindMap && state.currentMindMap.id === mindMapId) {
                    state.currentMindMap.title = newTitle;
                    state.currentMindMap.updatedAt = new Date();
                }
            })
            .addCase(updateMindMapTitle.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete MindMap
            .addCase(deleteMindMap.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteMindMap.fulfilled, (state, action) => {
                state.loading = false;
                const deletedMindMapId = action.payload;
                // Remove the mindmap from the list
                state.mindMaps = state.mindMaps.filter(map => map.id !== deletedMindMapId);
                // Clear current mindmap if it's the one being deleted
                if (state.currentMindMap && state.currentMindMap.id === deletedMindMapId) {
                    state.currentMindMap = null;
                    state.selectedNodeId = null;
                    state.selectedEdgeId = null;
                }
            })
            .addCase(deleteMindMap.rejected, (state, action) => {
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