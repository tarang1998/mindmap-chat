import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { resetPassword, clearError } from '../../../store/auth/authSlice';
import BrainLogo from '../../../utils/brainmage';
import log from '../../../utils/logger';
import './Auth.css';

const ResetPasswordPage = () => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.auth);
    const [email, setEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        log.debug('ResetPasswordPage', 'User attempting password reset');
        dispatch(clearError());
        
        const result = await dispatch(resetPassword(email));
        if (!result.error) {
            setResetSent(true);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-logo-container">
                <div className="auth-logo">
                    <BrainLogo width={220} height={220} />
                </div>
                <h1 className="auth-welcome-text">Forgot Password</h1>
            </div>

            {!resetSent ? (
                <form className="auth-form" onSubmit={handleResetPassword}>
                    <p className="auth-description">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

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

                    <button
                        type="submit"
                        style={{
                            marginTop: '6px',
                        }}
                        className="auth-button"
                        disabled={loading || !email}
                    >
                        {loading ? 'Sending...' : 'Reset Password'}
                    </button>

                    <Link to="/login" className="auth-link" style={{ marginTop: '16px' }}>
                        Back to login
                    </Link>
                </form>
            ) : (
                <div className="auth-form">
                    <div className="auth-success">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <p>Check your email</p>
                        <p className="auth-success-description">
                           If the email exists, you’ll get a reset link shortly
                        </p>
                    </div>

                    <Link to="/login" className="auth-link" style={{ marginTop: '16px' }}>
                        Back to login
                    </Link>
                </div>
            )}

            {error && <div className="auth-error">{error}</div>}
        </div>
    );
};

export default ResetPasswordPage;
