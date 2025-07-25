import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, signInWithOTP, clearError, handleAuthCallback, checkAuthState, setMagicLinkSent } from '../../../store/auth/authSlice';
import BrainLogo from '../../../utils/brainmage';
import './Auth.css';
import log from "../../../utils/logger.js"


const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated, magicLinkSent, otpEmail } = useSelector(state => state.auth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

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

    useEffect(() => {
        if (otpEmail) {
            log.debug('LoginPage', 'User has received OTP email, redirecting to OTP verification');
            navigate('/verify-otp');
        }
    }, [otpEmail, navigate]);

    const handleEmailSignIn = (e) => {
        e.preventDefault();
        log.debug('LoginPage', 'User is attempting email sign-in');
        dispatch(clearError());
        dispatch(signInWithEmail({ email, password, remember: rememberMe }));
    };

    const handleGoogleSignIn = () => {
        log.debug('LoginPage', 'User is attempting Google sign-in');
        dispatch(clearError());
        dispatch(signInWithGoogle());
    };

    const handleMagicLinkRequest = () => {
        log.debug('LoginPage', 'User is requesting magic link');
        dispatch(clearError());
        dispatch(setMagicLinkSent(false));
        setEmail("")
    };

    const handleSignInWithOTP = () => {
        log.debug('LoginPage', 'User is attempting sign-in with OTP');
        dispatch(clearError());
        dispatch(signInWithOTP({ email }));
    };

    return (
        <div className="auth-container">  
            <div className="auth-logo-container">
                <div className="auth-logo">
                    <BrainLogo width={220} height={220} />
                </div>
                <h1 className="auth-welcome-text">Mind Mapping</h1>
            </div>

            <form className="auth-form" onSubmit={handleEmailSignIn}>
                {!magicLinkSent ? (
                    <>
                    <div className="auth-input-group">
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
{/* 
                 <div className="auth-input-group">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="auth-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div> 

                <div className="auth-remember-forgot">
                    <label className="auth-checkbox-group">
                        <input
                            type="checkbox"
                            className="auth-checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={loading}
                        />
                        Remember me
                    </label>
                    <Link to="/reset-password" className="auth-link">Forgot password?</Link>
                </div>  */}

                    <button
                        type="button"
                        className="auth-button"
                        onClick={handleSignInWithOTP}
                        style={{ marginTop: '10px' }}
                        disabled={loading || !email}
                    >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </>):(
                    <div className="auth-success">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <p>Check your email</p>
                        <p className="auth-success-description">
                           you’ve requested a magic link, you’ll receive it shortly
                        </p>
                        <div style= {{cursor:'pointer'}} onClick={handleMagicLinkRequest} className="auth-signup-link">
                            Request a magic link
                        </div>
                    </div>
                )}
                

                <div className="auth-divider">or continue with</div>

                <button
                    type="button"
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
                        <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"/>
                    </svg>
                    Sign in with Google
                </button>
            </form>

            {/* <Link to="/signup" className="auth-link">
                Don't have an account? Sign up
            </Link> */}

            
            {error && <div className="auth-error">{error}</div>}
        </div>
    );
};

export default LoginPage;
