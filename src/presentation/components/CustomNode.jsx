import React, { useState, useRef, memo, useCallback, useEffect } from 'react';
import { Handle, NodeResizeControl, NodeResizer, NodeToolbar, Position, useViewport, useReactFlow, getIncomers, getOutgoers, getConnectedEdges, useHandleConnections } from '@xyflow/react';
import { useAppDispatch } from '../../hooks/hooks.js';
import { updateNode, deleteNode, connectNodes, deleteEdge } from '../../store/mindMap/mindMapSlice.js';
import "./CustomNode.css"
import log from "../../utils/logger.js"

const CustomNode = memo(({ id, selected, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(data.label);
    const [isHovered, setIsHovered] = useState(false);
    const [localDimensions, setLocalDimensions] = useState({
        width: data.node?.width || 'auto',
        height: data.node?.height || 'auto'
    });
    const inputRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const dispatch = useAppDispatch();
    const { zoom } = useViewport();
    const { getNodes, getEdges } = useReactFlow();

    // Update local dimensions when data changes
    useEffect(() => {
        setLocalDimensions({
            width: data.node?.width || 'auto',
            height: data.node?.height || 'auto'
        });
    }, [data.node?.width, data.node?.height]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditContent(data.label);
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [data.label]);

    const handleContentChange = useCallback((e) => {
        setEditContent(e.target.value);
    }, []);

    const handleContentBlur = useCallback(() => {
        setIsEditing(false);
        if (editContent !== data.label && editContent.trim()) {
            dispatch(updateNode({
                nodeId: id,
                updates: { content: editContent.trim() }
            }));
        } else {
            setEditContent(data.label);
        }
    }, [editContent, data.label, dispatch, id]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleContentBlur();
        } else if (e.key === 'Escape') {
            setEditContent(data.label);
            setIsEditing(false);
        }
    }, [handleContentBlur, data.label]);



    // Handle simple delete node - just remove the node and its connections
    const handleSimpleDeleteNode = useCallback(() => {
        log.debug('handleSimpleDeleteNode', id);

        const nodes = getNodes();
        const edges = getEdges();
        const nodeToDelete = nodes.find(node => node.id === id);

        if (!nodeToDelete) return;

        // Find all edges connected to this node and remove them
        const edgesToRemove = edges.filter(edge =>
            edge.source === id || edge.target === id
        );

        log.debug('Simple delete plan:', {
            nodeToDelete: id,
            edgesToRemove: edgesToRemove.map(e => e.id)
        });

        // Remove all connected edges from Redux
        edgesToRemove.forEach(edge => {
            dispatch(deleteEdge(edge.id));
        });

        // Remove the node from Redux
        dispatch(deleteNode(id));
    }, [dispatch, id, getNodes, getEdges]);

    // Optimized resize handler with debouncing
    const handleResize = useCallback((event, params) => {
        // Update local dimensions immediately for smooth visual feedback
        setLocalDimensions({
            width: params.width,
            height: params.height
        });

    }, [dispatch,]);

    // Handle resize end for final update
    const handleResizeEnd = useCallback((event, params) => {
        // Clear any pending debounced updates
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }

        // Final update with exact dimensions
        log.debug('handleResizeEnd', { id, width: params.width, height: params.height });
        dispatch(updateNode({
            nodeId: id,
            updates: {
                width: params.width,
                height: params.height,
                position: { x: params.x, y: params.y }
            }
        }));
    }, [dispatch, id]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, []);

    // Calculate icon size based on zoom level
    const getIconSize = () => {
        const baseSize = 14;
        // Hide toolbar when zoomed out too much (zoom < 0.5)
        if (zoom < 0.7) {
            return null;
        }

        const scaledSize = Math.max(baseSize * zoom, 26); // Minimum 12px, scales inversely with zoom
        return scaledSize;
    };

    const iconSize = getIconSize();

    // Check which handles are connected
    const checkHandleConnection = useCallback((handleId) => {
        const edges = getEdges();
        return edges.some(edge => edge.targetHandle === handleId);
    }, [getEdges]);

    // Check if a handle is connectable (only one connection allowed per target handle)
    const isHandleConnectable = useCallback((handleId, handleType) => {
        if (handleType === 'source') {
            // Source handles can have multiple connections
            return true;
        }

        // Target handles can only have one connection
        const edges = getEdges();
        const isConnected = edges.some(edge => edge.targetHandle === handleId);
        return !isConnected;
    }, [getEdges]);

    return (
        <>
            <div
                className={`react-flow__node-default${selected ? ' selected-node' : ''}`}
                style={{
                    width: localDimensions.width,
                    height: localDimensions.height,
                    justifyContent: 'center',
                    alignContent: 'center',
                    minWidth: '100px',
                    minHeight: '50px',
                    boxSizing: 'border-box',
                    transition: 'none', // Disable transitions during resize for better performance
                    position: 'relative'
                }}
            >
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editContent}
                        onChange={handleContentChange}
                        onBlur={handleContentBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            font: 'inherit',
                            textAlign: 'center'
                        }}
                    />
                ) : (
                    <div onDoubleClick={handleDoubleClick}>{data.label || '[Empty]'}</div>
                )}

                <NodeResizer
                    isVisible={selected}
                    minWidth={100}
                    minHeight={50}
                    onResize={handleResize}
                    onResizeEnd={handleResizeEnd}
                />


                {
                    data.handleConfig.map((handle, index) => {
                        const isConnected = handle.type === 'target' && checkHandleConnection(handle.id);
                        return (
                            <Handle
                                key={`${id}-${handle.id}`}
                                id={handle.id}
                                type={handle.type}
                                position={handle.position === 'left' ? Position.Left : Position.Right}
                                isConnectable={isHandleConnectable(handle.id, handle.type)}
                                className={isConnected ? 'handle-connected' : 'handle-not-connected'}
                            />
                        );
                    })
                }
            </div>

            {/* Node Toolbar - only visible when selected and zoom level is appropriate */}
            {selected && iconSize && (
                <NodeToolbar
                    isVisible={selected}
                    position={Position.Bottom}
                    offset={7}
                    align="center"
                >
                    {/* Only show delete button for non-root nodes */}
                    {data.parentId && (
                        <button
                            onClick={handleSimpleDeleteNode}
                            style={{
                                width: `${iconSize}px`,
                                height: `${iconSize}px`,
                                border: 'none',
                                background: 'rgba(251, 158, 163, 0.95)',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: `${Math.max(iconSize, 8)}px`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgb(255, 0, 13)';
                                e.target.style.transform = 'scale(1.15)';
                                e.target.style.boxShadow = '0 4px 12px rgba(255, 71, 87, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(251, 158, 163, 0.95)';
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                            }}
                            title="Delete Node"
                        >
                            <svg
                                width={Math.max(iconSize * 0.6, 10)}
                                height={Math.max(iconSize * 0.6, 10)}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                color='rgba(0, 0, 0, 0.9)'
                            >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </button>
                    )}
                </NodeToolbar>
            )}
        </>
    );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;

