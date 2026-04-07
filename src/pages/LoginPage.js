import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import '../styles/auth.css';

const ADMIN_EMAIL = 'gouravkarumudi6@gmail.com';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', pin: '', password: '' });
    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [userMobile, setUserMobile] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const inputRef = useRef(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const isAdmin = formData.email.trim().toLowerCase().endsWith('@owner.com');

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

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-brand">Loan Ledger</span>
                    <h1 className="auth-title">
                        {showOtp ? 'Security Check' : 'Welcome Back'}
                    </h1>
                    <p className="auth-subtitle">
                        {showOtp
                            ? 'Enter the verification code sent via SMS'
                            : 'Sign in to access your dashboard'}
                    </p>
                </div>

                <div className="auth-body">
                    {apiError && (
                        <div className="auth-alert-danger">{apiError}</div>
                    )}

                    {!showOtp ? (
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