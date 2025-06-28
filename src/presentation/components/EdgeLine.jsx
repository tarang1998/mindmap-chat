import React from 'react';
import { useAppSelector } from '../../hooks/useAppSelector.js';
import './EdgeLine.css';

const EdgeLine = ({ edge, sourceNode, targetNode, isSelected }) => {
    const { edgeStyle, colorScheme } = useAppSelector(state => state.ui);

    if (!sourceNode || !targetNode) return null;

    const startX = sourceNode.position.x + 60; // Center of source node
    const startY = sourceNode.position.y + 30;
    const endX = targetNode.position.x + 60; // Center of target node
    const endY = targetNode.position.y + 30;

    // Calculate control points for curved line
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const offset = Math.abs(endX - startX) * 0.3;

    const path = `M ${startX} ${startY} Q ${midX} ${midY - offset} ${endX} ${endY}`;

    const getEdgeClasses = () => {
        const classes = ['edge-line'];
        if (isSelected) classes.push('selected');
        classes.push(`style-${edgeStyle}`);
        classes.push(`theme-${colorScheme}`);
        return classes.join(' ');
    };

    return (
        <g className={getEdgeClasses()}>
            <path
                d={path}
                fill="none"
                stroke={edge.style.color}
                strokeWidth={edge.style.width}
                opacity={edge.style.opacity}
                markerEnd="url(#arrowhead)"
            />

            {isSelected && (
                <path
                    d={path}
                    fill="none"
                    stroke="#007bff"
                    strokeWidth={edge.style.width + 4}
                    opacity="0.3"
                />
            )}
        </g>
    );
};

export default EdgeLine; 