import React, { useState, useRef, memo, useCallback, useEffect } from 'react';
import { Handle, NodeResizeControl, NodeResizer, Position } from '@xyflow/react';
import { useAppDispatch } from '../../hooks/hooks.js';
import { updateNode } from '../../store/mindMap/mindMapSlice.js';
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
        log.debug('Resize end - final update:', { id, width: params.width, height: params.height });
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




    return (
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

            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;

