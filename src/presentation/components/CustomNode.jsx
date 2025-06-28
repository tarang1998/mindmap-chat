import React, { useState, useRef, memo, useCallback, useEffect } from 'react';
import { Handle, NodeResizeControl, Position } from '@xyflow/react';
import { useAppDispatch } from '../../hooks/hooks.js';
import { updateNode } from '../../store/mindMap/mindMapSlice.js';
import "./CustomNode.css"

const CustomNode = memo(({ id, selected, data }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(data.label);
    const inputRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const dispatch = useAppDispatch();

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

    // Debounced resize handler to prevent rapid updates
    const handleResize = useCallback((event, params) => {
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
            try {
                dispatch(updateNode({
                    nodeId: id,
                    updates: {
                        width: params.width,
                        height: params.height
                    }
                }));
            } catch (error) {
                // Silently handle resize errors
                console.warn('Resize update failed:', error);
            }
        }, 50); // Increased debounce time
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
        <div className={`react-flow__node-default${selected ? ' selected-node' : ''}`}>
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

            <NodeResizeControl
                style={{
                    background: 'transparent',
                    border: 'none',
                }}
                minWidth={100}
                minHeight={50}
                onResize={handleResize}
            >
                <ResizeIcon />
            </NodeResizeControl>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;

function ResizeIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="#ff0071"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', right: 5, bottom: 5 }}
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <polyline points="16 20 20 20 20 16" />
            <line x1="14" y1="14" x2="20" y2="20" />
            <polyline points="8 4 4 4 4 8" />
            <line x1="4" y1="4" x2="10" y2="10" />
        </svg>
    );
}
