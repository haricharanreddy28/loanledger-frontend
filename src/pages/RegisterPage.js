import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const RegisterPage = () => {
    const [step, setStep] = useState('details');
    const [formData, setFormData] = useState({
        name: '', email: '', role: 'BORROWER', mobile: '+91', pin: ''
    });
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const validateDetails = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email address is required';
        if (!formData.mobile.startsWith('+91') || formData.mobile.length !== 13)
            newErrors.mobile = 'Mobile format: +91XXXXXXXXXX';
        if (formData.pin.length !== 6 || !/^[0-9]+$/.test(formData.pin)) {
            newErrors.pin = 'PIN must be exactly 6 digits';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (!validateDetails()) return;

        setLoading(true);
        setApiError('');
        try {
            await axiosInstance.post('/auth/register/send-otp', { mobile: formData.mobile });
            setStep('otp');
        } catch (err) {
            setApiError(err.response?.data?.message || 'Failed to send SMS OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();

        const newErrors = {};
        if (otp.length !== 6) {
            newErrors.otp = 'Enter 6-digit OTP code';
        }
        if (formData.pin.length !== 6) {
            newErrors.pin = 'PIN must be exactly 6 digits';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setApiError('');
        try {
            const verifyData = {
                name: formData.name,
                email: formData.email,
                phone: formData.mobile,
                otp,
                pin: formData.pin,
                role: formData.role
            };
            const response = await axiosInstance.post('/auth/register/verify', verifyData);

            if (response.data.approved) {
                login(response.data);
                navigate('/');
            } else {
                alert('Account registered! Status: Pending Admin Approval. Please check back later.');
                navigate('/login');
            }
        } catch (err) {
            setApiError(err.response?.data?.message || 'Verification failed. Please check the OTP or try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px' }}>
                <div className="auth-header">
                    <span className="auth-brand">Loan Ledger</span>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join our secure lending ecosystem in minutes</p>
                </div>

                <div className="auth-body">
                    {apiError && <div className="auth-alert-danger">{apiError}</div>}

                    {step === 'details' && (
                        <form onSubmit={handleSendOtp}>
                            <div className="auth-form-group">
                                <label className="auth-label">Full Name</label>
                                <input
                                    type="text"
                                    className={`auth-input ${errors.name ? 'is-invalid' : ''}`}
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                {errors.name && <div className="auth-error-msg">{errors.name}</div>}
                            </div>
                            <div className="auth-form-group">
                                <label className="auth-label">Email Address</label>
                                <input
                                    type="email"
                                    className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                {errors.email && <div className="auth-error-msg">{errors.email}</div>}
                            </div>
                            <div className="auth-form-group">
                                <label className="auth-label">Mobile Number</label>
                                <input
                                    type="text"
                                    className={`auth-input ${errors.mobile ? 'is-invalid' : ''}`}
                                    placeholder="+91XXXXXXXXXX"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    required
                                />
                                {errors.mobile && <div className="auth-error-msg">{errors.mobile}</div>}
                            </div>
                            <div className="auth-form-group">
                                <label className="auth-label">Set Your Secure login PIN</label>
                                <input
                                    type="password"
                                    className={`auth-input ${errors.pin ? 'is-invalid' : ''}`}
                                    placeholder="XXXXXX"
                                    maxLength="6"
                                    value={formData.pin}
                                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                    required
                                />
                                {errors.pin && <div className="auth-error-msg">{errors.pin}</div>}
                            </div>

                            <label className="auth-label">Select Your Role</label>
                            <div className="role-selector">
                                {['BORROWER', 'LENDER', 'ANALYST'].map(r => (
                                    <div
                                        key={r}
                                        className={`role-option ${formData.role === r ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, role: r })}
                                    >
                                        {r.replace('_', ' ')}
                                    </div>
                                ))}
                            </div>

                            <button type="submit" className="auth-btn-primary" disabled={loading}>
                                {loading ? 'Processing...' : 'Next: SMS Verification'}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="otp-container">
                            <div className="auth-section-title" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px' }}>
                                Step 2: Final Verification
                            </div>
                            <div className="otp-mobile-badge" style={{ marginBottom: '10px' }}>{formData.mobile}</div>
                            
                            <div className="auth-form-group">
                                <label className="auth-label">Enter 6-Digit OTP</label>
                                <input
                                    type="text"
                                    className={`auth-input otp-input-field ${errors.otp ? 'is-invalid' : ''}`}
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    autoFocus
                                />
                                {errors.otp && <div className="auth-error-msg">{errors.otp}</div>}
                            </div>

                            <div className="auth-form-group" style={{ textAlign: 'left' }}>
                                <label className="auth-label">Set Your Secure login PIN</label>
                                <input
                                    type="password"
                                    className={`auth-input ${errors.pin ? 'is-invalid' : ''}`}
                                    placeholder="XXXXXX"
                                    maxLength="6"
                                    value={formData.pin}
                                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                />
                                <small style={{ display: 'block', marginTop: '5px', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                                    Use this 6-digit PIN for quick & secure future logins.
                                </small>
                                {errors.pin && <div className="auth-error-msg">{errors.pin}</div>}
                            </div>

                            <button type="submit" className="auth-btn-primary" disabled={loading}>
                                {loading ? 'Finalizing...' : 'Complete Secure Registration'}
                            </button>
                            <button type="button" onClick={handleSendOtp} className="auth-btn-link" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.85rem', marginTop: '15px', cursor: 'pointer', fontWeight: 600 }}>
                                Resend OTP
                            </button>
                        </form>
                    )}

                    <div className="auth-footer">
                        Already have an account? <Link to="/login" className="auth-footer-link">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;