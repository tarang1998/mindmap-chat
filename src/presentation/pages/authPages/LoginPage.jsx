import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, clearError, handleAuthCallback } from '../../../store/auth/authSlice';
import BrainLogo  from '../../../utils/brainmage';
import './Auth.css';
import { checkAuthState } from '../../../store/auth/authSlice';
import log from "../../../utils/logger.js"


const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector(state => state.auth);

    useEffect(() => {
            log.debug('LoginPage', 'Checking auth state');
            dispatch(checkAuthState());
        
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            log.debug('LoginPage', 'User is authenticated, redirecting to dashboard');
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleGoogleSignIn = () => {
        log.debug('LoginPage', 'User is attempting Google sign-in');
        dispatch(clearError());
        dispatch(signInWithGoogle());
    };

    return (
        <div className="auth-container">
            <div className="auth-logo-container">
                <div className="auth-logo">
                      <BrainLogo  width={220} height={220} />
                </div>
              
            </div>
           <button
                className="auth-button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="google-g-icon"
                    style={{ marginRight: '8px' }}
                    aria-hidden="true"
                >
                    <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 
                            5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 
                            8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 
                            2.284A4.35 4.35 0 0 0 8 
                            3.166c-2.087 0-3.86 1.408-4.492 
                            3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 
                            1.893 2.405 3.301 4.492 3.301 
                            1.078 0 2.004-.276 2.722-.764h-.003a3.7 
                            3.7 0 0 0 1.599-2.431H8v-3.08z"/>
                </svg>
                Sign in with Google
            </button>

            <Link to="/signup" className="auth-link">
                Don't have an account? Sign up
            </Link>
            {error && <div className="auth-error">{error}</div>}
        </div>
    );
};

export default LoginPage;
