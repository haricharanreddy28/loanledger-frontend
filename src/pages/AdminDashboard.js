import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import UserManagement from '../components/UserManagement';
import axiosInstance from '../api/axiosConfig';
import dashboardService from '../services/dashboardService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ users: 0, loans: 0, payments: 0, transactions: 0, pending: 0 });
    const [dashboardStats, setDashboardStats] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loans, setLoans] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loanFilter, setLoanFilter] = useState('ALL');

    const fetchAllData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [usersRes, loansRes, paymentsRes, txRes, pendingRes, statsRes] = await Promise.all([
                axiosInstance.get('/admin/users'),
                axiosInstance.get('/admin/loans'),
                axiosInstance.get('/admin/payments'),
                axiosInstance.get('/admin/transactions'),
                axiosInstance.get('/admin/pending-users'),
                dashboardService.getAdminStats(),
            ]);
            setStats({
                users: usersRes.data.length,
                loans: loansRes.data.length,
                payments: paymentsRes.data.length,
                transactions: txRes.data.length,
                pending: pendingRes.data.length
            });
            setDashboardStats(statsRes.data);
            setPendingUsers(pendingRes.data);
            setLoans(loansRes.data);
            setTransactions(txRes.data);
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData(true);
        const interval = setInterval(() => {
            fetchAllData(false);
        }, 8000);
        return () => clearInterval(interval);
    }, [fetchAllData]);

    const handleApprove = async (id) => {
        try {
            await axiosInstance.put(`/admin/approve/${id}`);
            setPendingUsers(prev => prev.filter(u => u.id !== id));
            setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
            alert('User approved successfully');
        } catch (err) {
            alert('Failed to approve user');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            PENDING_ANALYST: '#f59e0b',
            VISIBLE_TO_LENDER: '#10b981',
            REJECTED_BY_ANALYST: '#ef4444',
            ACTIVE: '#059669',
            COMPLETED: '#6366f1',
            PRE_OFFER_CREATED: '#6b7280'
        };
        return (
            <span style={{ 
                backgroundColor: colors[status] || '#6b7280', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '0.75rem', 
                fontWeight: '600' 
            }}>
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    const filteredLoans = loanFilter === 'ALL' 
        ? loans 
        : loans.filter(l => l.status === loanFilter);

    if (loading && stats.users === 0) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-success" role="status"></div>
            </div>
        );
    }

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#f9fafb' }}>
            <Navbar title="Admin Command Center" />
            
            <div className="container-fluid py-4 px-4">
                {/* Header Stats */}
                <div className="row g-4 mb-4">
                    {[
                        { label: 'Total Users', value: stats.users, icon: 'bi-people', color: '#2e7d5b' },
                        { label: 'Pending Approvals', value: stats.pending, icon: 'bi-person-check', color: '#f59e0b' },
                        { label: 'Active Loans', value: stats.loans, icon: 'bi-currency-exchange', color: '#10b981' },
                        { label: 'Total Recovery', value: `₹${dashboardStats?.totalRepaidAmount?.toLocaleString() || 0}`, icon: 'bi-graph-up', color: '#6366f1' },
                    ].map((stat, i) => (
                        <div key={i} className="col-md-3">
                            <div className="card border-0 shadow-sm p-3" style={{ borderLeft: `4px solid ${stat.color}` }}>
                                <div className="d-flex align-items-center">
                                    <div className="p-3 rounded-circle me-3" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                        <i className={`bi ${stat.icon} fs-4`}></i>
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-medium">{stat.label}</div>
                                        <div className="fs-4 fw-bold">{stat.value}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="card border-0 shadow-sm overflow-hidden">
                    <div className="card-header bg-white border-bottom py-3">
                        <div className="nav nav-pills">
                            {[
                                { id: 'overview', label: 'Overview', icon: 'bi-speedometer2' },
                                { id: 'approvals', label: 'Pending Approvals', count: stats.pending },
                                { id: 'users', label: 'User Management' },
                                { id: 'loans', label: 'Loan Portfolio' },
                                { id: 'payments', label: 'Financial Audit' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    className={`nav-link border-0 me-2 position-relative ${activeTab === tab.id ? 'bg-success text-white' : 'text-muted'}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card-body p-0">
                        {activeTab === 'overview' && (
                            <div className="p-4">
                                <div className="row g-4">
                                    {/* Left: Chart */}
                                    <div className="col-lg-6">
                                        <div className="card border p-4 h-100 shadow-sm">
                                            <h6 className="fw-bold mb-4">Loan Status Distribution</h6>
                                            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                                {dashboardStats?.loanStatusDistribution ? (
                                                    <Pie 
                                                        data={{
                                                            labels: Object.keys(dashboardStats.loanStatusDistribution),
                                                            datasets: [{
                                                                data: Object.values(dashboardStats.loanStatusDistribution),
                                                                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#6b7280', '#3b82f6'],
                                                                borderWidth: 0
                                                            }]
                                                        }}
                                                        options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                                                    />
                                                ) : <div className="text-muted">Loading chart...</div>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Right: Key Metrics */}
                                    <div className="col-lg-6">
                                        <div className="card border p-4 h-100 shadow-sm">
                                            <h6 className="fw-bold mb-4">System Financial Summary</h6>
                                            <div className="mb-4">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">Total Disbursed</span>
                                                    <span className="fw-bold text-dark">₹{dashboardStats?.totalDisbursedAmount?.toLocaleString()}</span>
                                                </div>
                                                <div className="progress" style={{ height: '8px' }}>
                                                    <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">Total Repayments Received</span>
                                                    <span className="fw-bold text-success">₹{dashboardStats?.totalRepaidAmount?.toLocaleString()}</span>
                                                </div>
                                                <div className="progress" style={{ height: '8px' }}>
                                                    <div className="progress-bar bg-primary" style={{ width: `${(dashboardStats?.totalRepaidAmount / dashboardStats?.totalDisbursedAmount) * 100 || 0}%` }}></div>
                                                </div>
                                            </div>
                                            
                                            <h6 className="fw-bold mt-4 mb-3">System Health</h6>
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <div className="p-3 bg-light rounded text-center">
                                                        <div className="small text-muted mb-1">Users</div>
                                                        <div className="fw-bold h5 mb-0 text-primary">{dashboardStats?.totalUsers}</div>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="p-3 bg-light rounded text-center">
                                                        <div className="small text-muted mb-1">Reviews Need</div>
                                                        <div className="fw-bold h5 mb-0 text-warning">{dashboardStats?.pendingLoanReviews}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity Table */}
                                    <div className="col-12 mt-4">
                                        <div className="card border p-4 shadow-sm">
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <h6 className="fw-bold m-0 text-uppercase small text-muted">Recent System Activity</h6>
                                                <span className="badge bg-soft-primary text-primary">Last 10 Actions</span>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table align-middle m-0">
                                                    <thead className="small bg-light text-muted">
                                                        <tr>
                                                            <th>TYPE</th><th>SENDER</th><th>RECEIVER</th><th>AMOUNT</th><th>DATE</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dashboardStats?.recentTransactions?.map(tx => (
                                                            <tr key={tx.id}>
                                                                <td><span className="badge bg-light text-dark">{tx.transactionType}</span></td>
                                                                <td>{tx.senderName}</td>
                                                                <td>{tx.receiverName}</td>
                                                                <td className="fw-bold">₹{tx.amount?.toLocaleString()}</td>
                                                                <td className="small text-muted">{new Date(tx.transactionDate).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'approvals' && (
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead className="bg-light text-muted small">
                                        <tr>
                                            <th className="ps-4">USER</th>
                                            <th>ROLE</th>
                                            <th>EMAIL</th>
                                            <th>REGISTERED</th>
                                            <th className="text-end pe-4">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingUsers.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-5 text-muted">No pending approvals</td></tr>
                                        ) : pendingUsers.map(user => (
                                            <tr key={user.id} className="border-bottom-0">
                                                <td className="ps-4 py-3 fw-medium">{user.name}</td>
                                                <td><span className="badge bg-light text-dark border">{user.role}</span></td>
                                                <td className="text-muted small">{user.email}</td>
                                                <td className="text-muted small">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td className="text-end pe-4">
                                                    <button 
                                                        className="btn btn-sm btn-success px-3"
                                                        onClick={() => handleApprove(user.id)}
                                                    >
                                                        Approve
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'users' && <div className="p-4"><UserManagement /></div>}

                        {activeTab === 'loans' && (
                            <div className="p-4">
                                <div className="d-flex justify-content-between mb-3">
                                    <h6 className="fw-bold mb-0">Loan Applications</h6>
                                    <select className="form-select form-select-sm w-auto" value={loanFilter} onChange={e => setLoanFilter(e.target.value)}>
                                        <option value="ALL">All Statuses</option>
                                        <option value="PENDING_ANALYST">Pending Analyst</option>
                                        <option value="VISIBLE_TO_LENDER">Approved</option>
                                        <option value="ACTIVE">Funded</option>
                                    </select>
                                </div>
                                <div className="table-responsive">
                                    <table className="table align-middle">
                                        <thead className="small text-muted">
                                            <tr>
                                                <th>BORROWER</th>
                                                <th>LENDER</th>
                                                <th>AMOUNT</th>
                                                <th>STATUS</th>
                                                <th>LAST UPDATED</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLoans.map(loan => (
                                                <tr key={loan.id}>
                                                    <td className="fw-medium">{loan.borrowerName}</td>
                                                    <td className="text-muted">{loan.lenderName || '---'}</td>
                                                    <td className="fw-bold text-success">₹{loan.amount?.toLocaleString()}</td>
                                                    <td>{getStatusBadge(loan.status)}</td>
                                                    <td className="small text-muted">{new Date(loan.updatedAt || loan.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="p-4">
                                <h6 className="fw-bold mb-3">Recent Transactions & Audit</h6>
                                <div className="table-responsive">
                                    <table className="table align-middle">
                                        <thead className="small text-muted">
                                            <tr>
                                                <th>SENDER</th>
                                                <th>RECEIVER</th>
                                                <th>AMOUNT</th>
                                                <th>TYPE</th>
                                                <th>DATE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.slice(0, 50).map(tx => (
                                                <tr key={tx.id}>
                                                    <td>{tx.senderName}</td>
                                                    <td>{tx.receiverName}</td>
                                                    <td className="fw-bold">₹{tx.amount?.toLocaleString()}</td>
                                                    <td><span className="text-uppercase small fw-bold text-info">{tx.transactionType}</span></td>
                                                    <td className="small text-muted">{new Date(tx.transactionDate).toLocaleString()}</td>
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
        </div>
    );
};

export default AdminDashboard;