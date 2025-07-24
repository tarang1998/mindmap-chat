import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../app/store.js';
import { ErrorBoundaryWrapper } from './pages/errorPage/ErrorBoundary.jsx';
import ProjectDashboard from './pages/projectDashboard/ProjectDashboard.jsx';
import MindMapPage from './pages/mindMapPage/MindMapPage.jsx';
import LoginPage from './pages/authPages/LoginPage.jsx';
import SignupPage from './pages/authPages/SignupPage.jsx';
import SplashPage from './pages/splashPage/SplashPage.jsx';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = store.getState().auth.isAuthenticated;
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <ErrorBoundaryWrapper>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<SplashPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route 
                                path="/dashboard" 
                                element={
                                    <ProtectedRoute>
                                        <ProjectDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/mindmap/:id" 
                                element={
                                    <ProtectedRoute>
                                        <MindMapPage />
                                    </ProtectedRoute>
                                } 
                            />
                        </Routes>
                    </BrowserRouter>
                </ErrorBoundaryWrapper>
            </PersistGate>
        </Provider>
    );
};

export default App;

