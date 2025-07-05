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
    useStoreApi,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
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

} from '../../../store/mindMap/mindMapSlice.js';
import {
    setZoom,
    setPan,
    resetView,
    openModal
} from '../../../store/ui/uiSlice.js';
import CustomNode from '../../components/customNodes/CustomNode.jsx';
import './MindMapPage.css';
import { useParams } from 'react-router-dom';
import log from "../../../utils/logger.js"


const MindMapContent = ({ mindMapId }) => {
    log.debug("MindMapContent rendered");
    const dispatch = useDispatch();
    const store = useStoreApi();

    const { currentMindMap, selectedNodeId, loading, error } = useSelector(state => state.mindMap);
    const { zoom, pan } = useSelector(state => state.ui);

    const reactFlowWrapper = useRef(null);
    const viewportUpdateTimeoutRef = useRef(null);
    const { screenToFlowPosition, getInternalNode } = useReactFlow();

    // Add ref to track edge reconnection success
    const edgeReconnectSuccessful = useRef(true);

    // Proximity connect constants
    const MIN_DISTANCE = 400;

    // Memoize nodes and edges to prevent unnecessary re-renders
    const nodesFromRedux = useMemo(() => {
        log.debug("Computing nodesFromRedux")
        if (!currentMindMap) {
            return [];
        }
        return currentMindMap.getAllNodes().map(node => ({
            id: node.id,
            type: 'custom',
            position: node.position,
            selected: node.id === selectedNodeId,// <-- highlight if selected
            data: {
                isRoot: node.isRoot,
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
        log.debug("Computing edgesFromRedux")
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
            data: { edge: edge },
            animated: true,

        }));
    }, [currentMindMap]);



    // React Flow local state
    const [nodes, setNodes, onNodesChange] = useNodesState(nodesFromRedux);
    const [edges, setEdges, onEdgesChange] = useEdgesState(edgesFromRedux);

    useEffect(() => {
        setEdges(edgesFromRedux);
    }, [edgesFromRedux, setEdges]);

    useEffect(() => {
        setNodes(nodesFromRedux);
    }, [nodesFromRedux, setEdges]);



    log.debug("edges", edges, "edgesFromRedux", edgesFromRedux)
    log.debug("nodes", nodes, "nodesFromRedux", nodesFromRedux)

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



    const onConnectEnd = useCallback((event, connectionState) => {
        log.debug("onConnectEnd", { event, connectionState })

        if (edgeReconnectSuccessful.current === false) {
            log.debug("onConnectEnd", "Edge reconnection failed, not performing any action")
            return;
        }

        // Check if we have a connection start but no valid target (dropped on pane)
        if (connectionState.fromNode && !connectionState.toNode) {
            const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

            // Get the exact position where the connection was dropped
            const dropPosition = screenToFlowPosition({
                x: clientX,
                y: clientY,
            });


            // Get the source handle ID from the connection state
            const sourceHandleId = connectionState.fromHandle.id;

            // Validate that the fromHandle is actually a source handle
            const sourceNode = nodes.find(node => node.id === connectionState.fromNode.id);
            if (!sourceNode) {
                log.debug("onConnectEnd", 'Source node not found');
                return;
            }

            // Check if the handle is actually a source handle
            const sourceHandle = sourceNode.data?.handleConfig?.find(handle => handle.id === sourceHandleId);
            if (!sourceHandle || sourceHandle.type !== 'source') {
                log.debug("onConnectEnd", 'Cannot start connection from target handle:', sourceHandleId);
                return;
            }

            // Determine handle configuration for the new node based on source handle
            let newNodeHandleConfig = null;

            // Check if the source node is a root node
            if (sourceNode.data?.isRoot) {
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

            log.debug("onConnectEnd", 'Creating new node at drop position:', dropPosition);


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

            // Get handle information
            const fromNode = nodes.find(node => node.id === connectionState.fromNode.id);
            const toNode = nodes.find(node => node.id === connectionState.toNode.id);
            const fromHandle = fromNode?.data?.handleConfig?.find(handle => handle.id === connectionState.fromHandle.id);
            const toHandle = toNode?.data?.handleConfig?.find(handle => handle.id === connectionState.toHandle.id);

            if (!fromHandle || !toHandle) {
                log.debug("onConnectEnd", 'Invalid handles found');
                return;
            }

            // Normalize the connection: ensure source node has source handle, target node has target handle
            let sourceNodeId, targetNodeId, sourceHandleId, targetHandleId;

            if (fromHandle.type === 'source' && toHandle.type === 'target') {
                // Normal direction: source -> target
                sourceNodeId = connectionState.fromNode.id;
                targetNodeId = connectionState.toNode.id;
                sourceHandleId = connectionState.fromHandle.id;
                targetHandleId = connectionState.toHandle.id;
            } else if (fromHandle.type === 'target' && toHandle.type === 'source') {
                // Reversed direction: target -> source (need to normalize)
                sourceNodeId = connectionState.toNode.id;  // The node with source handle
                targetNodeId = connectionState.fromNode.id; // The node with target handle
                sourceHandleId = connectionState.toHandle.id;   // The source handle
                targetHandleId = connectionState.fromHandle.id; // The target handle
            } else {
                // Invalid combination (source->source or target->target)
                log.debug("onConnectEnd", 'Invalid handle combination:', fromHandle.type, '->', toHandle.type);
                return;
            }

            // Check if target handle is already connected
            const isTargetHandleConnected = edgesFromRedux.some(edge =>
                edge.targetHandle === targetHandleId
            );

            if (isTargetHandleConnected) {
                log.debug("onConnectEnd", 'Cannot create connection - target handle already connected:', targetHandleId);
                return;
            }

            log.debug("onConnectEnd", "Normalized connection:", {
                original: { from: connectionState.fromNode.id, to: connectionState.toNode.id },
                normalized: { source: sourceNodeId, target: targetNodeId }
            });

            dispatch(connectNodes({
                sourceNodeId: sourceNodeId,
                targetNodeId: targetNodeId,
                sourceHandleId: sourceHandleId,
                targetHandleId: targetHandleId,
                edgeType: 'default'
            }));
        }
    }, [screenToFlowPosition, dispatch, nodes, edgesFromRedux]);


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


    // Could lead circular updates 
    // Due to triggering of handleOnSelectionChange with empty array
    const handleOnSelectionChange = useCallback((obj) => {
        log.debug("handleOnSelectionChange", obj);

        // Only handle single selection - take the first node if multiple are somehow selected
        if (obj.nodes.length > 0) {
            const selectedNode = obj.nodes[0]; // Only take the first node
            log.debug("handleOnSelectionChange", "Selected Node : ", selectedNode);
            dispatch(setSelectedNode(selectedNode.id));
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

    // Get closest edge for proximity connect
    const getClosestEdge = useCallback((node) => {
        const { nodeLookup } = store.getState();
        const internalNode = getInternalNode(node.id);

        // Get the dragged node's handles
        const draggedNode = nodes.find(n => n.id === node.id);
        if (!draggedNode) return null;

        const draggedSourceHandles = draggedNode.data?.handleConfig?.filter(h => h.type === 'source') || [];
        const draggedTargetHandles = draggedNode.data?.handleConfig?.filter(h => h.type === 'target') || [];

        // Find all other nodes with their handles
        const otherNodes = nodes.filter(n => n.id !== node.id);

        let closestConnection = null;
        let minDistance = Number.MAX_VALUE;

        // Check each other node for potential connections
        for (const otherNode of otherNodes) {
            const otherNodeInternal = nodeLookup.get(otherNode.id);
            if (!otherNodeInternal) continue;

            const dx = otherNodeInternal.internals.positionAbsolute.x - internalNode.internals.positionAbsolute.x;
            const dy = otherNodeInternal.internals.positionAbsolute.y - internalNode.internals.positionAbsolute.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance >= MIN_DISTANCE) continue;

            const otherSourceHandles = otherNode.data?.handleConfig?.filter(h => h.type === 'source') || [];
            const otherTargetHandles = otherNode.data?.handleConfig?.filter(h => h.type === 'target') || [];

            // Filter out already connected target handles
            const availableOtherTargetHandles = otherTargetHandles.filter(handle => {
                return !edgesFromRedux.some(edge => edge.targetHandle === handle.id);
            });

            const availableDraggedTargetHandles = draggedTargetHandles.filter(handle => {
                return !edgesFromRedux.some(edge => edge.targetHandle === handle.id);
            });

            // Determine direction of approach
            const draggedNodeApproachingFromLeft = otherNodeInternal.internals.positionAbsolute.x > internalNode.internals.positionAbsolute.x;

            // Try different connection combinations
            const connectionOptions = [];

            // Option 1: Dragged node source -> Other node target
            if (draggedSourceHandles.length > 0 && availableOtherTargetHandles.length > 0) {
                let selectedSourceHandle = null;
                let selectedTargetHandle = null;

                if (draggedNode.data?.isRoot) {
                    // For root nodes: use direction-appropriate source handle
                    if (draggedNodeApproachingFromLeft) {
                        selectedSourceHandle = draggedSourceHandles.find(h => h.position == 'right');
                    } else {
                        selectedSourceHandle = draggedSourceHandles.find(h => h.position == 'left');
                    }
                } else {
                    selectedSourceHandle = draggedSourceHandles[0];
                }

                if (otherNode.data?.isRoot) {
                    // For root nodes: use direction-appropriate target handle
                    if (draggedNodeApproachingFromLeft) {
                        selectedTargetHandle = availableOtherTargetHandles.find(h => h.position === 'left');
                    } else {
                        selectedTargetHandle = availableOtherTargetHandles.find(h => h.position === 'right');
                    }
                } else {
                    selectedTargetHandle = availableOtherTargetHandles[0];
                }

                if (selectedSourceHandle && selectedTargetHandle) {
                    connectionOptions.push({
                        source: draggedNode.id,
                        target: otherNode.id,
                        sourceHandle: selectedSourceHandle.id,
                        targetHandle: selectedTargetHandle.id,
                        distance
                    });
                }
            }

            // Option 2: Other node source -> Dragged node target
            if (otherSourceHandles.length > 0 && availableDraggedTargetHandles.length > 0) {
                let selectedSourceHandle = null;
                let selectedTargetHandle = null;

                if (otherNode.data?.isRoot) {
                    // For root nodes: use direction-appropriate source handle
                    if (draggedNodeApproachingFromLeft) {
                        selectedSourceHandle = otherSourceHandles.find(h => h.position === 'left');
                    } else {
                        selectedSourceHandle = otherSourceHandles.find(h => h.position === 'right');
                    }
                } else {
                    selectedSourceHandle = otherSourceHandles[0];
                }

                if (draggedNode.data?.isRoot) {
                    // For root nodes: use direction-appropriate target handle
                    if (draggedNodeApproachingFromLeft) {
                        selectedTargetHandle = availableDraggedTargetHandles.find(h => h.position === 'left');
                    } else {
                        selectedTargetHandle = availableDraggedTargetHandles.find(h => h.position === 'right');
                    }
                } else {
                    selectedTargetHandle = availableDraggedTargetHandles[0];
                }

                if (selectedSourceHandle && selectedTargetHandle) {
                    connectionOptions.push({
                        source: otherNode.id,
                        target: draggedNode.id,
                        sourceHandle: selectedSourceHandle.id,
                        targetHandle: selectedTargetHandle.id,
                        distance
                    });
                }
            }

            // Find the closest connection option for this node
            for (const option of connectionOptions) {
                // Check if this edge already exists
                const alreadyExists = edgesFromRedux.some(
                    (e) =>
                        e.source === option.source &&
                        e.target === option.target &&
                        e.sourceHandle === option.sourceHandle &&
                        e.targetHandle === option.targetHandle
                );
                if (option.distance < minDistance && !alreadyExists) {
                    minDistance = option.distance;
                    closestConnection = option;
                }
            }
        }

        if (!closestConnection) {
            log.debug("getClosestEdge", "No valid connections found");
            return null;
        }

        log.debug("getClosestEdge", "Creating edge", {
            ...closestConnection,
            draggedNodeId: node.id,
            draggedNodeIsRoot: draggedNode.data?.isRoot
        });

        return {
            id: `${closestConnection.source}-${closestConnection.target}`,
            source: closestConnection.source,
            target: closestConnection.target,
            sourceHandle: closestConnection.sourceHandle,
            targetHandle: closestConnection.targetHandle,
        };
    }, [store, getInternalNode, nodes, edgesFromRedux]);

    // Handle node drag for proximity connect
    const onNodeDrag = useCallback(
        (_, node) => {

            log.debug("onNodeDrag", _, node)

            const closeEdge = getClosestEdge(node);

            setEdges((es) => {
                const nextEdges = es.filter((e) => e.className !== 'temp');

                if (
                    closeEdge &&
                    !nextEdges.find(
                        (ne) =>
                            ne.source === closeEdge.source &&
                            ne.target === closeEdge.target &&
                            ne.sourceHandle === closeEdge.sourceHandle &&
                            ne.targetHandle === closeEdge.targetHandle,
                    )
                ) {
                    closeEdge.className = 'temp';

                    nextEdges.push(closeEdge);
                }

                return nextEdges;
            });
        },
        [getClosestEdge, setEdges],
    );

    // Handle node drag stop for proximity connect
    const onNodeDragStop = useCallback(
        (_, node) => {
            // Update node position
            dispatch(updateNode({ nodeId: node.id, updates: { position: node.position } }));

            // Handle proximity connect
            const closeEdge = getClosestEdge(node);

            console.log("onNodeDragStop", closeEdge)

            const nextEdges = edges.filter((e) => e.className !== 'temp');

            if (
                closeEdge &&
                !nextEdges.find(
                    (ne) =>
                        ne.source === closeEdge.source &&
                        ne.target === closeEdge.target &&
                        ne.sourceHandle === closeEdge.sourceHandle &&
                        ne.targetHandle === closeEdge.targetHandle,
                )
            ) {
                console.log("onNodeDragStop", "creating Edge", closeEdge)

                // Create the connection
                dispatch(connectNodes({
                    sourceNodeId: closeEdge.source,
                    targetNodeId: closeEdge.target,
                    sourceHandleId: closeEdge.sourceHandle,
                    targetHandleId: closeEdge.targetHandle,
                    edgeType: 'default'
                }));
            }
        },
        [getClosestEdge, dispatch, nodes, edges],
    );

    // Add edge reconnection handlers
    const onReconnectStart = useCallback(() => {
        log.debug("onReconnectStart")
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = useCallback((oldEdge, newConnection) => {
        log.debug("onReconnect", oldEdge, newConnection)
        edgeReconnectSuccessful.current = true;

        // First delete the old edge
        dispatch(deleteEdge(oldEdge.id));

        // Then create the new connection
        dispatch(connectNodes({
            sourceNodeId: newConnection.source,
            targetNodeId: newConnection.target,
            sourceHandleId: newConnection.sourceHandle,
            targetHandleId: newConnection.targetHandle,
            edgeType: 'default'
        }));
    }, [dispatch]);

    const onReconnectEnd = useCallback((_, edge) => {
        log.debug("onReconnectEnd", _, edge)
        if (!edgeReconnectSuccessful.current) {
            // If reconnection was not successf
            dispatch(deleteEdge(edge.id));

        }
        edgeReconnectSuccessful.current = true;
    }, [dispatch, edges]);

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
                        onNodeDrag={onNodeDrag}
                        onMove={onMove}
                        onMoveEnd={onMoveEnd}
                        onReconnectStart={onReconnectStart}
                        onReconnect={onReconnect}
                        onReconnectEnd={onReconnectEnd}
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

    const dispatch = useDispatch();

    // Get mindMapId from URL params
    const { mindMapId } = useParams();
    const { loading, error } = useDispatch(s => s.mindMap);

    // Runs immediately after React has rendered
    // and then again any time the dependencies change - minMapId
    useEffect(() => {
        if (!mindMapId) return;
        dispatch(loadMindMap(mindMapId))
            .then(result => {
                if (!result.payload) {
                    throw new Error(`Mind map with ID "${mindMapId}" not found. Please check the URL and try again.`);
                }
            })
            .catch(error => {
                log.error('Error loading mind map:', error);
                // The error will be handled by the error state in the Redux store
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