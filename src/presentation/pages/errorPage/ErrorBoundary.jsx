import React from 'react';
import { addError } from '../../../store/error/errorSlice.js';
import './ErrorBoundary.css';
import { useDispatch } from 'react-redux';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to Redux store
        this.props.dispatch(addError({
            type: 'boundary',
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo?.componentStack || 'No component stack available'
        }));
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <h2>Something went wrong</h2>
                        <p>We're sorry, but something unexpected happened. Please try refreshing the page.</p>

                        {process.env.NODE_ENV === 'development' && (
                            <details className="error-details">
                                <summary>Error Details</summary>
                                <pre>{this.state.error && this.state.error.toString()}</pre>
                                <pre>{this.state.errorInfo?.componentStack || 'No component stack available'}</pre>
                            </details>
                        )}

                        <div className="error-actions">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                                className="btn btn-secondary"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper component to provide dispatch
export const ErrorBoundaryWrapper = ({ children }) => {
    const dispatch = useDispatch();
    return (
        <ErrorBoundary dispatch={dispatch}>
            {children}
        </ErrorBoundary>
    );
}; 