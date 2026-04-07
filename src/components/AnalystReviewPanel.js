import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import '../styles/global.css';

const AnalystReviewPanel = ({ onReviewSubmit }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [reportForm, setReportForm] = useState({
    riskLevel: 'LOW', eligibility: 'APPROVED', comments: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    fetchLoansForReview();
    const interval = setInterval(() => {
      fetchLoansForReview(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLoansForReview = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axiosInstance.get('/analyst/pending-reviews');
      setLoans(response.data);
    } catch (err) {
      setError('Failed to load loans for review');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleReviewClick = (loan) => {
    setSelectedLoan(loan);
    setReportForm({ riskLevel: 'LOW', eligibility: 'APPROVED', comments: '' });
    setSubmitMessage('');
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;
    if (!reportForm.comments.trim()) {
      setSubmitMessage('✍️ Please provide a justification for this decision.');
      return;
    }
    setSubmitLoading(true);
    try {
      await axiosInstance.post('/analyst/submit-report', {
        loanId: selectedLoan.id,
        riskLevel: reportForm.riskLevel,
        eligibility: reportForm.eligibility,
        comments: reportForm.comments,
      });
      fetchLoansForReview();
      setSelectedLoan(null);
      if (onReviewSubmit) onReviewSubmit();
    } catch (err) {
      setSubmitMessage(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger border-0 shadow-sm">{error}</div>;

  return (
    <div className="review-panel">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0" style={{ color: 'var(--color-heading)' }}>
          Risk Assessment Queue
        </h5>
        <span className="badge bg-soft text-primary px-3 py-2 font-monospace">{loans.length} PENDING</span>
      </div>

      {loans.length === 0 ? (
        <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
          <i className="bi bi-person-check fs-1 text-muted opacity-50"></i>
          <p className="mt-3 text-muted">All applications have been processed. Great job!</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle custom-table mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Application ID</th>
                  <th>Applicant Name</th>
                  <th>Requested Principal</th>
                  <th>Proposed Rate</th>
                  <th>Term</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan.id} className="transition-hover">
                    <td className="ps-4 fw-bold text-muted font-monospace">#{loan.id}</td>
                    <td className="fw-bold">{loan.borrowerName || 'Anonymous Applicant'}</td>
                    <td className="fw-bold">₹{loan.amount?.toLocaleString('en-IN')}</td>
                    <td><span className="badge bg-soft text-primary">{loan.interestRate}% p.a.</span></td>
                    <td className="text-muted">{loan.tenureMonths} Months</td>
                    <td className="text-end pe-4">
                      <button className="btn btn-primary btn-sm px-4 fw-bold" onClick={() => handleReviewClick(loan)}>
                        Final Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLoan && (
        <div className="modal-backdrop-custom show d-flex align-items-center justify-content-center p-3">
          <div className="card border-0 shadow-lg w-100" style={{ maxWidth: '900px', borderRadius: 'var(--radius-lg)' }}>
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center p-4 pb-0">
              <div className="d-flex align-items-center">
                <div className="p-2 bg-soft rounded me-3 text-primary">
                  <i className="bi bi-file-earmark-bar-graph fs-4"></i>
                </div>
                <div>
                  <h5 className="fw-bold m-0">Compliance & Risk Review</h5>
                  <span className="small text-muted font-monospace">APP-#{selectedLoan.id}</span>
                </div>
              </div>
              <button className="btn-close" onClick={() => setSelectedLoan(null)}></button>
            </div>
            
            <div className="card-body p-4 pt-4">
              <div className="row g-4 d-flex">
                <div className="col-lg-5">
                  <div className="p-4 bg-soft h-100" style={{ borderRadius: 'var(--radius-md)' }}>
                    <h6 className="fw-bold text-uppercase small text-muted mb-4">Financial Snapshot</h6>
                    <div className="mb-4">
                      <div className="small text-muted mb-1">Principal Amount</div>
                      <div className="h4 fw-bold">₹{selectedLoan.amount?.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="row mb-4">
                      <div className="col-6">
                        <div className="small text-muted mb-1">Interest Rate</div>
                        <div className="fw-bold text-primary">{selectedLoan.interestRate}% p.a.</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted mb-1">Tenure</div>
                        <div className="fw-bold text-primary">{selectedLoan.tenureMonths} Months</div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="small text-muted mb-1">Estimated EMI</div>
                      <div className="fw-bold">₹{selectedLoan.emiAmount?.toLocaleString('en-IN')}/month</div>
                    </div>
                    <div>
                      <div className="small text-muted mb-1">Purpose</div>
                      <div className="fw-bold small">{selectedLoan.purpose || 'Not specified'}</div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-7">
                  <form onSubmit={handleSubmitReport}>
                    <h6 className="fw-bold text-uppercase small text-muted mb-4">Officer Assessment</h6>
                    
                    {submitMessage && (
                      <div className={`alert border-0 alert-danger mb-4 p-2 px-3 small`}>
                        {submitMessage}
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Assigned Risk Level</label>
                      <div className="d-flex gap-3">
                        {['LOW', 'MEDIUM', 'HIGH'].map(level => (
                          <div key={level}>
                            <input
                              type="radio" className="btn-check" id={`risk_${level}`} name="riskLevel"
                              value={level} checked={reportForm.riskLevel === level}
                              onChange={e => setReportForm({ ...reportForm, riskLevel: e.target.value })}
                            />
                            <label className={`btn btn-outline-${level === 'LOW' ? 'success' : level === 'MEDIUM' ? 'warning' : 'danger'} border-2 px-3 py-1 small fw-bold`} htmlFor={`risk_${level}`}>
                              {level}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Final Eligibility Decision</label>
                      <div className="d-flex gap-3">
                        <input
                          type="radio" className="btn-check" id="el_apr" name="elig" value="APPROVED"
                          checked={reportForm.eligibility === 'APPROVED'}
                          onChange={e => setReportForm({ ...reportForm, eligibility: e.target.value })}
                        />
                        <label className="btn btn-outline-primary border-2 px-3 py-1 small fw-bold" htmlFor="el_apr">APPROVE</label>
                        
                        <input
                          type="radio" className="btn-check" id="el_rej" name="elig" value="REJECTED"
                          checked={reportForm.eligibility === 'REJECTED'}
                          onChange={e => setReportForm({ ...reportForm, eligibility: e.target.value })}
                        />
                        <label className="btn btn-outline-dark border-2 px-3 py-1 small fw-bold" htmlFor="el_rej">REJECT</label>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Review Auditor Comments</label>
                      <textarea
                        className="form-control border-0 bg-soft p-3" rows="3"
                        placeholder="Detail reasoning for approval/rejection..."
                        value={reportForm.comments}
                        onChange={e => setReportForm({ ...reportForm, comments: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="d-flex gap-3">
                      <button type="submit" className="btn btn-primary flex-grow-1 p-3 fw-bold shadow-sm" disabled={submitLoading}>
                        {submitLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-shield-check me-2"></i>Persist Review Report</>}
                      </button>
                      <button type="button" className="btn btn-outline-secondary px-4 fw-bold" onClick={() => setSelectedLoan(null)}>
                        Discard
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-backdrop-custom {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1050;
          backdrop-filter: blur(4px);
        }
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
        .custom-table tbody td {
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
        }
        .btn-outline-LOW { border-color: var(--color-success); color: var(--color-success); }
        .btn-check:checked + .btn-outline-LOW { background-color: var(--color-success); color: white; }
        // etc. Simplified class names for clarity
      `}</style>
    </div>
  );
};

export default AnalystReviewPanel;