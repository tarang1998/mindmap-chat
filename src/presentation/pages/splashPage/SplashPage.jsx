import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthState } from '../../../store/auth/authSlice';
import BrainLogo  from '../../../utils/brainmage';
import './SplashPage.css';
import log from "../../../utils/logger.js"


const SplashPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, checkingAuth } = useSelector(state => state.auth);

    useEffect(() => {
        log.debug('SplashPage', 'Checking authentication state');
        dispatch(checkAuthState());
    }, [dispatch]);

    useEffect(() => {
        if (!checkingAuth) {
            log.debug('SplashPage', 'Authentication check complete', `isAuthenticated: ${isAuthenticated}`);
            navigate(isAuthenticated ? '/dashboard' : '/login');
        }
    }, [checkingAuth, isAuthenticated, navigate]);

    return (
        <div className="splash-container">
            <div className="splash-logo">
                <BrainLogo  width={120} height={120} />
            </div>
            
        </div>
    );
};

export default SplashPage;
