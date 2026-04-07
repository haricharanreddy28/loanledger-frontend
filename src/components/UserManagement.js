import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import '../styles/global.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'BORROWER'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchUsers(true);
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axiosInstance.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      if (showLoading) setError('System Error: Unable to sync user directory.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await axiosInstance.patch(`/admin/users/${userId}/status`);
      setUsers(prev => prev.map(u => u.id === userId ? response.data : u));
    } catch (err) {
      setError('Operational Failure: Could not modify access status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('IRREVERSIBLE ACTION: Permanent deletion of user account?')) return;
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError('Operational Failure: Could not remove user entity.');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newUser.name.trim()) errors.name = 'Full name is required';
    if (!newUser.email.trim()) errors.email = 'Corporate email is required';
    else if (!/\S+@\S+\.\S+/.test(newUser.email)) errors.email = 'Invalid email syntax';
    if (!newUser.password.trim()) errors.password = 'Security credential required';
    else if (newUser.password.length < 6) errors.password = 'Entropy insufficient (min 6 chars)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const response = await axiosInstance.post('/admin/users', newUser);
      setUsers(prev => [...prev, response.data]);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'BORROWER' });
    } catch (err) {
      setError(err.response?.data?.message || 'Provisioning failed.');
    }
  };

  const handleToggleFlag = async (userId) => {
    try {
      const response = await axiosInstance.patch(`/admin/users/${userId}/flag`);
      setUsers(prev => prev.map(u => u.id === userId ? response.data : u));
    } catch (err) {
      setError('Operational Failure: Could not update flag.');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const response = await axiosInstance.put(`/admin/approve/${userId}`);
      setUsers(prev => prev.map(u => u.id === userId ? response.data : u));
    } catch (err) {
      setError('Operational Failure: Could not approve user.');
    }
  };

  const filteredUsers = filterRole === 'ALL'
    ? users
    : users.filter(u => u.role === filterRole);

  const getRoleBadge = (role) => {
    const roleMap = {
      ADMIN: { class: 'bg-soft text-danger', name: 'ADMINISTRATOR' },
      BORROWER: { class: 'bg-soft text-primary', name: 'BORROWER ACCOUNT' },
      LENDER: { class: 'bg-soft text-success', name: 'LENDER ENTITY' },
      ANALYST: { class: 'bg-soft text-warning', name: 'FINANCIAL AUDITOR' }
    };
    const cfg = roleMap[role] || { class: 'bg-soft text-muted', name: role };
    return (
      <span className={`badge ${cfg.class} small border-0`} style={{ letterSpacing: '0.02em', fontSize: '10px' }}>
        {cfg.name}
      </span>
    );
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="user-management-console animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold m-0" style={{ color: 'var(--color-heading)' }}>Identity Registry</h5>
          <p className="text-muted small m-0">Centralized governance for platform participants.</p>
        </div>
        <div className="d-flex gap-3">
          <div className="input-group input-group-sm shadow-sm" style={{ width: '200px' }}>
            <span className="input-group-text bg-white border-0 ps-3"><i className="bi bi-filter text-muted"></i></span>
            <select className="form-select border-0 ps-1 fw-bold small" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="ALL">All Participant Roles</option>
                <option value="ADMIN">Administrators</option>
                <option value="BORROWER">Borrowers</option>
                <option value="LENDER">Lenders</option>
                <option value="ANALYST">Analysts</option>
            </select>
          </div>
          <button className="btn btn-primary d-flex align-items-center px-4 fw-bold shadow-sm" onClick={() => setShowCreateModal(true)}>
             <i className="bi bi-person-plus-fill me-2"></i> Provision Account
          </button>
        </div>
      </div>

      {error && <div className="alert border-0 bg-soft text-danger py-3 mb-4"><i className="bi bi-exclamation-octagon-fill me-2"></i>{error}</div>}

      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="table-responsive">
          <table className="table align-middle custom-table mb-0">
            <thead>
              <tr>
                <th className="ps-4">Entity Profile</th>
                <th>Classification</th>
                <th>Access Status</th>
                <th>Verification</th>
                <th className="text-end pe-4">Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted py-5">Directory lookup returned 0 results.</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className={user.status === 'BLOCKED' ? 'opacity-50' : 'transition-hover'}>
                  <td className="ps-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar-sm rounded-circle bg-soft text-primary d-flex align-items-center justify-content-center fw-bold me-3" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{user.name}</div>
                          <div className="small text-muted font-monospace" style={{ fontSize: '11px' }}>{user.email}</div>
                        </div>
                      </div>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <span className={`status-badge ${user.status === 'ACTIVE' ? 'status-active' : 'status-rejected'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                      {user.approved ? (
                          <span className="text-success small fw-bold d-flex align-items-center"><i className="bi bi-patch-check-fill me-1"></i> VERIFIED</span>
                      ) : (
                          <span className="text-warning small fw-bold d-flex align-items-center"><i className="bi bi-hourglass-split me-1"></i> PENDING</span>
                      )}
                  </td>
                  <td className="text-end pe-4">
                    <div className="btn-group shadow-sm">
                      {!user.approved && (
                        <button
                          className="btn btn-white btn-sm border-end"
                          onClick={() => handleApproveUser(user.id)}
                          title="Verify Entity"
                        >
                          <i className="bi bi-check-circle text-success font-bold"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-white btn-sm border-end"
                        onClick={() => handleToggleStatus(user.id)}
                        title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`bi bi-shield-${user.status === 'ACTIVE' ? 'slash text-warning' : 'check text-success'}`}></i>
                      </button>
                      <button
                        className="btn btn-white btn-sm border-end"
                        onClick={() => handleToggleFlag(user.id)}
                        title={user.flagged ? 'Clear Flag' : 'Flag Account'}
                      >
                        <i className={`bi bi-flag${user.flagged ? '-fill text-danger' : ''}`}></i>
                      </button>
                      <button
                        className="btn btn-white btn-sm"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Purge Identity"
                      >
                        <i className="bi bi-trash text-muted"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-backdrop-custom show d-flex align-items-center justify-content-center p-3">
          <div className="card border-0 shadow-lg w-100" style={{ maxWidth: '500px', borderRadius: 'var(--radius-lg)' }}>
            <div className="card-header bg-white border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold m-0"><i className="bi bi-person-plus-fill me-2 text-primary"></i>Provision New Entity</h5>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}></button>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleCreateUser}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Full Legal Name</label>
                  <input
                    type="text" className={`form-control border-0 bg-soft p-3 ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Gourav Karumudi"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  />
                  {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Corporate Email Address</label>
                  <input
                    type="email" className={`form-control border-0 bg-soft p-3 ${formErrors.email ? 'is-invalid' : ''}`}
                    placeholder="name@domain.com"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  />
                  {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Access Credential (Password)</label>
                  <input
                    type="password" className={`form-control border-0 bg-soft p-3 ${formErrors.password ? 'is-invalid' : ''}`}
                    placeholder="6+ characters recommended"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  />
                  {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase">Permission Role</label>
                  <select
                    className="form-select border-0 bg-soft p-3 fw-bold"
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="BORROWER">Participant - Borrower</option>
                    <option value="LENDER">Participant - Lender</option>
                    <option value="ANALYST">Auditor - Financial Analyst</option>
                    <option value="ADMIN">Stakeholder - Admin</option>
                  </select>
                </div>
                <div className="d-flex gap-3">
                  <button type="submit" className="btn btn-primary flex-grow-1 p-3 fw-bold shadow-sm">Provision Participant</button>
                  <button type="button" className="btn btn-outline-secondary px-4 fw-bold" onClick={() => setShowCreateModal(false)}>Cancel</button>
                </div>
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
        .btn-white:hover { background-color: var(--color-bg); }
      `}</style>
    </div>
  );
};

export default UserManagement;