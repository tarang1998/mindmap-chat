import React from 'react';
import MindMapPage from './pages/mindMapPage/MindMapPage.jsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../app/store.js';
import { ErrorBoundaryWrapper } from './pages/errorPage/ErrorBoundary.jsx';
import ProjectDashboard from './pages/projectDashboard/ProjectDashboard.jsx'
import './App.css';

// Loading Overlay Component
const LoadingOverlay = () => {
    const loading = useSelector(state => state.mindMap.loading);

    if (!loading) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: '#2c313a',
                borderRadius: '12px',
                padding: '32px 48px',
                border: '1px solid #353945',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                minWidth: '200px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #353945',
                    borderTop: '3px solid #4f8cff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <div style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '500',
                    textAlign: 'center'
                }}>
                    Loading ...
                </div>
            </div>
        </div>
    );
};

// App Content Component (needs to be inside Provider to access Redux state)
const AppContent = () => {
    return (
        <div className="app">
            <ErrorBoundaryWrapper>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<ProjectDashboard />} />
                        <Route path="/mindmap/:mindMapId" element={<MindMapPage />} />
                    </Routes>
                </BrowserRouter>
                <LoadingOverlay />
            </ErrorBoundaryWrapper>
        </div>
    );
};

const App = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
                <AppContent />
            </PersistGate>
        </Provider>
    );
};

export default App;

