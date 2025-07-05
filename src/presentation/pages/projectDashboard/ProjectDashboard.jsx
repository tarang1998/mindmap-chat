import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Spinner, Dropdown } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createMindMap, fetchAllMindMaps, updateMindMapTitle, deleteMindMap } from '../../../store/mindMap/mindMapSlice';
import './projectDashboard.css';
import Grid from '@mui/material/Grid';


export default function ProjectDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const mindmaps = useSelector(state => state.mindMap.mindMaps);
    const loading = useSelector(state => state.mindMap.loading);

    // State for rename popup
    const [showRenamePopup, setShowRenamePopup] = useState(false);
    const [renameMindMapId, setRenameMindMapId] = useState(null);
    const [newName, setNewName] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);
    // Local state for create button
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        dispatch(fetchAllMindMaps());
    }, [dispatch]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const result = await dispatch(createMindMap({}));
            if (result.payload && result.payload.id) {
                navigate(`/mindmap/${result.payload.id}`);
            }
        } finally {
            setCreating(false);
        }
    };

    const handleOpen = (id) => {
        navigate(`/mindmap/${id}`);
    };

    const handleRename = (e, id) => {
        e.stopPropagation();
        const mindmap = mindmaps.find(map => map.id === id);
        setRenameMindMapId(id);
        setNewName(mindmap?.title || '');
        setShowRenamePopup(true);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        const mindmap = mindmaps.find(map => map.id === id);
        const mindmapName = mindmap?.title || 'this project';

        if (window.confirm(`Are you sure you want to delete "${mindmapName}"? This action cannot be undone.`)) {
            dispatch(deleteMindMap(id))
                .then((result) => {
                    if (result.error) {
                        console.error('Error deleting mindmap:', result.error);
                        alert('Failed to delete project. Please try again.');
                    } else {
                        console.log('Mindmap deleted successfully');
                    }
                })
                .catch((error) => {
                    console.error('Error deleting mindmap:', error);
                    alert('Failed to delete project. Please try again.');
                });
        }
    };

    const handleRenameSubmit = async () => {
        if (!newName.trim()) return;

        setRenameLoading(true);
        try {
            await dispatch(updateMindMapTitle({ mindMapId: renameMindMapId, newTitle: newName }));

            // Close popup
            setShowRenamePopup(false);
            setRenameMindMapId(null);
            setNewName('');
        } catch (error) {
            console.error('Error renaming mindmap:', error);
        } finally {
            setRenameLoading(false);
        }
    };

    const handleRenameCancel = () => {
        setShowRenamePopup(false);
        setRenameMindMapId(null);
        setNewName('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            handleRenameCancel();
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#23272f',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                margin: 0,
                padding: 1
            }}
        >
            {/* Rename Popup */}
            {showRenamePopup && (
                <div className="dashboard-rename-popup-overlay">
                    <div className="dashboard-rename-popup">
                        <div className="dashboard-rename-popup-header">
                            <h3>Rename Project</h3>
                            <button
                                className="dashboard-rename-popup-close"
                                onClick={handleRenameCancel}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>
                        <div className="dashboard-rename-popup-content">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Enter new name..."
                                className="dashboard-rename-input"
                                autoFocus
                            />
                        </div>
                        <div className="dashboard-rename-popup-actions">
                            <button
                                className="dashboard-rename-btn-cancel"
                                onClick={handleRenameCancel}
                                disabled={renameLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="dashboard-rename-btn-save"
                                onClick={handleRenameSubmit}
                                disabled={!newName.trim() || renameLoading}
                            >
                                {renameLoading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className='dashboard-container'>
                <Row className="align-items-center mb-4">
                    <Col className="dashboard-title" xs={12}>
                        <h1>Welcome to Mind Mapping</h1>
                    </Col>
                </Row>
                <Row className="align-items-center mb-4">
                    <Col xs={12} className="dashboard-create-project">
                        <Button
                            variant="light"
                            onClick={handleCreate}
                            className='dashboard-create-project-button'
                        >
                            + Create new
                        </Button>
                    </Col>
                </Row>
                {loading ? (
                    <Row className="">
                        <div className="dashboard-loading">
                            <Spinner animation="border" variant="light" />
                            <div style={{ color: '#aaa', marginTop: 16 }}>Loading…</div>
                        </div>
                    </Row>
                ) : (
                    <Grid container className="dashboard-mindmap">
                        {mindmaps.map(map => (
                            <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={map.id} style={{ padding: '12px' }}>
                                <Card
                                    bg="dark"
                                    text="light"
                                    className="dashboard-mindmap-card"
                                    onClick={() => handleOpen(map.id)}
                                >
                                    <Card.Header className="dashboard-mindmap-card-header bg-dark border-0 p-0" style={{ padding: '5px 5px 0 10px', background: 'transparent' }}>
                                        <div className="dashboard-card-header-actions">
                                            <button
                                                className="dashboard-card-action-btn dashboard-rename-btn"
                                                onClick={(e) => handleRename(e, map.id)}
                                                title="Rename"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="dashboard-card-action-btn dashboard-delete-btn"
                                                onClick={(e) => handleDelete(e, map.id)}
                                                title="Delete"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="d-flex flex-column justify-content-between h-100 p-0">
                                        <div className="flex-grow-1"></div>
                                    </Card.Body>
                                    <Card.Footer className="dashboard-mindmap-card-footer bg-dark border-0 p-0" style={{ padding: '0 20px 20px 20px' }}>
                                        <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{map.title}</div>
                                        <div style={{ fontSize: 14, color: '#aaa', marginBottom: 2 }}>
                                            Last updated: {map.updated_at ? new Date(map.updated_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </div>
        </div>
    );
} 