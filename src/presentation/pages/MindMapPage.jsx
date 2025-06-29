import React, { useEffect, useRef, useMemo, useCallback, us } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useReactFlow,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    applyNodeChanges,
    addEdge,
    getIncomers,
    getOutgoers,
    getConnectedEdges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppSelector, useAppDispatch } from '../../hooks/hooks.js';
import {
    createMindMap,
    loadMindMap,
    addNode,
    updateNode,
    deleteNode,
    deleteEdge,
    connectNodes,
    addNodeWithConnection,
    setSelectedNode,
    clearSelection

} from '../../store/mindMap/mindMapSlice.js';
import {
    setZoom,
    setPan,
    resetView,
    openModal
} from '../../store/ui/uiSlice.js';
import CustomNode from '../components/CustomNode.jsx';
import './MindMapPage.css';
import { useParams } from 'react-router-dom';
import log from "../../utils/logger.js"


const MindMapContent = ({ mindMapId }) => {
    const dispatch = useAppDispatch();

    const { currentMindMap, selectedNodeId, loading, error } = useAppSelector(state => state.mindMap);
    const { zoom, pan } = useAppSelector(state => state.ui);

    const reactFlowWrapper = useRef(null);
    const viewportUpdateTimeoutRef = useRef(null);
    const { screenToFlowPosition } = useReactFlow();


    // Memoize nodes and edges to prevent unnecessary re-renders
    const nodesFromRedux = useMemo(() => {
        if (!currentMindMap) {
            return [];
        }
        return currentMindMap.getAllNodes().map(node => ({
            id: node.id,
            type: 'custom',
            position: node.position,
            selected: node.id === selectedNodeId,// <-- highlight if selected
            data: {
                label: node.content,
                node: node,
                parentId: node.parentId,
                children: node.children,
                handleConfig: node.handleConfig,
                width: node.width,
                height: node.height
            },

        }));
    }, [currentMindMap, selectedNodeId]);


    const edgesFromRedux = useMemo(() => {
        if (!currentMindMap) {
            return [];
        }
        return currentMindMap.getAllEdges().map(edge => ({
            id: edge.id,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
            sourceHandle: edge.sourceHandleId,
            targetHandle: edge.targetHandleId,
            type: edge.type,
            style: edge.style,
            data: { edge: edge }
        }));
    }, [currentMindMap]);



    // React Flow local state
    const [nodes, setNodes, onNodesChange] = useNodesState(nodesFromRedux);
    const [edges, setEdges, onEdgesChange] = useEdgesState(edgesFromRedux);

    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

    // Debounced viewport update function
    const debouncedViewportUpdate = useCallback((viewport) => {
        if (viewportUpdateTimeoutRef.current) {
            clearTimeout(viewportUpdateTimeoutRef.current);
        }
        viewportUpdateTimeoutRef.current = setTimeout(() => {
            dispatch(setPan({ x: viewport.x, y: viewport.y }));
            dispatch(setZoom(viewport.zoom));
        }, 16); // ~60fps
    }, [dispatch]);


    const onNodeDragStop = useCallback((_, node) => {
        log.debug("onNodeDragStop", _, node)
        dispatch(updateNode({ nodeId: node.id, updates: { position: node.position } }));
    }, [dispatch]);


    const onConnectEnd = useCallback((event, connectionState) => {
        log.debug("onConnectEnd", { event, connectionState })

        // Check if we have a connection start but no valid target (dropped on pane)
        if (connectionState.fromNode && !connectionState.toNode) {
            const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

            // Get the exact position where the connection was dropped
            const dropPosition = screenToFlowPosition({
                x: clientX,
                y: clientY,
            });

            log.debug("onConnectEnd", 'Creating new node at drop position:', dropPosition);

            // Get the source handle ID from the connection state
            const sourceHandleId = connectionState.fromHandle.id;

            // Determine handle configuration for the new node based on source handle
            let newNodeHandleConfig = null;

            // Check if the source node is a root node (no parentId)
            const sourceNode = nodes.find(node => node.id === connectionState.fromNode.id);
            if (sourceNode) {
                if (!sourceNode.data?.parentId) {
                    if (sourceHandleId === `${connectionState.fromNode.id}-source-left`) {
                        // From left handle of root node - new node should have left source, right target
                        newNodeHandleConfig = {
                            leftHandleType: 'source',
                            rightHandleType: 'target'
                        };
                    } else if (sourceHandleId === `${connectionState.fromNode.id}-source-right`) {
                        // From right handle of root node - new node should have right source, left target
                        newNodeHandleConfig = {
                            leftHandleType: 'target',
                            rightHandleType: 'source'
                        };
                    }
                } else {
                    // Non-root node - inherit handle config from parent node
                    newNodeHandleConfig = {
                        leftHandleType: sourceNode.data.handleConfig[0].type,
                        rightHandleType: sourceNode.data.handleConfig[1].type
                    }

                }
                // Root node - determine handle config based on source handle

            }

            // Create a new node at the exact drop position with connection
            dispatch(addNodeWithConnection({
                content: 'New Node',
                position: dropPosition,
                parentId: connectionState.fromNode.id,
                sourceNodeId: connectionState.fromNode.id,
                sourceHandleId: sourceHandleId,
                handleConfig: newNodeHandleConfig
            }));
        } else if (connectionState.fromNode && connectionState.toNode) {
            log.debug("onConnectEnd", "Connecting nodes", connectionState.fromNode.id, connectionState.toNode.id)

            // Check if target handle is already connected
            const targetHandleId = connectionState.toHandle.id;
            const isTargetHandleConnected = edgesFromRedux.some(edge =>
                edge.targetHandle === targetHandleId
            );

            if (isTargetHandleConnected) {
                log.debug("onConnectEnd", 'Cannot create connection - target handle already connected:', targetHandleId);
                return;
            }

            dispatch(connectNodes({
                sourceNodeId: connectionState.fromNode.id,
                targetNodeId: connectionState.toNode.id,
                sourceHandleId: connectionState.fromHandle.id,
                targetHandleId: connectionState.toHandle.id,
                edgeType: 'default'
            }));

        }
    }, [screenToFlowPosition, dispatch, nodes, edges]);


    const onNodeClick = useCallback((event, node) => {
        log.debug("onNodeClick", event, node);

    }, [dispatch]);

    const onPaneClick = useCallback(() => {
        log.debug("onPaneClick, Clearing node selection")
        dispatch(clearSelection());
    }, [dispatch]);

    // Optimized viewport handlers with debouncing
    const onMove = useCallback((event, viewport) => {
        // Don't update during drag operations to prevent lag
        if (!event.dragging) {
            debouncedViewportUpdate(viewport);
        }
    }, [debouncedViewportUpdate]);

    const onMoveEnd = useCallback((event, viewport) => {
        // Clear any pending updates and set final position
        if (viewportUpdateTimeoutRef.current) {
            clearTimeout(viewportUpdateTimeoutRef.current);
        }
        dispatch(setPan({ x: viewport.x, y: viewport.y }));
        dispatch(setZoom(viewport.zoom));
    }, [dispatch]);





    const handleSmartDeleteNode = useCallback((nodesToDelete) => {
        log.debug("handleSmartDeleteNode called with nodes:", nodesToDelete);

        if (nodesToDelete.length === 0) return;

        // Filter out root nodes (nodes without parentId) to prevent their deletion
        const nodesToDeleteFiltered = nodesToDelete.filter(node => {
            const nodeData = nodes.find(n => n.id === node.id)?.data;
            const isRootNode = !nodeData?.parentId;

            if (isRootNode) {
                log.debug('Preventing deletion of root node:', node.id);
            }

            return !isRootNode; // Only allow deletion of non-root nodes
        });

        if (nodesToDeleteFiltered.length === 0) {
            log.debug('No valid nodes to delete after filtering out root nodes');
            return;
        }

        // Use React Flow state for the utilities
        const nodeIds = nodesToDeleteFiltered.map(node => node.id);

        // Find all edges that will be affected
        const edgesToRemove = new Set();
        const newEdgesToCreate = [];

        // For each node to delete, find its connections and plan the reconnections
        nodesToDeleteFiltered.forEach(node => {
            const incomers = getIncomers(node, nodes, edges);
            const outgoers = getOutgoers(node, nodes, edges);
            const connectedEdges = getConnectedEdges([node], edges);

            log.debug('Node to delete:', node.id, 'Incomers:', incomers, 'Outgoers:', outgoers, 'Connected edges:', connectedEdges);

            // Mark edges for removal
            connectedEdges.forEach(edge => edgesToRemove.add(edge.id));

            // Plan new connections from incomers to outgoers
            incomers.forEach(sourceNode => {
                // Only create connections if source is not being deleted
                if (!nodeIds.includes(sourceNode.id)) {
                    outgoers.forEach(targetNode => {
                        // Only create connections if target is not being deleted
                        if (!nodeIds.includes(targetNode.id)) {
                            // Find the edge that connects sourceNode to the node being deleted
                            const sourceEdge = edges.find(edge =>
                                edge.source === sourceNode.id && edge.target === node.id
                            );

                            // Find the edge that connects the node being deleted to targetNode
                            const targetEdge = edges.find(edge =>
                                edge.source === node.id && edge.target === targetNode.id
                            );

                            newEdgesToCreate.push({
                                sourceId: sourceNode.id,
                                targetId: targetNode.id,
                                sourceHandleId: sourceEdge?.sourceHandle || `${sourceNode.id}-source`,
                                targetHandleId: targetEdge?.targetHandle || `${targetNode.id}-target`
                            });
                        }
                    });
                }
            });
        });

        log.debug('Final plan:', {
            nodesToDelete: nodeIds,
            edgesToRemove: Array.from(edgesToRemove),
            newEdgesToCreate
        });

        // Remove all affected edges from Redux
        edgesToRemove.forEach(edgeId => {
            const edge = edges.find(e => e.id === edgeId);
            if (edge) {
                dispatch(deleteEdge(edgeId));
            }
        });

        // Create new edges in Redux
        newEdgesToCreate.forEach(({ sourceId, targetId, sourceHandleId, targetHandleId }) => {
            dispatch(connectNodes({
                sourceNodeId: sourceId,
                targetNodeId: targetId,
                sourceHandleId: sourceHandleId,
                targetHandleId: targetHandleId,
                edgeType: 'default'
            }));
        });

        // Remove all nodes from Redux
        nodeIds.forEach(nodeId => {
            dispatch(deleteNode(nodeId));
        });
    }, [nodes, edges, dispatch]);

    const handleSimpleDeleteNode = useCallback((nodesToDelete) => {
        log.debug("handleSimpleDeleteNode called with nodes:", nodesToDelete);

        if (nodesToDelete.length === 0) return;

        // Filter out root nodes (nodes without parentId) to prevent their deletion
        const nodesToDeleteFiltered = nodesToDelete.filter(node => {
            const nodeData = nodes.find(n => n.id === node.id)?.data;
            const isRootNode = !nodeData?.parentId;

            if (isRootNode) {
                log.debug('Preventing deletion of root node:', node.id);
            }

            return !isRootNode; // Only allow deletion of non-root nodes
        });

        if (nodesToDeleteFiltered.length === 0) {
            log.debug('No valid nodes to delete after filtering out root nodes');
            return;
        }

        // Get node IDs to delete
        const nodeIds = nodesToDeleteFiltered.map(node => node.id);

        // Find all edges connected to these nodes and remove them
        const edgesToRemove = edges.filter(edge =>
            nodeIds.includes(edge.source) || nodeIds.includes(edge.target)
        );

        log.debug('Simple delete plan:', {
            nodesToDelete: nodeIds,
            edgesToRemove: edgesToRemove.map(e => e.id)
        });

        // Remove all connected edges from Redux
        edgesToRemove.forEach(edge => {
            dispatch(deleteEdge(edge.id));
        });

        // Remove all nodes from Redux
        nodeIds.forEach(nodeId => {
            dispatch(deleteNode(nodeId));
        });
    }, [nodes, edges, dispatch]);

    const handleOnSelectionChange = useCallback((obj) => {
        log.debug("handleOnSelectionChange", obj);

        // Only handle single selection - take the first node if multiple are somehow selected
        if (obj.nodes.length > 0) {
            const selectedNode = obj.nodes[0]; // Only take the first node
            log.debug("handleOnSelectionChange", "Selected Node : ", selectedNode);
            dispatch(setSelectedNode(selectedNode.id));
        } else {
            // No nodes selected
            log.debug("handleOnSelectionChange", "No nodes selected, clearing selection");
            dispatch(clearSelection());
        }
    }, [dispatch]);



    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (viewportUpdateTimeoutRef.current) {
                clearTimeout(viewportUpdateTimeoutRef.current);
            }
        };
    }, []);

    const hasValidMindMap = currentMindMap && typeof currentMindMap.getAllNodes === 'function';

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
                {hasValidMindMap ? (
                    <ReactFlow
                        defaultNodes={nodes}
                        defaultEdges={edges}
                        nodes={nodes} // array of node objects to display, each with id, position, data
                        edges={edges} // array of edge objects to display, each with id, source, target, 
                        nodeTypes={nodeTypes} // an object mapping node type names to React components
                        onNodesChange={onNodesChange} // Called when nodes are moved, added, or removed.
                        onEdgesChange={onEdgesChange} // Called when edges are added, removed, or changed.
                        onConnectEnd={onConnectEnd} // Called when the user releases a connection. 
                        onNodesDelete={handleSimpleDeleteNode}
                        onNodeClick={onNodeClick}
                        onSelectionChange={handleOnSelectionChange}
                        onPaneClick={onPaneClick}
                        onNodeDragStop={onNodeDragStop}
                        onMove={onMove}
                        onMoveEnd={onMoveEnd}
                        defaultViewport={{ x: pan.x, y: pan.y, zoom: zoom }}
                        minZoom={0.1}
                        maxZoom={3}
                        fitView={false}
                        nodeOrigin={[0.5, 0]}
                        proOptions={{ hideAttribution: true }}
                        deleteKeyCode={null}
                        multiSelectionKeyCode={null}
                        selectNodesOnDrag={false}
                        selectionKeyCode={null}
                        selectionOnDrag={false}
                        panOnDrag={true}
                        panOnScroll={false}
                        zoomOnScroll={true}
                        zoomOnPinch={true}
                        zoomOnDoubleClick={false}
                        preventScrolling={true}
                        nodesDraggable={true}
                        nodesConnectable={true}
                        elementsSelectable={true}
                        nodesFocusable={true}
                    >
                        <Controls />
                        <MiniMap />
                        <Background variant="dots" gap={12} size={1} />
                    </ReactFlow>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        padding: '20px'
                    }}>
                        <h3>Loading Mind Map...</h3>
                    </div>
                )}
            </div>
        </div>
    );
};





const MindMapPage = () => {

    const dispatch = useAppDispatch();

    // Get mindMapId from URL params
    const { mindMapId } = useParams();
    const { loading, error } = useAppSelector(s => s.mindMap);

    // Runs immediately after React has rendered
    // and then again any time the dependencies change - minMapId
    useEffect(() => {
        if (!mindMapId) return;
        dispatch(loadMindMap(mindMapId))
            .then(result => {
                if (!result.payload) {
                    dispatch(createMindMap({ id: mindMapId }));
                }
            });
    }, [mindMapId, dispatch]);

    if (loading) {
        // Use a proper loading view
        return <div className="loader">Loading your mind-map…</div>;
    }

    if (error) {
        // Use a proper error view 
        return <div className="error">Oops: {error}</div>;
    }


    return (
        // Using a ReactFlowProvider is also mandatory if you want to access the 
        // internal state outside of the ReactFlow component.
        // It provides context and state to everything inside, making the mind map interactive
        <ReactFlowProvider>
            <MindMapContent mindMapId={mindMapId} />
        </ReactFlowProvider>
    );
};

export default MindMapPage;