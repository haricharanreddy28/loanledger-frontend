import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import '../styles/auth.css';

const ADMIN_EMAIL = (process.env.REACT_APP_ADMIN_EMAIL || 'admin@loanledger.com').trim().toLowerCase();

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', pin: '', password: '' });
    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [userMobile, setUserMobile] = useState('');
    const [showResetPin, setShowResetPin] = useState(false);
    const [resetMobile, setResetMobile] = useState('+91');
    const [resetOtp, setResetOtp] = useState('');
    const [resetPin, setResetPin] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const inputRef = useRef(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const normalizedEmail = formData.email.trim().toLowerCase();
    const isAdmin = normalizedEmail === ADMIN_EMAIL || normalizedEmail.endsWith('@owner.com');

    const handleEmailChange = useCallback((e) => {
        const email = e.target.value;
        setFormData(prev => ({ ...prev, email }));
    }, []);

    const handleEmailKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.focus();
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        
        if (isAdmin) {
            if (!formData.password.trim()) {
                newErrors.password = 'Admin password is required';
            } else if (formData.password.trim().length < 4) {
                newErrors.password = 'Admin password is too short';
            }
        } else {
            if (!formData.pin.trim()) {
                newErrors.pin = 'PIN is required';
            } else if (formData.pin.trim().length !== 6) {
                newErrors.pin = 'PIN must be exactly 6 digits';
            } else if (!/^\d+$/.test(formData.pin.trim())) {
                newErrors.pin = 'PIN must contain only digits';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInitialLogin = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setApiError('');
        try {
            const trimmedEmail = formData.email.trim().toLowerCase();
            
            const payload = { email: trimmedEmail };
            if (isAdmin) {
                payload.password = formData.password.trim();
            } else {
                payload.pin = formData.pin.trim();
            }
            
            const response = await axiosInstance.post('/auth/login', payload);
            if (response.data.otpRequired) {
                setShowOtp(true);
                setUserMobile(response.data.mobile);
            } else {
                completeLogin(response.data);
            }
        } catch (err) {
            setApiError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        if (otp.length !== 6) {
            setErrors({ otp: 'Enter 6-digit OTP' });
            return;
        }
        setLoading(true);
        setApiError('');
        try {
            const payload = { mobile: userMobile, otp };
            const response = await axiosInstance.post('/auth/login/verify', payload);
            completeLogin(response.data);
        } catch (err) {
            setApiError(err.response?.data?.message || 'Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    const completeLogin = (data) => {
        login(data);
        navigate('/');
    };

    const handleSendResetOtp = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setApiError('');
        setErrors({});
        try {
            await axiosInstance.post('/auth/pin/reset/send-otp', { mobile: resetMobile });
        } catch (err) {
            setApiError(err.response?.data?.message || 'Failed to send reset OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmResetPin = async (e) => {
        if (e) e.preventDefault();
        const newErrors = {};
        if (!resetMobile.trim()) newErrors.resetMobile = 'Mobile is required';
        if (resetOtp.trim().length !== 6) newErrors.resetOtp = 'Enter 6-digit OTP';
        if (resetPin.trim().length !== 6) newErrors.resetPin = 'PIN must be exactly 6 digits';
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);
        setApiError('');
        try {
            await axiosInstance.post('/auth/pin/reset/confirm', { mobile: resetMobile, otp: resetOtp, newPin: resetPin });
            setApiError('PIN reset successful. Please log in.');
            setShowResetPin(false);
            setResetOtp('');
            setResetPin('');
        } catch (err) {
            setApiError(err.response?.data?.message || 'PIN reset failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-brand">Loan Ledger</span>
                    <h1 className="auth-title">
                        {showResetPin ? 'Reset Security PIN' : (showOtp ? 'Security Check' : 'Welcome Back')}
                    </h1>
                    <p className="auth-subtitle">
                        {showResetPin
                            ? 'Verify via SMS and set a new PIN'
                            : showOtp
                            ? 'Enter the verification code sent via SMS'
                            : 'Sign in to access your dashboard'}
                    </p>
                </div>

                <div className="auth-body">
                    {apiError && (
                        <div className="auth-alert-danger">{apiError}</div>
                    )}

                    {showResetPin ? (
                        <form onSubmit={handleConfirmResetPin} className="otp-container">
                            <div className="auth-form-group">
                                <label className="auth-label">Mobile Number</label>
                                <input
                                    type="text"
                                    className={`auth-input ${errors.resetMobile ? 'is-invalid' : ''}`}
                                    placeholder="+91XXXXXXXXXX"
                                    value={resetMobile}
                                    onChange={e => setResetMobile(e.target.value)}
                                    required
                                />
                                {errors.resetMobile && <div className="auth-error-msg">{errors.resetMobile}</div>}
                            </div>

                            <button
                                type="button"
                                onClick={handleSendResetOtp}
                                className="auth-btn-secondary"
                                disabled={loading}
                                style={{ marginBottom: '10px' }}
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>

                            <div className="auth-form-group">
                                <label className="auth-label">OTP</label>
                                <input
                                    type="text"
                                    className={`auth-input otp-input-field ${errors.resetOtp ? 'is-invalid' : ''}`}
                                    placeholder="000000"
                                    maxLength="6"
                                    value={resetOtp}
                                    onChange={e => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                                {errors.resetOtp && <div className="auth-error-msg">{errors.resetOtp}</div>}
                            </div>

                            <div className="auth-form-group">
                                <label className="auth-label">New 6-Digit PIN</label>
                                <input
                                    type="password"
                                    className={`auth-input ${errors.resetPin ? 'is-invalid' : ''}`}
                                    placeholder="XXXXXX"
                                    maxLength="6"
                                    value={resetPin}
                                    onChange={e => setResetPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                                {errors.resetPin && <div className="auth-error-msg">{errors.resetPin}</div>}
                            </div>

                            <button
                                type="submit"
                                className="auth-btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Resetting...' : 'Confirm Reset'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setShowResetPin(false); setApiError(''); setErrors({}); }}
                                className="auth-btn-secondary"
                                style={{ marginTop: '10px' }}
                            >
                                Back to Login
                            </button>
                        </form>
                    ) : !showOtp ? (
                        <form onSubmit={handleInitialLogin}>
                            {/* Email */}
                            <div className="auth-form-group">
                                <label className="auth-label">Email Address</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleEmailChange}
                                    onKeyDown={handleEmailKeyDown}
                                    autoComplete="email"
                                    required
                                />
                                {errors.email && <div className="auth-error-msg">{errors.email}</div>}
                            </div>

                            {/* Dynamic Credential: PIN or Password */}
                            <div className="auth-form-group">
                                <label className="auth-label">
                                    {isAdmin ? 'Admin Password' : '6-Digit Secure PIN'}
                                </label>
                                {isAdmin && (
                                    <div className="auth-admin-badge" style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '5px' }}>
                                        🔐 Owner Domain Detected
                                    </div>
                                )}
                                <input
                                    id={isAdmin ? "login-password" : "login-pin"}
                                    ref={inputRef}
                                    type="password"
                                    inputMode={isAdmin ? "text" : "numeric"}
                                    className={`auth-input ${errors[isAdmin ? 'password' : 'pin'] ? 'is-invalid' : ''}`}
                                    placeholder={isAdmin ? "Enter Admin Password" : "6-digit PIN"}
                                    maxLength={isAdmin ? undefined : 6}
                                    value={isAdmin ? formData.password : formData.pin}
                                    onChange={e => {
                                        if (isAdmin) {
                                            setFormData(prev => ({ ...prev, password: e.target.value }));
                                        } else {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setFormData(prev => ({ ...prev, pin: val }));
                                        }
                                    }}
                                    autoComplete={isAdmin ? "current-password" : "off"}
                                    required
                                />
                                {errors[isAdmin ? 'password' : 'pin'] && (
                                    <div className="auth-error-msg">{errors[isAdmin ? 'password' : 'pin']}</div>
                                )}
                            </div>

                            <button
                                id="login-submit-btn"
                                type="submit"
                                className="auth-btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Authenticating...' : 'Sign In Securely'}
                            </button>

                            {!isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => { setShowResetPin(true); setApiError(''); setErrors({}); }}
                                    className="auth-btn-link"
                                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.85rem', marginTop: '12px', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                                >
                                    Forgot Security PIN?
                                </button>
                            )}
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="otp-container">
                            <div className="otp-mobile-badge">{userMobile}</div>
                            <div className="auth-form-group">
                                <label className="auth-label">Verification Code</label>
                                <input
                                    id="login-otp"
                                    type="text"
                                    className={`auth-input otp-input-field ${errors.otp ? 'is-invalid' : ''}`}
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    autoFocus
                                />
                                {errors.otp && <div className="auth-error-msg">{errors.otp}</div>}
                            </div>
                            <button
                                id="otp-verify-btn"
                                type="submit"
                                className="auth-btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowOtp(false)}
                                className="auth-btn-secondary"
                                style={{ marginTop: '10px' }}
                            >
                                Use Different Account
                            </button>
                        </form>
                    )}

                    <div className="auth-footer">
                        New to Loan Ledger? <Link to="/register" className="auth-footer-link">Create Account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
