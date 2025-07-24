import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Spinner, Dropdown } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createMindMap, fetchAllMindMaps, updateMindMapTitle, deleteMindMap } from '../../../store/mindMap/mindMapSlice';
import { signOut } from '../../../store/auth/authSlice';
import BrainLogo from '../../../utils/brainmage';
import './projectDashboard.css';
import './deletePopup.css';
import './renamePopup.css';
import './createProject.css';
import './header.css';
import Grid from '@mui/material/Grid';
import log from '../../../utils/logger'

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
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteMapId, setDeleteMapId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);



    useEffect(() => {
        dispatch(fetchAllMindMaps());
    }, [dispatch]);

    const handleCreate = async () => {
        try {
            log.debug("handleCreate", "Creating Mindmap")
            const result = await dispatch(createMindMap({}));

            if (result.payload && result.payload.id) {
                navigate(`/mindmap/${result.payload.id}`);
            }
        } finally {
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
        setDeleteMapId(id);
        setShowDeletePopup(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteMapId) return;
        
        setDeleteLoading(true);
        try {
            const result = await dispatch(deleteMindMap(deleteMapId));
            if (result.error) {
                throw new Error(result.error);
            }
            setShowDeletePopup(false);
            setDeleteMapId(null);
        } catch (error) {
            console.error('Error deleting mindmap:', error);
            alert('Failed to delete project. Please try again.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeletePopup(false);
        setDeleteMapId(null);
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
                                // onKeyDown={handleKeyPress}
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

            {/* Delete Popup */}
            {showDeletePopup && (
                <div className="dashboard-delete-popup-overlay">
                    <div className="dashboard-delete-popup">
                        <div className="dashboard-delete-popup-header">
                            <h3>Delete Project</h3>
                            <button
                                className="dashboard-delete-popup-close"
                                onClick={handleDeleteCancel}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>
                        <div className="dashboard-delete-popup-content">
                            Are you sure you want to delete <strong>{mindmaps.find(m => m.id === deleteMapId)?.title || 'this project'}</strong>?
                            <br />
                            This action cannot be undone.
                        </div>
                        <div className="dashboard-delete-popup-actions">
                            <button
                                className="dashboard-delete-btn-cancel"
                                onClick={handleDeleteCancel}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="dashboard-delete-btn-confirm"
                                onClick={handleDeleteConfirm}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="dashboard-header">
                    <div className="dashboard-logo-container">
                        <BrainLogo width={100} height={100} className="dashboard-logo" />
                    </div>
                    <button
                        className="dashboard-signout-button"
                        onClick={() => {
                            dispatch(signOut()).then(() => {
                                navigate('/login');
                            });
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </button>
            </div>
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
                        {mindmaps.map((map, index) => (
                            <Grid
                                // item size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 3 }}
                                // xs={12} sm={6} md={4} lg={3} xl={3}
                                key={map.id}
                            >
                                <Card
                                    bg="dark"
                                    text="light"
                                    className="dashboard-mindmap-card"
                                    onClick={() => handleOpen(map.id)}
                                >
                                    <Card.Header className="dashboard-mindmap-card-header" style={{ background: 'transparent', border: 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                                            <div className="card-logo-container">
                                                <svg width="45" height="45" viewBox="0 0 24 24" style={{ display: 'block' }}>
                                                    <g fill={`hsl(${(index % 18) * 20}, 70%, 65%)`}>
                                                        {/* Circle */}
                                                        {index % 18 === 0 && <circle cx="12" cy="12" r="8" />}
                                                        
                                                        {/* Square */}
                                                        {index % 18 === 1 && <rect x="4" y="4" width="16" height="16" />}
                                                        
                                                        {/* Triangle */}
                                                        {index % 18 === 2 && <polygon points="12,4 20,20 4,20" />}
                                                        
                                                        {/* Star */}
                                                        {index % 18 === 3 && (
                                                            <path d="M12 2l2.4 7.4h7.6l-6 4.4 2.3 7.2-6.3-4.6-6.3 4.6 2.3-7.2-6-4.4h7.6z" />
                                                        )}
                                                        
                                                        {/* Hexagon */}
                                                        {index % 18 === 4 && (
                                                            <polygon points="12,3 21,8.5 21,15.5 12,21 3,15.5 3,8.5" />
                                                        )}
                                                        
                                                        {/* Four Squares */}
                                                        {index % 18 === 5 && (
                                                            <g>
                                                                <rect x="4" y="4" width="7" height="7" />
                                                                <rect x="13" y="4" width="7" height="7" />
                                                                <rect x="4" y="13" width="7" height="7" />
                                                                <rect x="13" y="13" width="7" height="7" />
                                                            </g>
                                                        )}
                                                        
                                                        {/* Diamond with Circle */}
                                                        {index % 18 === 6 && (
                                                            <g>
                                                                <polygon points="12,4 20,12 12,20 4,12" />
                                                                <circle cx="12" cy="12" r="3" fill="#23272f" />
                                                            </g>
                                                        )}

                                                        {/* Flower */}
                                                        {index % 18 === 7 && (
                                                            <g>
                                                                <circle cx="12" cy="12" r="3" />
                                                                <circle cx="12" cy="6" r="3" />
                                                                <circle cx="18" cy="12" r="3" />
                                                                <circle cx="12" cy="18" r="3" />
                                                                <circle cx="6" cy="12" r="3" />
                                                            </g>
                                                        )}

                                                        {/* Spiral */}
                                                        {index % 18 === 8 && (
                                                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c4.4 0 8.1-2.8 9.5-6.7.3-.9-.5-1.7-1.3-1.3-2.8 1.2-6.1-.3-7.3-3.1-.4-1-.7-2.1-.7-3.2 0-2.8 1.1-5.3 2.9-7.1.7-.7.2-1.9-.8-1.6z" />
                                                        )}

                                                        {/* Lightning Bolt */}
                                                        {index % 18 === 9 && (
                                                            <path d="M13 2L4 14h7l-2 8 9-12h-7z" />
                                                        )}

                                                        {/* Infinity */}
                                                        {index % 18 === 10 && (
                                                            <path d="M8 13c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4c0 2.2-1.8 4-4 4z" />
                                                        )}

                                                        {/* Cloud */}
                                                        {index % 18 === 11 && (
                                                            <path d="M18 15c1.1 0 2-.9 2-2s-.9-2-2-2h-.1c0-2.2-1.8-4-4-4-1.6 0-3 1-3.6 2.4-.5-.3-1.2-.4-1.8-.4-2.2 0-4 1.8-4 4s1.8 4 4 4h9.5z" />
                                                        )}

                                                        {/* Target */}
                                                        {index % 18 === 12 && (
                                                            <g>
                                                                <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
                                                                <circle cx="12" cy="12" r="7" fillOpacity="0.4" />
                                                                <circle cx="12" cy="12" r="4" fillOpacity="0.6" />
                                                                <circle cx="12" cy="12" r="2" />
                                                            </g>
                                                        )}

                                                        {/* Puzzle Piece */}
                                                        {index % 18 === 13 && (
                                                            <path d="M20 12c0-1.1-.9-2-2-2h-2v-2c0-1.1-.9-2-2-2s-2 .9-2 2v2h-2c-1.1 0-2 .9-2 2s.9 2 2 2h2v2c0 1.1.9 2 2 2s2-.9 2-2v-2h2c1.1 0 2-.9 2-2z" />
                                                        )}

                                                        {/* Compass */}
                                                        {index % 18 === 14 && (
                                                            <g>
                                                                <circle cx="12" cy="12" r="8" fillOpacity="0.3" />
                                                                <path d="M12 8l-4 8h8z" />
                                                                <circle cx="12" cy="12" r="1" />
                                                            </g>
                                                        )}

                                                        {/* Network */}
                                                        {index % 18 === 15 && (
                                                            <g>
                                                                <circle cx="12" cy="6" r="2" />
                                                                <circle cx="6" cy="18" r="2" />
                                                                <circle cx="18" cy="18" r="2" />
                                                                <path d="M12 8L6 16M12 8l6 8M6 18h12" />
                                                            </g>
                                                        )}

                                                        {/* Brain */}
                                                        {index % 18 === 16 && (
                                                            <path d="M12 2C7.6 2 4 5.6 4 10c0 2.1.8 4 2.1 5.4C6 15.6 6 15.8 6 16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2 0-.2 0-.4-.1-.6C19.2 14 20 12.1 20 10c0-4.4-3.6-8-8-8zm-4 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4-6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                                                        )}

                                                        {/* Wave Pattern */}
                                                        {index % 18 === 17 && (
                                                            <path d="M2 12c2-4 4-6 6-6s4 2 6 6c2 4 4 6 6 6s4-2 6-6" strokeWidth="2" fill="none" stroke="currentColor" />
                                                        )}
                                                    </g>
                                                </svg>
                                            </div>
                                            <div className="dashboard-card-header-actions">
                                                <button
                                                    className="dashboard-card-action-btn dashboard-rename-btn"
                                                    onClick={(e) => handleRename(e, map.id)}
                                                    title="Rename"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                    </svg>
                                                </button>
                                                
                                                <button
                                                    className="dashboard-card-action-btn dashboard-delete-btn"
                                                    onClick={(e) => handleDelete(e, map.id)}
                                                    title="Delete"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="d-flex flex-column justify-content-between h-100 p-0">
                                        <div className="flex-grow-1"></div>
                                    </Card.Body>
                                    <Card.Footer className="dashboard-mindmap-card-footer bg-dark border-0 p-0" style={{ padding: '0 20px 20px 20px' }}>
                                        <div style={{ 
                                            fontSize: 22, 
                                            fontWeight: 600, 
                                            color: '#fff',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            width: '100%'
                                        }} title={map.title}>{map.title}</div>
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