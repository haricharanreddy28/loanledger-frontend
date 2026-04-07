import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import '../styles/global.css';

const LoanApplyForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '', interestRate: '', tenureMonths: '', purpose: '', description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [emiPreview, setEmiPreview] = useState(null);

  const calculateEMIPreview = useCallback(() => {
    if (!formData.amount || !formData.interestRate || !formData.tenureMonths) {
      setEmiPreview(null);
      return;
    }
    const P = parseFloat(formData.amount);
    const R = parseFloat(formData.interestRate) / 12 / 100;
    const N = parseInt(formData.tenureMonths);
    if (isNaN(P) || isNaN(R) || isNaN(N) || N <= 0) return;
    if (R === 0) {
      setEmiPreview((P / N).toFixed(2));
    } else {
      const onePlusRPowN = Math.pow(1 + R, N);
      const emi = (P * R * onePlusRPowN) / (onePlusRPowN - 1);
      setEmiPreview(emi.toFixed(2));
    }
  }, [formData.amount, formData.interestRate, formData.tenureMonths]);

  useEffect(() => {
    calculateEMIPreview();
  }, [calculateEMIPreview]);

  const validate = () => {
    const newErrors = {};
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Valid amount required (min ₹1000)';
    if (parseFloat(formData.amount) < 1000) newErrors.amount = 'Minimum amount is ₹1000';
    if (!formData.interestRate) newErrors.interestRate = 'Interest rate required';
    if (parseFloat(formData.interestRate) < 0.1 || parseFloat(formData.interestRate) > 50)
      newErrors.interestRate = 'Rate must be between 0.1% and 50%';
    if (!formData.tenureMonths || formData.tenureMonths <= 0) newErrors.tenureMonths = 'Tenure required';
    if (parseInt(formData.tenureMonths) < 1 || parseInt(formData.tenureMonths) > 360)
      newErrors.tenureMonths = 'Tenure must be between 1 and 360 months';
    if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setMessage('');
    try {
      const endpoint = '/borrower/loans/apply-custom';
      const payload = {
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate) || 10,
        tenureMonths: parseInt(formData.tenureMonths),
        purpose: formData.purpose,
        description: formData.description,
      };
      await axiosInstance.post(endpoint, payload);
      setMessage('Loan application submitted successfully! Awaiting Analyst Review.');
      setFormData({ amount: '', interestRate: '', tenureMonths: '', purpose: '', description: '' });
      setEmiPreview(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('API Error:', err);
      setMessage(err.response?.data?.message || 'Failed to submit loan application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white shadow-sm border" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="d-flex align-items-center mb-4">
        <div className="p-2 bg-soft rounded-circle text-primary me-3">
          <i className="bi bi-file-earmark-plus fs-4"></i>
        </div>
        <h5 className="fw-bold m-0" style={{ color: 'var(--color-heading)' }}>Apply for a Loan</h5>
      </div>

      {message && (
        <div className={`alert border-0 ${message.includes('success') ? 'alert-success' : 'alert-danger'} mb-4`} style={{ borderRadius: 'var(--radius-md)' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4 d-flex">
          <div className="col-md-6 mb-1">
            <label className="form-label small fw-bold text-muted text-uppercase">Loan Amount (₹)</label>
            <div className="input-group">
              <span className="input-group-text bg-soft border-0 text-muted">₹</span>
              <input
                type="number" className={`form-control border-0 bg-soft p-3 ${errors.amount ? 'is-invalid' : ''}`}
                style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                placeholder="e.g., 5,00,000" value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
              {errors.amount && <div className="invalid-feedback d-block small mt-1">{errors.amount}</div>}
            </div>
          </div>

          <div className="col-md-6 mb-1">
            <label className="form-label small fw-bold text-muted text-uppercase">Annual Interest Rate (%)</label>
            <div className="input-group">
              <input
                type="number" step="0.1"
                className={`form-control border-0 bg-soft p-3 ${errors.interestRate ? 'is-invalid' : ''}`}
                style={{ borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}
                placeholder="e.g., 12.5" value={formData.interestRate}
                onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
              />
              <span className="input-group-text bg-soft border-0 text-muted">%</span>
              {errors.interestRate && <div className="invalid-feedback d-block small mt-1">{errors.interestRate}</div>}
            </div>
          </div>

          <div className="col-md-6 mb-1">
            <label className="form-label small fw-bold text-muted text-uppercase">Tenure (Months)</label>
            <input
              type="number" className={`form-control border-0 bg-soft p-3 ${errors.tenureMonths ? 'is-invalid' : ''}`}
              style={{ borderRadius: 'var(--radius-md)' }}
              placeholder="e.g., 36" value={formData.tenureMonths}
              onChange={e => setFormData({ ...formData, tenureMonths: e.target.value })}
            />
            {errors.tenureMonths && <div className="invalid-feedback small mt-1">{errors.tenureMonths}</div>}
          </div>

          <div className="col-md-6 mb-1">
            <label className="form-label small fw-bold text-muted text-uppercase">Purpose</label>
            <input
              type="text" className={`form-control border-0 bg-soft p-3 ${errors.purpose ? 'is-invalid' : ''}`}
              style={{ borderRadius: 'var(--radius-md)' }}
              placeholder="e.g., Home Renovation" value={formData.purpose}
              onChange={e => setFormData({ ...formData, purpose: e.target.value })}
            />
            {errors.purpose && <div className="invalid-feedback small mt-1">{errors.purpose}</div>}
          </div>

          <div className="col-12">
            <label className="form-label small fw-bold text-muted text-uppercase">Description / Details</label>
            <textarea
              className="form-control border-0 bg-soft p-3" rows="3"
              style={{ borderRadius: 'var(--radius-md)' }}
              placeholder="Tell us more about your loan requirement..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
        </div>

        {emiPreview && (
          <div className="mt-4 p-4 rounded bg-soft border-0 d-flex align-items-center justify-content-between" style={{ borderLeft: '4px solid var(--color-primary) !important' }}>
            <div>
              <div className="text-uppercase small fw-bold text-muted mb-1">Estimated Monthly Payment</div>
              <div className="h3 mb-0 fw-bold text-primary">₹{parseFloat(emiPreview).toLocaleString('en-IN')}</div>
            </div>
            <div className="text-end">
              <div className="text-uppercase small fw-bold text-muted mb-1">Total Due</div>
              <div className="fw-bold">₹{ (parseFloat(emiPreview) * parseInt(formData.tenureMonths)).toLocaleString('en-IN') }</div>
            </div>
          </div>
        )}

        <button
          type="submit" className="btn btn-primary w-100 p-3 fw-bold mt-4 shadow-sm"
          disabled={loading}
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          {loading ? (
            <><span className="spinner-border spinner-border-sm me-2"></span>Broadcasting...</>
          ) : (
            <><i className="bi bi-send-fill me-2 rotate-45"></i>Submit Application</>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoanApplyForm;