import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../app/store.js';
import { ErrorBoundaryWrapper } from './components/ErrorBoundary.jsx';
import MindMapPage from './pages/MindMapPage.jsx';
import './App.css';

const App = () => {
    return (
        //  A component that catches JavaScript errors anywhere in the child component tree 
        // and displays an error page
        <ErrorBoundaryWrapper>
            <div className="app">
                <MindMapPage />
            </div>
        </ErrorBoundaryWrapper>

    );
};

export default App;

