import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import '../styles/global.css';

const LoanOfferList = ({ onApply }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [applyForm, setApplyForm] = useState({ requestedAmount: '', requestedTenure: '', purpose: '' });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  useEffect(() => {
    fetchOffers();
    const interval = setInterval(() => {
      fetchOffers(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOffers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axiosInstance.get('/borrower/available-loan-offers');
      setOffers(response.data);
    } catch (err) {
      setError('Failed to load loan offers');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleApplyClick = (offer) => {
    setSelectedOffer(offer);
    setApplyForm({
      requestedAmount: offer.amount,
      requestedTenure: offer.tenureMonths,
      purpose: offer.purpose || ''
    });
    setApplyMessage('');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedOffer) return;
    setApplyLoading(true);
    try {
      await axiosInstance.post('/borrower/loans/apply-preoffered', {
        loanId: selectedOffer.id,
        requestedAmount: parseFloat(applyForm.requestedAmount),
        requestedTenure: parseInt(applyForm.requestedTenure),
        purpose: applyForm.purpose,
      });
      setSelectedOffer(null);
      if (onApply) onApply();
    } catch (err) {
      setApplyMessage(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger border-0 shadow-sm">{error}</div>;

  return (
    <div className="py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0" style={{ color: 'var(--color-heading)' }}>
          Available Loan Opportunities
        </h5>
        <span className="badge bg-soft text-primary px-3 py-2">{offers.length} Offers Available</span>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
          <i className="bi bi-inbox fs-1 text-muted opacity-50"></i>
          <p className="mt-3 text-muted">No peer-to-peer loan offers are currently active.</p>
        </div>
      ) : (
        <div className="row g-4">
          {offers.map(offer => (
            <div key={offer.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm transition-hover" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="p-2 bg-soft rounded text-primary">
                      <i className="bi bi-bank2 fs-4"></i>
                    </div>
                    <span className="badge bg-soft text-muted font-monospace small">#{offer.id}</span>
                  </div>
                  
                  <h4 className="fw-bold mb-1">₹{offer.amount?.toLocaleString('en-IN')}</h4>
                  <p className="text-muted small mb-3">Offered Principal</p>

                  <div className="row g-2 mb-4">
                    <div className="col-6">
                      <div className="p-2 bg-soft rounded text-center">
                        <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Rate</div>
                        <div className="fw-bold text-primary">{offer.interestRate}%</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 bg-soft rounded text-center">
                        <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Tenure</div>
                        <div className="fw-bold text-primary">{offer.tenureMonths}m</div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-calendar-event me-2 text-muted"></i>
                    <span className="small text-muted">Est. EMI: ₹{offer.emiAmount?.toLocaleString('en-IN')}/mo</span>
                  </div>

                  <hr className="my-3 opacity-10" />
                  
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                        {offer.lenderName?.charAt(0) || 'L'}
                      </div>
                      <span className="small fw-bold">{offer.lenderName || 'Verified Lender'}</span>
                    </div>
                    <button className="btn btn-outline-primary btn-sm px-3" onClick={() => handleApplyClick(offer)}>
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOffer && (
        <div className="modal-backdrop-custom show d-flex align-items-center justify-content-center">
          <div className="card border-0 shadow-lg mx-3" style={{ maxWidth: '500px', borderRadius: 'var(--radius-lg)' }}>
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center p-4 pb-0">
              <h5 className="fw-bold m-0 text-primary">Finalize Application</h5>
              <button className="btn-close" onClick={() => setSelectedOffer(null)}></button>
            </div>
            <div className="card-body p-4">
              <p className="text-muted small mb-4">
                You are applying for the loan offer from <strong>{selectedOffer.lenderName || 'Verified Lender'}</strong>. 
                Enter your preferred details below.
              </p>

              {applyMessage && (
                <div className={`alert border-0 alert-danger mb-4`}>
                  {applyMessage}
                </div>
              )}

              <form onSubmit={handleApplySubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Requested Amount (Max ₹{selectedOffer.amount?.toLocaleString('en-IN')})</label>
                  <input
                    type="number" className="form-control border-0 bg-soft p-3"
                    value={applyForm.requestedAmount}
                    onChange={e => setApplyForm({ ...applyForm, requestedAmount: e.target.value })}
                    max={selectedOffer.amount}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Terms (Months)</label>
                  <input
                    type="number" className="form-control border-0 bg-soft p-3"
                    value={applyForm.requestedTenure}
                    onChange={e => setApplyForm({ ...applyForm, requestedTenure: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase">Brief Purpose</label>
                  <input
                    type="text" className="form-control border-0 bg-soft p-3"
                    placeholder="e.g., Expansion Capital"
                    value={applyForm.purpose}
                    onChange={e => setApplyForm({ ...applyForm, purpose: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100 p-3 fw-bold shadow-sm" disabled={applyLoading}>
                  {applyLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2-circle me-2"></i>}
                  Confirm Application
                </button>
              </form>
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
        .transition-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default LoanOfferList;