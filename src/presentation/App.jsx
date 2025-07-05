import React from 'react';
import MindMapPage from './pages/mindMapPage/MindMapPage.jsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../app/store.js';
import { ErrorBoundaryWrapper } from './pages/errorPage/ErrorBoundary.jsx';
import ProjectDashboard from './pages/projectDashboard/ProjectDashboard.jsx'
import './App.css';

const App = () => {
    return (
        //  A component that catches JavaScript errors anywhere in the child component tree 
        // and displays an error page

        <div className="app">

            <Provider store={store}>
                <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
                    <ErrorBoundaryWrapper>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" element={<ProjectDashboard />} />
                                <Route path="/mindmap/:mindMapId" element={<MindMapPage />} />
                            </Routes>
                        </BrowserRouter>
                    </ErrorBoundaryWrapper>

                </PersistGate>
            </Provider>
        </div>


    );
};

export default App;

