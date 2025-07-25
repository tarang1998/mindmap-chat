import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrainLogo from '../../../utils/brainmage';
import './ErrorPage.css';
import {  useDispatch,} from 'react-redux';
import { addError } from '../../../store/error/errorSlice';

const ErrorPage = ({ message = "", stack = null }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(addError({
                    type: 'error',
                    message: message,
                    stack: stack,
                    
                }));
    },[dispatch])

    return (
        <div className="error-container">
            <div className="error-logo">
                <BrainLogo width={180} height={180} />
            </div>
            <h1 className="error-title">Oops! Something went wrong</h1>
            <p className="error-message">{message}</p>
            <button 
                className="error-button"
                onClick={() => navigate('/dashboard')}
            >
                Return to Dashboard
            </button>
        </div>
    );
};

export default ErrorPage;
