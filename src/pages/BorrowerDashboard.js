import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import LoanApplyForm from '../components/LoanApplyForm';
import LoanOfferList from '../components/LoanOfferList';
import PaymentTracker from '../components/PaymentTracker';
import axiosInstance from '../api/axiosConfig';
import dashboardService from '../services/dashboardService';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import '../styles/global.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const BorrowerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [myLoans, setMyLoans] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  console.log('Active borrower session:', user?.email);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [loansRes, statsRes] = await Promise.all([
        axiosInstance.get('/borrower/my-loans'),
        dashboardService.getBorrowerStats(),
      ]);
      setMyLoans(loansRes.data);
      setDashboardStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch borrower data');
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
      const response = await axiosInstance.get('/borrower/my-loans');
      setMyLoans(response.data);
    } catch (err) {
      console.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING_ANALYST: 'status-pending',
      REJECTED: 'status-failed',
      VISIBLE_TO_LENDER: 'status-active',
      ACTIVE: 'status-active',
      COMPLETED: 'status-active bg-soft text-dark',
      REJECTED_BY_ANALYST: 'status-rejected'
    };
    const labels = {
      PENDING_ANALYST: 'In Review',
      REJECTED: 'Declined',
      VISIBLE_TO_LENDER: 'Approved',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      REJECTED_BY_ANALYST: 'Rejected',
      PRE_OFFER_CREATED: 'Offered'
    };
    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {labels[status] || status.replace('_', ' ')}
      </span>
    );
  };

  const activeLoans = myLoans.filter(l => l.status === 'ACTIVE');

  return (
    <div className="min-vh-100 bg-soft">
      <Navbar title="Borrower Command Center" />
      
      <div className="container-fluid py-4 px-4">
        {/* ── Summary Metrics — Enhanced ─────────────────────────────── */}
        <div className="row g-4 mb-4">
          {[
            { label: 'Total Borrowed', value: `₹${dashboardStats?.totalBorrowed?.toLocaleString() || 0}`, icon: 'bi-bank', color: 'var(--color-primary)' },
            { label: 'Total Repaid', value: `₹${dashboardStats?.totalRepaid?.toLocaleString() || 0}`, icon: 'bi-check-circle', color: '#16a34a' },
            { label: 'Outstandings', value: `₹${dashboardStats?.currentOutstandings?.toLocaleString() || 0}`, icon: 'bi-exclamation-circle', color: '#ef4444' },
            { label: 'Next Due', value: dashboardStats?.nextEmi ? `₹${dashboardStats.nextEmi.emiAmount?.toLocaleString()}` : 'None', icon: 'bi-clock-history', color: '#ca8a04' },
          ].map((stat, idx) => (
            <div key={idx} className="col-md-3">
              <div className="card border-0 shadow-sm transition-hover h-100" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="card-body d-flex align-items-center p-4">
                  <div className="flex-grow-1">
                    <div className="text-uppercase small fw-bold text-muted mb-1">{stat.label}</div>
                    <div className="h4 mb-0 fw-bold" style={{ color: 'var(--color-heading)' }}>{stat.value}</div>
                    {stat.label === 'Next Due' && dashboardStats?.nextEmi && (
                        <div className="small text-muted mt-1">{new Date(dashboardStats.nextEmi.dueDate).toLocaleDateString()}</div>
                    )}
                  </div>
                  <div className="ms-3 p-3 rounded-circle" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    <i className={`bi ${stat.icon} fs-3`}></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Dashboard Area ─────────────────────────── */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="card-header bg-white border-bottom-0 pt-3">
            <ul className="nav nav-tabs border-bottom-0">
              {[
                { key: 'overview', label: 'My Loans', icon: 'bi-list-ul' },
                { key: 'apply', label: 'New Application', icon: 'bi-plus-circle' },
                { key: 'offers', label: 'Open Offers', icon: 'bi-tags' },
                { key: 'payments', label: 'EMI Payments', icon: 'bi-credit-card' },
              ].map(tab => (
                <li key={tab.key} className="nav-item">
                  <button
                    className={`nav-link border-0 px-4 py-3 ${activeTab === tab.key ? 'active fw-bold text-primary border-bottom' : 'text-muted'}`}
                    style={activeTab === tab.key ? { borderBottom: '3px solid var(--color-primary) !important', backgroundColor: 'transparent' } : { backgroundColor: 'transparent' }}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                    {tab.key === 'offers' && <span className="badge bg-soft text-primary ms-2">New</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-body p-4">
            {activeTab === 'overview' && (
              <div>
                <div className="row g-4 mb-5">
                    {/* Left: Repayment Alerts */}
                    <div className="col-lg-5">
                        <div className="card border-0 bg-soft p-4 h-100 shadow-sm">
                            <h6 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
                                Repayment Alerts
                                <span className="badge bg-danger rounded-pill small">Action Required</span>
                            </h6>
                            {dashboardStats?.nextEmi ? (
                                <div className="p-3 bg-white rounded border-start border-danger border-4 mb-3 shadow-sm">
                                    <div className="small text-muted mb-1">Upcoming EMI (Loan #{dashboardStats.nextEmi.loanId})</div>
                                    <div className="h5 fw-bold mb-1">₹{dashboardStats.nextEmi.emiAmount?.toLocaleString()}</div>
                                    <div className="small text-danger fw-bold">Due by: {new Date(dashboardStats.nextEmi.dueDate).toLocaleDateString()}</div>
                                    <button 
                                        className="btn btn-danger btn-sm w-100 mt-3 fw-bold"
                                        onClick={() => { setSelectedLoanId(dashboardStats.nextEmi.loanId); setActiveTab('payments'); }}
                                    >
                                        Pay Now
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <i className="bi bi-check2-circle fs-1 text-success opacity-50 mb-2 d-block"></i>
                                    All clear! No pending EMIs found.
                                </div>
                            )}
                            
                            <h6 className="fw-bold mt-2 small text-uppercase text-muted">Recent Payments</h6>
                            <div className="mt-2">
                                {dashboardStats?.recentPayments?.slice(0, 3).map(p => (
                                    <div key={p.id} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded-pill px-3 shadow-xs">
                                        <span className="small fw-semibold">EMI #{p.id}</span>
                                        <span className="small text-success fw-bold">₹{p.amount?.toLocaleString()}</span>
                                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>{new Date(p.transactionDate).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Repayment Progress Chart */}
                    <div className="col-lg-7">
                        <div className="card border-0 bg-soft p-4 h-100 shadow-sm">
                            <h6 className="fw-bold mb-4">Repayment Progress</h6>
                            <div style={{ height: '220px' }}>
                                <Bar 
                                    data={{
                                        labels: ['Borrowed', 'Repaid'],
                                        datasets: [{
                                            label: 'Financial Progress',
                                            data: [dashboardStats?.totalBorrowed || 0, dashboardStats?.totalRepaid || 0],
                                            backgroundColor: ['#6366f1', '#10b981'],
                                            borderRadius: 8
                                        }]
                                    }}
                                    options={{ 
                                        maintainAspectRatio: false, 
                                        indexAxis: 'y',
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                            <div className="mt-3 text-center">
                                <span className="small text-muted">
                                    You have repaid <strong>{Math.round((dashboardStats?.totalRepaid / dashboardStats?.totalBorrowed) * 100) || 0}%</strong> of your total borrowings.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold m-0" style={{ color: 'var(--color-heading)' }}>Application History</h5>
                  <button className="btn btn-primary btn-sm px-3" onClick={() => setActiveTab('apply')}>
                    <i className="bi bi-plus-lg me-2"></i>Apply for Loan
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : myLoans.length === 0 ? (
                  <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
                    <i className="bi bi-inbox fs-1 text-muted opacity-50"></i>
                    <p className="mt-3 text-muted">You haven't applied for any loans yet.</p>
                    <button className="btn btn-outline-primary" onClick={() => setActiveTab('apply')}>Start Application</button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle custom-table">
                      <thead>
                        <tr>
                          <th>Loan ID</th><th>Principal</th><th>Rate</th><th>Tenure</th>
                          <th>EMI Amount</th><th>Purpose</th><th>Status</th><th className="text-end">Actions</th>
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
                            <td>{loan.purpose || '-'}</td>
                            <td>{getStatusBadge(loan.status)}</td>
                            <td className="text-end">
                              {loan.status === 'ACTIVE' && (
                                <button
                                  className="btn btn-outline-primary btn-sm px-3"
                                  onClick={() => { setSelectedLoanId(loan.id); setActiveTab('payments'); }}
                                >
                                  Make Payment
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

            {activeTab === 'apply' && (
              <div className="mx-auto" style={{ maxWidth: '800px' }}>
                <LoanApplyForm onSuccess={() => { fetchMyLoans(); setActiveTab('overview'); }} />
              </div>
            )}

            {activeTab === 'offers' && (
              <LoanOfferList onApply={() => { fetchMyLoans(); setActiveTab('overview'); }} />
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Track & Pay Active Loan</label>
                    <select
                      className="form-select border-0 bg-soft p-3 fw-bold"
                      style={{ borderRadius: 'var(--radius-md)' }}
                      value={selectedLoanId || ''}
                      onChange={e => setSelectedLoanId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">-- Choose an active loan --</option>
                      {activeLoans.map(loan => (
                        <option key={loan.id} value={loan.id}>
                          Loan #{loan.id} · ₹{loan.amount?.toLocaleString('en-IN')} ({loan.purpose})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedLoanId ? (
                  <PaymentTracker loanId={selectedLoanId} isLender={false} />
                ) : (
                  <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
                    <i className="bi bi-credit-card fs-1 text-muted opacity-50"></i>
                    <p className="mt-3 text-muted">Select an active loan from the dropdown above to manage repayments.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-link.active {
          color: var(--color-primary) !important;
          border-bottom: 3px solid var(--color-primary) !important;
        }
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
      `}</style>
    </div>
  );
};

export default BorrowerDashboard;