import React, { useRef, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppSelector.js';
import { setZoom, setPan, resetView } from '../../store/ui/uiSlice.js';
import { setSelectedNode, clearSelection } from '../../store/mindMap/mindMapSlice.js';
import NodeItem from './NodeItem.jsx';
import EdgeLine from './EdgeLine.jsx';
import './MindMapCanvas.css';

const MindMapCanvas = () => {
    const canvasRef = useRef(null);
    const dispatch = useAppDispatch();

    const { currentMindMap, selectedNodeId } = useAppSelector(state => state.mindMap);
    const { zoom, pan, showGrid, gridSize } = useAppSelector(state => state.ui);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
        dispatch(setZoom(newZoom));
    }, [zoom, dispatch]);

    const handleMouseDown = useCallback((e) => {
        if (e.target === canvasRef.current) {
            dispatch(clearSelection());
        }
    }, [dispatch]);

    const handleDoubleClick = useCallback((e) => {
        if (e.target === canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;

            // TODO: Add node at position
            console.log('Add node at:', { x, y });
        }
    }, [pan, zoom]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('dblclick', handleDoubleClick);

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('dblclick', handleDoubleClick);
        };
    }, [handleWheel, handleMouseDown, handleDoubleClick]);

    if (!currentMindMap) {
        return (
            <div className="mindmap-canvas empty">
                <div className="empty-state">
                    <h3>No Mind Map Loaded</h3>
                    <p>Create a new mind map or load an existing one to get started.</p>
                </div>
            </div>
        );
    }

    const nodes = currentMindMap.getAllNodes();
    const edges = currentMindMap.getAllEdges();

    return (
        <div className="mindmap-canvas" ref={canvasRef}>
            <svg className="canvas-svg">
                <defs>
                    <pattern
                        id="grid"
                        width={gridSize * zoom}
                        height={gridSize * zoom}
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`}
                            fill="none"
                            stroke="#e0e0e0"
                            strokeWidth="1"
                            opacity={showGrid ? 0.5 : 0}
                        />
                    </pattern>
                </defs>

                <rect
                    width="100%"
                    height="100%"
                    fill="url(#grid)"
                />

                <g
                    transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                    className="mindmap-content"
                >
                    {/* Render edges first (behind nodes) */}
                    {edges.map(edge => (
                        <EdgeLine
                            key={edge.id}
                            edge={edge}
                            sourceNode={currentMindMap.getNode(edge.sourceNodeId)}
                            targetNode={currentMindMap.getNode(edge.targetNodeId)}
                            isSelected={selectedNodeId === edge.id}
                        />
                    ))}

                    {/* Render nodes */}
                    {nodes.map(node => (
                        <NodeItem
                            key={node.id}
                            node={node}
                            isSelected={selectedNodeId === node.id}
                            onSelect={() => dispatch(setSelectedNode(node.id))}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
};

export default MindMapCanvas; 