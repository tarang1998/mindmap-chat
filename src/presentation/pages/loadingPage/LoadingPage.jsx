import React from 'react';
import BrainLogo from '../../../utils/brainmage';
import './LoadingPage.css';

const LoadingPage = ({ message = "Loading..." }) => {
    return (
        <div className="loading-container">
            <div className="loading-logo">
                <BrainLogo width={180} height={180} />
            </div>
            <p className="loading-text">{message}</p>
        </div>
    );
};

export default LoadingPage;
