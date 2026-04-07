import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import LoanRequestList from '../components/LoanRequestList';
import PaymentTracker from '../components/PaymentTracker';
import axiosInstance from '../api/axiosConfig';
import dashboardService from '../services/dashboardService';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import '../styles/global.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const LenderDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [myLoans, setMyLoans] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [offerForm, setOfferForm] = useState({
    amount: '', interestRate: '', tenureMonths: '', purpose: '', description: ''
  });
  const [offerErrors, setOfferErrors] = useState({});
  const [offerMessage, setOfferMessage] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [offersRes, approvedRes, txRes, statsRes] = await Promise.all([
        axiosInstance.get('/lender/my-offers'),
        axiosInstance.get('/lender/loans'),
        axiosInstance.get('/lender/my-transactions'),
        dashboardService.getLenderStats(),
      ]);
      setMyLoans(offersRes.data);
      setApprovedLoans(approvedRes.data);
      setTransactions(txRes.data);
      setDashboardStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch lender data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fetchMyLoans = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await axiosInstance.get('/lender/my-offers');
      setMyLoans(response.data);
    } catch (err) {
      console.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedLoans = async (showLoading = true) => {
    if (showLoading) setApprovedLoading(true);
    try {
      const response = await axiosInstance.get('/lender/loans');
      setApprovedLoans(response.data);
    } catch (err) {
      console.error('Failed to fetch approved loans');
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleFundLoan = async (loanId) => {
    try {
      await axiosInstance.post(`/lender/loans/${loanId}/approve`);
      fetchApprovedLoans();
      fetchMyLoans();
      fetchTransactions();
      alert('Loan funded successfully! Disbursal transaction recorded.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fund loan');
    }
  };

  const handleRejectLoan = async (loanId) => {
    if (!window.confirm('Reject this loan application?')) return;
    try {
      await axiosInstance.post(`/lender/loans/${loanId}/reject`);
      fetchApprovedLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject loan');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axiosInstance.get('/lender/my-transactions');
      setTransactions(response.data);
    } catch (err) {}
  };

  const validateOffer = () => {
    const e = {};
    if (!offerForm.amount || parseFloat(offerForm.amount) < 1000) e.amount = 'Min ₹1000';
    if (!offerForm.interestRate || parseFloat(offerForm.interestRate) < 0.1) e.interestRate = 'Valid rate required';
    if (!offerForm.tenureMonths || parseInt(offerForm.tenureMonths) < 1) e.tenureMonths = 'Valid tenure required';
    if (!offerForm.purpose.trim()) e.purpose = 'Purpose required';
    setOfferErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!validateOffer()) return;
    setOfferLoading(true);
    setOfferMessage('');
    try {
      await axiosInstance.post('/lender/loans/offer', {
        amount: parseFloat(offerForm.amount),
        interestRate: parseFloat(offerForm.interestRate),
        tenureMonths: parseInt(offerForm.tenureMonths),
        purpose: offerForm.purpose,
        description: offerForm.description,
      });
      setOfferMessage('Loan offer created successfully! Status: PRE_OFFER_CREATED');
      setOfferForm({ amount: '', interestRate: '', tenureMonths: '', purpose: '', description: '' });
      fetchMyLoans();
    } catch (err) {
      console.error('API Error:', err);
      setOfferMessage(err.response?.data?.message || 'Failed to create loan offer');
    } finally {
      setOfferLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      REJECTED: 'status-failed',
      VISIBLE_TO_LENDER: 'status-active',
      REJECTED_BY_ANALYST: 'status-failed',
      ACTIVE: 'status-active',
      COMPLETED: 'status-active bg-soft text-dark',
      PRE_OFFER_CREATED: 'status-pending',
      OFFER_ACCEPTED: 'status-active'
    };
    const labels = {
      REJECTED: 'Declined',
      VISIBLE_TO_LENDER: 'Ready to Fund',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      PRE_OFFER_CREATED: 'Offered',
      OFFER_ACCEPTED: 'Accepted'
    };
    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {labels[status] || status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-vh-100 bg-soft">
      <Navbar title="Lender Command Center" />
      
      <div className="container-fluid py-4 px-4">
        {/* ── Portfolio Overview — Enhanced Stats ──────────────────────────── */}
        <div className="row g-4 mb-4">
          {[
            { label: 'Total Invested', value: `₹${dashboardStats?.totalInvestment?.toLocaleString() || 0}`, icon: 'bi-bank', color: 'var(--color-primary)' },
            { label: 'Net Interest', value: `₹${dashboardStats?.totalInterestEarned?.toLocaleString() || 0}`, icon: 'bi-graph-up-arrow', color: '#16a34a' },
            { label: 'Pending Requests', value: dashboardStats?.pendingRequestsCount || 0, icon: 'bi-people', color: '#ca8a04', action: () => setActiveTab('requests') },
            { label: 'Active/Total', value: `${dashboardStats?.activeLoansCount || 0}/${myLoans.length}`, icon: 'bi-check-circle', color: '#4b5563' },
          ].map((stat, idx) => (
            <div key={idx} className="col-md-3" onClick={stat.action} style={stat.action ? { cursor: 'pointer' } : {}}>
              <div className="card border-0 shadow-sm transition-hover h-100" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="card-body d-flex align-items-center p-4">
                  <div className="flex-grow-1">
                    <div className="text-uppercase small fw-bold text-muted mb-1">{stat.label}</div>
                    <div className="h4 mb-0 fw-bold" style={{ color: 'var(--color-heading)' }}>{stat.value}</div>
                  </div>
                  <div className="ms-3 p-3 rounded-circle" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    <i className={`bi ${stat.icon} fs-3`}></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="card-header bg-white border-bottom-0 pt-3">
            <ul className="nav nav-tabs border-bottom-0">
              {[
                { key: 'overview', label: 'My Portfolio', icon: 'bi-list-ul' },
                { key: 'approved', label: `Approved to Fund (${approvedLoans.length})`, icon: 'bi-patch-check-fill' },
                { key: 'create', label: 'New Offer', icon: 'bi-plus-circle' },
                { key: 'requests', label: 'Borrower Requests', icon: 'bi-inbox' },
                { key: 'repayments', label: 'Repayments', icon: 'bi-credit-card' },
                { key: 'transactions', label: 'History', icon: 'bi-arrow-left-right' },
              ].map(tab => (
                <li key={tab.key} className="nav-item">
                  <button
                    className={`nav-link border-0 px-4 py-3 ${activeTab === tab.key ? 'active fw-bold text-primary border-bottom' : 'text-muted'}`}
                    style={activeTab === tab.key ? { borderBottom: '3px solid var(--color-primary) !important', backgroundColor: 'transparent' } : { backgroundColor: 'transparent' }}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-body p-4">
            {activeTab === 'overview' && (
              <div>
                <div className="row g-4 mb-5">
                    {/* Left: Investment Ratio Pie */}
                    <div className="col-lg-4">
                        <div className="card border-0 bg-soft p-4 h-100 shadow-sm text-center">
                            <h6 className="fw-bold mb-4">Portfolio Rebalanced</h6>
                            <div style={{ height: '200px' }}>
                                <Pie 
                                    data={{
                                        labels: ['Active', 'Completed', 'Draft/Pending'],
                                        datasets: [{
                                            data: [
                                                dashboardStats?.activeLoansCount || 0,
                                                dashboardStats?.completedLoansCount || 0,
                                                myLoans.length - (dashboardStats?.activeLoansCount || 0) - (dashboardStats?.completedLoansCount || 0)
                                            ],
                                            backgroundColor: ['#6366f1', '#10b981', '#cbd5e1'],
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Right: Bar Chart of Funded Loans */}
                    <div className="col-lg-8">
                        <div className="card border-0 bg-soft p-4 h-100 shadow-sm">
                            <h6 className="fw-bold mb-4">Recent Investment Performance</h6>
                            <div style={{ height: '200px' }}>
                                <Bar 
                                    data={{
                                        labels: dashboardStats?.recentFundedLoans?.map(l => `Loan #${l.id}`) || [],
                                        datasets: [{
                                            label: 'Funded Amount',
                                            data: dashboardStats?.recentFundedLoans?.map(l => l.amount) || [],
                                            backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                            borderRadius: 6
                                        }]
                                    }}
                                    options={{ maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold m-0">Detailed Investment Ledger</h5>
                  <button className="btn btn-primary btn-sm px-3" onClick={() => setActiveTab('create')}>
                    <i className="bi bi-plus-lg me-2"></i>Create New Offer
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : myLoans.length === 0 ? (
                  <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
                    <i className="bi bi-inbox fs-1 text-muted opacity-50"></i>
                    <p className="mt-3 text-muted">You haven't created any loan offers yet.</p>
                    <button className="btn btn-outline-primary" onClick={() => setActiveTab('create')}>Start Investing</button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle custom-table">
                      <thead>
                        <tr>
                          <th>Loan ID</th><th>Principal</th><th>Rate</th><th>Tenure</th>
                          <th>EMI</th><th>Borrower</th><th>Status</th><th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myLoans.map(loan => (
                          <tr key={loan.id}>
                            <td className="fw-bold text-primary">#{loan.id}</td>
                            <td>₹{loan.amount?.toLocaleString('en-IN')}</td>
                            <td>{loan.interestRate}%</td>
                            <td>{loan.tenureMonths} mo</td>
                            <td>₹{loan.emiAmount?.toLocaleString('en-IN')}</td>
                            <td>{loan.borrowerName || 'Unassigned'}</td>
                            <td>{getStatusBadge(loan.status)}</td>
                            <td className="text-end">
                              {loan.status === 'OFFER_ACCEPTED' && (
                                <button className="btn btn-primary btn-sm px-3" onClick={() => handleFundLoan(loan.id)}>
                                  Finalize & Fund
                                </button>
                              )}
                              {loan.status === 'ACTIVE' && (
                                <button
                                  className="btn btn-outline-primary btn-sm px-3"
                                  onClick={() => { setSelectedLoanId(loan.id); setActiveTab('repayments'); }}
                                >
                                  Track
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div>
                <h5 className="fw-bold mb-3">Analyst-Approved Queue</h5>
                <p className="text-muted small mb-4">
                  These applications have passed risk assessment and are awaiting your funding decision.
                </p>
                {approvedLoading ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : approvedLoans.length === 0 ? (
                  <div className="alert alert-info border-0 bg-soft py-4 text-center">
                    <i className="bi bi-info-circle fs-2 mb-2 d-block text-primary opacity-50"></i>
                    No analyst-approved loans are currently awaiting funding.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle custom-table">
                      <thead>
                        <tr>
                          <th>Loan ID</th><th>Borrower</th><th>Amount</th>
                          <th>Rate</th><th>Tenure</th><th>Purpose</th><th>Status</th><th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedLoans.map(loan => (
                          <tr key={loan.id}>
                            <td className="fw-bold text-primary">#{loan.id}</td>
                            <td>{loan.borrowerName || 'N/A'}</td>
                            <td className="fw-bold">₹{loan.amount?.toLocaleString('en-IN')}</td>
                            <td>{loan.interestRate}%</td>
                            <td>{loan.tenureMonths} mo</td>
                            <td>{loan.purpose || '-'}</td>
                            <td>{getStatusBadge(loan.status)}</td>
                            <td className="text-end">
                              <div className="d-flex gap-2 justify-content-end">
                                <button className="btn btn-primary btn-sm px-3" onClick={() => handleFundLoan(loan.id)}>
                                  <i className="bi bi-wallet2 me-2"></i>Fund
                                </button>
                                <button className="btn btn-outline-danger btn-sm px-3" onClick={() => handleRejectLoan(loan.id)}>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="mx-auto" style={{ maxWidth: '600px' }}>
                <div className="p-4 bg-soft rounded-lg" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <h5 className="fw-bold mb-4">Create Pre-Offer</h5>
                  {offerMessage && (
                    <div className={`alert border-0 ${offerMessage.includes('successful') ? 'alert-success' : 'alert-danger'}`}>
                      {offerMessage}
                    </div>
                  )}
                  <form onSubmit={handleCreateOffer}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Amount (₹)</label>
                        <input
                          type="number" className={`form-control border-0 p-3 ${offerErrors.amount ? 'is-invalid' : ''}`}
                          placeholder="500000" value={offerForm.amount}
                          onChange={e => setOfferForm({ ...offerForm, amount: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Interest Rate (%)</label>
                        <input
                          type="number" step="0.1" className={`form-control border-0 p-3 ${offerErrors.interestRate ? 'is-invalid' : ''}`}
                          placeholder="10.5" value={offerForm.interestRate}
                          onChange={e => setOfferForm({ ...offerForm, interestRate: e.target.value })}
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label small fw-bold text-muted">Tenure (Months)</label>
                        <input
                          type="number" className={`form-control border-0 p-3 ${offerErrors.tenureMonths ? 'is-invalid' : ''}`}
                          placeholder="36" value={offerForm.tenureMonths}
                          onChange={e => setOfferForm({ ...offerForm, tenureMonths: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted">Purpose Tag</label>
                        <input
                          type="text" className={`form-control border-0 p-3 ${offerErrors.purpose ? 'is-invalid' : ''}`}
                          placeholder="e.g., Home Renovation" value={offerForm.purpose}
                          onChange={e => setOfferForm({ ...offerForm, purpose: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-primary w-100 p-3 fw-bold mt-2" disabled={offerLoading}>
                          {offerLoading ? 'Broadcasting...' : 'Publish Loan Offer'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <LoanRequestList onAction={fetchMyLoans} />
            )}

            {activeTab === 'repayments' && (
              <div>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Tracking Loan Performance</label>
                    <select
                      className="form-select border-0 bg-soft p-3 fw-bold"
                      style={{ borderRadius: 'var(--radius-md)' }}
                      value={selectedLoanId || ''}
                      onChange={e => setSelectedLoanId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">-- Choose an active loan --</option>
                      {myLoans.filter(l => l.status === 'ACTIVE').map(loan => (
                        <option key={loan.id} value={loan.id}>
                          Loan #{loan.id} · ₹{loan.amount?.toLocaleString('en-IN')} vs {loan.borrowerName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedLoanId ? (
                  <PaymentTracker loanId={selectedLoanId} isLender={true} />
                ) : (
                  <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
                    <i className="bi bi-graph-up fs-1 text-muted opacity-50"></i>
                    <p className="mt-3 text-muted">Select an active loan to track repayment performance.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h5 className="fw-bold mb-4">Transaction Ledger</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle custom-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Loan ID</th><th>From</th><th>To</th>
                        <th>Amount</th><th>Type</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr><td colSpan="7" className="text-center text-muted py-5">No transactions recorded yet.</td></tr>
                      ) : transactions.map(tx => (
                        <tr key={tx.id}>
                          <td className="small text-muted">{tx.id}</td>
                          <td className="fw-bold text-primary">#{tx.loanId}</td>
                          <td>{tx.senderName}</td>
                          <td>{tx.receiverName}</td>
                          <td className="fw-bold">₹{tx.amount?.toLocaleString('en-IN')}</td>
                          <td><span className="badge bg-soft text-primary">{tx.transactionType}</span></td>
                          <td className="text-muted">{new Date(tx.transactionDate).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-table thead th {
          background-color: var(--color-bg);
          color: var(--color-muted);
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--color-border);
          padding: 12px 16px;
        }
        .custom-table tbody td {
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
        }
        .transition-hover:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default LenderDashboard;