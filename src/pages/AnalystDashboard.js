import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AnalystReviewPanel from '../components/AnalystReviewPanel';
import axiosInstance from '../api/axiosConfig';
import dashboardService from '../services/dashboardService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import '../styles/global.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const AnalystDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loanSummary, setLoanSummary] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [repaymentTrends, setRepaymentTrends] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchAllAnalytics(true);
    const interval = setInterval(() => {
      fetchAllAnalytics(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllAnalytics = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [summaryRes, riskRes, repaymentRes, activityRes, reportsRes, borrowersRes, lendersRes, pendingRes] = await Promise.all([
        dashboardService.getAnalystLoanSummary(),
        dashboardService.getRiskAnalysis(),
        dashboardService.getRepaymentTrends(),
        dashboardService.getUserActivity(),
        axiosInstance.get('/analyst/my-reports'),
        axiosInstance.get('/analyst/borrowers'),
        axiosInstance.get('/analyst/lenders'),
        axiosInstance.get('/analyst/pending-reviews')
      ]);

      setLoanSummary(summaryRes.data);
      setRiskAnalysis(riskRes.data);
      setRepaymentTrends(repaymentRes.data);
      setUserActivity(activityRes.data);
      setMyReports(reportsRes.data);
      setBorrowers(borrowersRes.data);
      setLenders(lendersRes.data);
      setPendingCount(pendingRes.data.length);
    } catch (err) {
      console.error('Failed to fetch analyst analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk) => {
    const riskClasses = {
      LOW: 'bg-soft text-primary border border-success',
      MEDIUM: 'bg-soft text-warning border border-warning',
      HIGH: 'bg-soft text-danger border border-danger'
    };
    return (
      <span className={`status-badge ${riskClasses[risk] || 'bg-soft text-muted'}`} style={{ fontSize: '0.7rem' }}>
        {risk}
      </span>
    );
  };

  const getEligibilityBadge = (elig) => {
    return (
      <span className={`status-badge ${elig === 'APPROVED' ? 'status-active' : 'status-rejected'}`}>
        {elig}
      </span>
    );
  };

  return (
    <div className="min-vh-100 bg-soft">
      <Navbar title="Analyst Command Center" />
      
      <div className="container-fluid py-4 px-4">
        {/* ── Analytical Overview ──────────────────────────── */}
        <div className="row g-4 mb-4">
          {[
            { label: 'Pending Reviews', value: loanSummary?.pendingLoanReviews || 0, icon: 'bi-hourglass-split', color: '#ca8a04' },
            { label: 'Avg Risk Score', value: loanSummary?.averageRiskScore?.toFixed(2) || '0.00', icon: 'bi-shield-check', color: 'var(--color-primary)' },
            { label: 'Verified Borrowers', value: loanSummary?.totalVerifiedBorrowers || 0, icon: 'bi-person-check', color: '#16a34a' },
            { label: 'Active Lenders', value: loanSummary?.totalActiveLenders || 0, icon: 'bi-bank', color: '#4b5563' },
          ].map((stat, idx) => (
            <div key={idx} className="col-md-3">
              <div className="card border-0 shadow-sm transition-hover" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="card-body d-flex align-items-center p-4">
                  <div className="flex-grow-1">
                    <div className="text-uppercase small fw-bold text-muted mb-1">{stat.label}</div>
                    <div className="h3 mb-0 fw-bold" style={{ color: 'var(--color-heading)' }}>{stat.value}</div>
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
                { key: 'overview', label: 'Overview', icon: 'bi-speedometer2' },
                { key: 'review', label: 'Queue', icon: 'bi-search' },
                { key: 'reports', label: 'History', icon: 'bi-clipboard-data' },
                { key: 'borrowers', label: 'Borrowers', icon: 'bi-people' },
                { key: 'lenders', label: 'Lenders', icon: 'bi-bank' },
              ].map(tab => (
                <li key={tab.key} className="nav-item">
                  <button
                    className={`nav-link border-0 px-4 py-3 ${activeTab === tab.key ? 'active fw-bold text-primary border-bottom' : 'text-muted'}`}
                    style={activeTab === tab.key ? { borderBottom: '3px solid var(--color-primary) !important', backgroundColor: 'transparent' } : { backgroundColor: 'transparent' }}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                    {tab.key === 'review' && pendingCount > 0 && (
                      <span className="badge rounded-pill bg-danger ms-2">{pendingCount}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-body p-4">
            {activeTab === 'overview' && (
              <div>
                <div className="row g-4 mb-4">
                  <div className="col-lg-4">
                    <div className="card border-0 bg-soft p-4 h-100">
                      <h6 className="fw-bold mb-4">Risk Distribution</h6>
                      <div style={{ height: '250px' }}>
                        {riskAnalysis ? (
                          <Pie
                            data={{
                              labels: Object.keys(riskAnalysis.riskLevelDistribution),
                              datasets: [{
                                data: Object.values(riskAnalysis.riskLevelDistribution),
                                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                                borderWidth: 0
                              }]
                            }}
                            options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                          />
                        ) : <div className="text-center py-5">Loading...</div>}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="card border-0 bg-soft p-4 h-100">
                      <h6 className="fw-bold mb-4">Repayment Velocity (%)</h6>
                      <div style={{ height: '250px' }}>
                        {repaymentTrends ? (
                          <Bar
                            data={{
                              labels: ['Repayment Velocity'],
                              datasets: [{
                                label: 'Velocity %',
                                data: [repaymentTrends.repaymentVelocity],
                                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                borderRadius: 6
                              }]
                            }}
                            options={{ 
                              maintainAspectRatio: false,
                              scales: { y: { beginAtZero: true, max: 100 } }
                            }}
                          />
                        ) : <div className="text-center py-5">Loading...</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <h6 className="fw-bold mb-3 mt-4">Registration Velocity (Last 7 Days)</h6>
                <div className="card border-0 bg-soft p-4" style={{ height: '200px' }}>
                  <Line
                    data={{
                      labels: userActivity.map(d => d.label),
                      datasets: [{
                        label: 'Registrations',
                        data: userActivity.map(d => d.value),
                        borderColor: 'var(--color-primary)',
                        tension: 0.4,
                        fill: true,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)'
                      }]
                    }}
                    options={{ maintainAspectRatio: false }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div>
                <h5 className="fw-bold mb-4" style={{ color: 'var(--color-heading)' }}>Application Queue</h5>
                <AnalystReviewPanel onReviewSubmit={() => fetchAllAnalytics(true)} />
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h5 className="fw-bold mb-4">My Submitted Analysis</h5>
                {loading ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : myReports.length === 0 ? (
                  <div className="text-center py-5 bg-soft rounded" style={{ border: '1px dashed var(--color-border)' }}>
                    <i className="bi bi-clipboard-x fs-1 text-muted opacity-50"></i>
                    <p className="mt-3 text-muted">No reports submitted yet. Review pending loans first.</p>
                    <button className="btn btn-outline-primary" onClick={() => setActiveTab('review')}>Open Review Queue</button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle custom-table">
                      <thead>
                        <tr>
                          <th>Report ID</th><th>Loan ID</th><th>Risk Analysis</th>
                          <th>Decision</th><th>Notes</th><th>Audited Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myReports.map(report => (
                          <tr key={report.id}>
                            <td className="small text-muted">#{report.id}</td>
                            <td className="fw-bold text-primary">#{report.loanId}</td>
                            <td>{getRiskBadge(report.riskLevel)}</td>
                            <td>{getEligibilityBadge(report.eligibility)}</td>
                            <td>
                              <span className="small text-muted" title={report.comments}>
                                {report.comments?.length > 40
                                  ? report.comments.substring(0, 40) + '...'
                                  : report.comments || 'No comments provided'}
                              </span>
                            </td>
                            <td className="small text-muted">
                              {report.reviewedAt ? new Date(report.reviewedAt).toLocaleDateString('en-IN') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'borrowers' && (
              <div>
                <h5 className="fw-bold mb-4">Borrower Registry</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle custom-table">
                    <thead>
                      <tr><th>ID</th><th>Legal Name</th><th>Contact Email</th><th>Status</th><th>Registration</th></tr>
                    </thead>
                    <tbody>
                      {borrowers.map(b => (
                        <tr key={b.id}>
                          <td className="small text-muted">#{b.id}</td>
                          <td className="fw-bold">{b.name}</td>
                          <td>{b.email}</td>
                          <td>
                            <span className={`status-badge ${b.approved ? 'status-active' : 'status-pending'}`}>
                              {b.approved ? 'VERIFIED' : 'PENDING'}
                            </span>
                          </td>
                          <td className="small text-muted">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'lenders' && (
              <div>
                <h5 className="fw-bold mb-4">Verified Lender Network</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle custom-table">
                    <thead>
                      <tr><th>ID</th><th>Institution / Name</th><th>Contact Email</th><th>Status</th><th>Verification Date</th></tr>
                    </thead>
                    <tbody>
                      {lenders.map(l => (
                        <tr key={l.id}>
                          <td className="small text-muted">#{l.id}</td>
                          <td className="fw-bold">{l.name}</td>
                          <td>{l.email}</td>
                          <td>
                            <span className={`status-badge ${l.approved ? 'status-active' : 'status-pending'}`}>
                              {l.approved ? 'CERTIFIED' : 'GATED'}
                            </span>
                          </td>
                          <td className="small text-muted">{new Date(l.createdAt).toLocaleDateString('en-IN')}</td>
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

export default AnalystDashboard;