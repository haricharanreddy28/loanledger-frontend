import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import '../styles/global.css';

const LoanRequestList = ({ onAction }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
      fetchRequests(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axiosInstance.get('/lender/borrower-requests');
      setRequests(response.data);
    } catch (err) {
      setError('System Error: Unable to sync application queue.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleApprove = async (loanId) => {
    try {
      await axiosInstance.post(`/lender/loans/${loanId}/approve`);
      fetchRequests();
      if (onAction) onAction();
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Compliance Error: Risk assessment must be completed by an analyst first.');
    }
  };

  const handleReject = async (loanId) => {
    if (!window.confirm('IRREVERSIBLE: Permanent rejection of this funding request?')) return;
    try {
      await axiosInstance.post(`/lender/loans/${loanId}/reject`);
      fetchRequests();
      if (onAction) onAction();
    } catch (err) {
      setActionMessage('Operational Failure: Could not process rejection.');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: 'status-pending',
      APPROVED: 'status-active',
      REJECTED: 'status-failed',
      PENDING_ANALYST: 'status-pending',
      VISIBLE_TO_LENDER: 'status-active bg-soft text-info',
      ACTIVE: 'status-active',
      COMPLETED: 'status-active bg-soft text-dark'
    };
    return (
      <span className={`status-badge ${statusMap[status] || 'bg-light'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger border-0 shadow-sm">{error}</div>;

  return (
    <div className="loan-requests-panel animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0" style={{ color: 'var(--color-heading)' }}>
          Participant Funding Queue
        </h5>
        <span className="badge bg-soft text-primary px-3 py-2 font-monospace">{requests.length} APPLICATIONS</span>
      </div>

      {actionMessage && (
        <div className={`alert border-0 alert-danger mb-4 shadow-sm py-3`}>
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {actionMessage}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
          <i className="bi bi-stack fs-1 text-muted opacity-50"></i>
          <p className="mt-3 text-muted">The funding queue is currently empty.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle custom-table mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Application Profile</th>
                  <th>Capital Sought</th>
                  <th>Market Terms</th>
                  <th>Intended Use</th>
                  <th>Lifecycle Status</th>
                  <th className="text-end pe-4">Operations</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} className="transition-hover">
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar-sm rounded bg-soft text-primary d-flex align-items-center justify-content-center fw-bold me-3" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                          {req.borrowerName?.charAt(0) || 'B'}
                        </div>
                        <div>
                          <div className="fw-bold">{req.borrowerName || 'Anonymous Participant'}</div>
                          <div className="small text-muted font-monospace" style={{ fontSize: '10px' }}>LOG-ID: #{req.loanId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="fw-bold">₹{req.requestedAmount?.toLocaleString('en-IN')}</td>
                    <td>
                      <div className="small fw-bold text-primary">{req.requestedTenure}M Term</div>
                      <div className="small text-muted">Fixed Installments</div>
                    </td>
                    <td className="small text-muted">{req.purpose || 'General Allocation'}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td className="text-end pe-4">
                      <div className="btn-group shadow-sm">
                        <button
                          className="btn btn-white btn-sm px-3 fw-bold border-end"
                          onClick={() => handleApprove(req.loanId)}
                          disabled={req.status !== 'PENDING' && req.status !== 'OFFER_ACCEPTED'}
                          style={{ color: 'var(--color-primary)' }}
                        >
                          Invest
                        </button>
                        <button
                          className="btn btn-white btn-sm px-3 fw-bold text-danger"
                          onClick={() => handleReject(req.loanId)}
                          disabled={req.status !== 'PENDING'}
                        >
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-table thead th {
          background-color: var(--color-bg);
          color: var(--color-muted);
          text-transform: uppercase;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--color-border);
          padding: 14px 16px;
        }
        .btn-white { background-color: #fff; border: 1px solid var(--color-border); }
        .btn-white:hover:not(:disabled) { background-color: var(--color-bg); }
        .btn-white:disabled { opacity: 0.5; color: #9ca3af !important; border-color: #e5e7eb; }
      `}</style>
    </div>
  );
};

export default LoanRequestList;