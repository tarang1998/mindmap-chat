import React from 'react';
import { useAppSelector } from '../../hooks/useAppSelector.js';
import './Sidebar.css';

const Sidebar = ({ selectedNodeId, currentMindMap }) => {
    const { theme, nodeSize, edgeStyle, colorScheme } = useAppSelector(state => state.ui);

    const selectedNode = selectedNodeId && currentMindMap
        ? currentMindMap.getNode(selectedNodeId)
        : null;

    const nodeCount = currentMindMap ? currentMindMap.getAllNodes().length : 0;
    const edgeCount = currentMindMap ? currentMindMap.getAllEdges().length : 0;

    return (
        <div className="sidebar">
            <div className="sidebar-section">
                <h3>Mind Map Info</h3>
                {currentMindMap ? (
                    <div className="info-item">
                        <label>Title:</label>
                        <span>{currentMindMap.title}</span>
                    </div>
                ) : (
                    <p>No mind map loaded</p>
                )}
            </div>

            {currentMindMap && (
                <div className="sidebar-section">
                    <h3>Statistics</h3>
                    <div className="info-item">
                        <label>Nodes:</label>
                        <span>{nodeCount}</span>
                    </div>
                    <div className="info-item">
                        <label>Connections:</label>
                        <span>{edgeCount}</span>
                    </div>
                    <div className="info-item">
                        <label>Created:</label>
                        <span>{currentMindMap.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                        <label>Updated:</label>
                        <span>{currentMindMap.updatedAt.toLocaleDateString()}</span>
                    </div>
                </div>
            )}

            {selectedNode && (
                <div className="sidebar-section">
                    <h3>Selected Node</h3>
                    <div className="info-item">
                        <label>Content:</label>
                        <span>{selectedNode.content}</span>
                    </div>
                    <div className="info-item">
                        <label>Position:</label>
                        <span>X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}</span>
                    </div>
                    <div className="info-item">
                        <label>Children:</label>
                        <span>{selectedNode.children.length}</span>
                    </div>
                    <div className="info-item">
                        <label>Parent:</label>
                        <span>{selectedNode.parentId ? 'Yes' : 'Root'}</span>
                    </div>
                </div>
            )}

            <div className="sidebar-section">
                <h3>Settings</h3>
                <div className="info-item">
                    <label>Theme:</label>
                    <span>{theme}</span>
                </div>
                <div className="info-item">
                    <label>Node Size:</label>
                    <span>{nodeSize}</span>
                </div>
                <div className="info-item">
                    <label>Edge Style:</label>
                    <span>{edgeStyle}</span>
                </div>
                <div className="info-item">
                    <label>Color Scheme:</label>
                    <span>{colorScheme}</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar; 