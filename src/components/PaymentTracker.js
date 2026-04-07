import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import RazorpayPayment from './RazorpayPayment';
import '../styles/global.css';

const PaymentTracker = ({ loanId, isLender = false }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payMessage, setPayMessage] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = isLender
        ? `/lender/loans/${loanId}/repayments`
        : `/borrower/loans/${loanId}/emi-schedule`;
      const response = await axiosInstance.get(endpoint);
      setPayments(response.data);
    } catch (err) {
      setError('Failed to load payment schedule');
    } finally {
      setLoading(false);
    }
  }, [isLender, loanId]);

  useEffect(() => {
    if (loanId) fetchPayments();
  }, [loanId, fetchPayments]);

  const handleMakePayment = async (paymentId) => {
    if (!window.confirm('Confirm EMI remittance? Funds will be transferred to the lender.')) return;
    try {
      await axiosInstance.post(`/borrower/payments/${paymentId}/pay`);
      fetchPayments();
    } catch (err) {
      setPayMessage(err.response?.data?.message || 'Payment processing failed');
    }
  };

  const paidCount = payments.filter(p => p.status === 'PAID').length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.emiAmount || 0), 0);
  const paidAmount = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.emiAmount || 0), 0);
  const progressPercent = payments.length > 0 ? (paidCount / payments.length) * 100 : 0;

  if (!loanId) return (
    <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
      <i className="bi bi-intersect fs-1 text-muted opacity-50"></i>
      <p className="mt-2 text-muted">Select an active loan to view repayment schedule.</p>
    </div>
  );

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger border-0 shadow-sm">{error}</div>;

  return (
    <div className="payment-ledger animate-fade-in">
      {payMessage && (
        <div className={`alert border-0 alert-danger mb-4 shadow-sm pb-3`}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {payMessage}
        </div>
      )}

      {payments.length > 0 && (
        <div className="row g-4 mb-4">
          <div className="col-md-8">
            <div className="card border-0 bg-soft h-100" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="card-body p-4 d-flex flex-column justify-content-center">
                <div className="d-flex justify-content-between align-items-end mb-3">
                  <div>
                    <div className="text-uppercase small fw-bold text-muted mb-1">Repayment Velocity</div>
                    <div className="h3 mb-0 fw-bold">{paidCount} <span className="small text-muted fw-normal">of {payments.length} Installments</span></div>
                  </div>
                  <div className="text-end">
                    <span className="h4 fw-bold text-primary">{Math.round(progressPercent)}%</span>
                  </div>
                </div>
                <div className="progress progress-thin bg-white" style={{ height: '8px', borderRadius: '4px' }}>
                  <div 
                    className="progress-bar bg-primary" 
                    role="progressbar" 
                    style={{ width: `${progressPercent}%`, transition: 'width 1s ease' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 bg-soft h-100" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="card-body p-4 text-center">
                <div className="text-uppercase small fw-bold text-muted mb-2">Remaining Principal</div>
                <div className="h3 mb-1 fw-bold text-danger">₹{(totalAmount - paidAmount).toLocaleString('en-IN')}</div>
                <div className="small text-muted">of total ₹{totalAmount.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle custom-table mb-0">
            <thead>
              <tr>
                <th className="ps-4">No.</th>
                <th>Amount Due</th>
                <th>Scheduled Date</th>
                <th>Settled On</th>
                <th>Status</th>
                <th className="text-end pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted py-5">No repayment ledger entries found.</td></tr>
              ) : payments.map(payment => (
                <tr key={payment.id} className={payment.status === 'PAID' ? 'bg-soft-success' : ''}>
                  <td className="ps-4 fw-bold text-muted">#{payment.emiNumber}</td>
                  <td className="fw-bold">₹{payment.emiAmount?.toLocaleString('en-IN')}</td>
                  <td className="text-muted">{new Date(payment.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="text-muted">{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-IN') : '--'}</td>
                  <td>
                    <span className={`status-badge ${payment.status === 'PAID' ? 'status-active' : 'status-pending'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    {payment.status === 'PAID' ? (
                      <span className="text-success"><i className="bi bi-check-circle-fill fs-5"></i></span>
                    ) : isLender ? (
                      <RazorpayPayment
                        payment={payment}
                        onPaymentSuccess={fetchPayments}
                      />
                    ) : (
                      <button
                        className="btn btn-primary btn-sm px-4 fw-bold"
                        onClick={() => handleMakePayment(payment.id)}
                        style={{ borderRadius: 'var(--radius-md)' }}
                      >
                        Remit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .bg-soft-success { background-color: rgba(22, 163, 74, 0.02); }
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
        .progress-thin { background-color: #e5e7eb; overflow: visible; }
      `}</style>
    </div>
  );
};

export default PaymentTracker;