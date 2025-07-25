import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { verifyOTP, clearError } from '../../../store/auth/authSlice';
import BrainLogo from '../../../utils/brainmage';
import './Auth.css';
import log from "../../../utils/logger.js";

const OtpVerificationPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated, otpEmail } = useSelector(state => state.auth);
    const [otp, setOtp] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            log.debug('OtpVerificationPage', 'User is authenticated, redirecting to dashboard');
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        log.debug('OtpVerificationPage', 'Verifying OTP');
        dispatch(clearError());
        dispatch(verifyOTP({ email: otpEmail, token: otp }));
    };

    if (!otpEmail) {
        return (
            <div className="auth-container">
                <div className="auth-logo-container">
                    <div className="auth-logo">
                        <BrainLogo width={220} height={220} />
                    </div>
                    <h1 className="auth-welcome-text">Invalid Access</h1>
                </div>
                <div className="auth-error">Please start from the login page</div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-logo-container">
                <div className="auth-logo">
                    <BrainLogo width={220} height={220} />
                </div>
                <h1 className="auth-welcome-text">Verify OTP</h1>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-message">
                    We've sent a one-time password to {otpEmail}
                </div>

                <div className="auth-input-group">
                    <input
                        type="text"
                        className="auth-input"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="auth-button"
                    disabled={loading || !otp}
                >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
            </form>

            {error && <div className="auth-error">{error}</div>}
        </div>
    );
};

export default OtpVerificationPage;
