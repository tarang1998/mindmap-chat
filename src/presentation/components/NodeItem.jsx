import React, { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppSelector.js';
import { updateNodeContent, updateNodePosition } from '../../store/mindMap/mindMapSlice.js';
import './NodeItem.css';

const NodeItem = ({ node, isSelected, onSelect }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(node.content);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const nodeRef = useRef(null);
    const dispatch = useAppDispatch();

    const { nodeSize, colorScheme } = useAppSelector(state => state.ui);

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditContent(node.content);
    };

    const handleContentChange = (e) => {
        setEditContent(e.target.value);
    };

    const handleContentBlur = () => {
        setIsEditing(false);
        if (editContent !== node.content) {
            dispatch(updateNodeContent({ nodeId: node.id, content: editContent }));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleContentBlur();
        } else if (e.key === 'Escape') {
            setEditContent(node.content);
            setIsEditing(false);
        }
    };

    const handleMouseDown = (e) => {
        if (isEditing) return;

        e.stopPropagation();
        onSelect();

        if (e.button === 0) { // Left click
            setIsDragging(true);
            const rect = nodeRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        e.preventDefault();
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        dispatch(updateNodePosition({
            nodeId: node.id,
            position: { x: newX, y: newY }
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    const getNodeClasses = () => {
        const classes = ['node-item'];
        if (isSelected) classes.push('selected');
        if (isDragging) classes.push('dragging');
        classes.push(`size-${nodeSize}`);
        classes.push(`theme-${colorScheme}`);
        return classes.join(' ');
    };

    return (
        <g
            ref={nodeRef}
            className={getNodeClasses()}
            transform={`translate(${node.position.x}, ${node.position.y})`}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            {/* Node background */}
            <rect
                className="node-background"
                width="120"
                height="60"
                rx="8"
                ry="8"
            />

            {/* Node content */}
            {isEditing ? (
                <foreignObject width="120" height="60" x="0" y="0">
                    <div className="node-edit-container">
                        <textarea
                            value={editContent}
                            onChange={handleContentChange}
                            onBlur={handleContentBlur}
                            onKeyDown={handleKeyDown}
                            className="node-edit-input"
                            autoFocus
                        />
                    </div>
                </foreignObject>
            ) : (
                <text
                    className="node-text"
                    x="60"
                    y="35"
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {node.content}
                </text>
            )}

            {/* Selection indicator */}
            {isSelected && (
                <rect
                    className="node-selection"
                    width="120"
                    height="60"
                    rx="8"
                    ry="8"
                    fill="none"
                    stroke="#007bff"
                    strokeWidth="2"
                />
            )}
        </g>
    );
};

export default NodeItem; 