import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import '../styles/global.css';
import '../styles/navbar.css';

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'ADMIN':             return 'admin';
    case 'BORROWER':          return 'borrower';
    case 'LENDER':            return 'lender';
    case 'ANALYST': return 'analyst';
    default:                  return '';
  }
};

const getRoleLabel = (role) => {
  if (!role) return '';
  switch (role) {
    case 'ADMIN': return 'ADMINISTRATOR';
    case 'LENDER': return 'LENDER ENTITY';
    case 'BORROWER': return 'BORROWER';
    case 'ANALYST': return 'FINANCIAL AUDITOR';
    default: return role.replace('_', ' ');
  }
};

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="ll-navbar animate-fade-in shadow-sm">
      {/* Brand */}
      <div className="ll-navbar-brand">
        <div className="ll-navbar-brand-dot shadow-sm" />
        <span className="brand-text">LoanLedger</span>
        {title && (
          <span className="ll-navbar-title text-muted">{title}</span>
        )}
      </div>

      {/* Right side */}
      <div className="ll-navbar-right gap-4">
        {user && (
          <div className="d-flex align-items-center gap-3">
            <div className="ll-user-identity d-none d-md-flex flex-column align-items-end">
              <span className="ll-navbar-user fw-bold">
                {user.name}
              </span>
              <span className={`ll-navbar-role-badge ${getRoleBadgeClass(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            <div className="avatar-sm rounded-circle bg-soft text-primary d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
              {user.name?.charAt(0) || 'U'}
            </div>
          </div>
        )}
        {/* Notification Bell — shown for logged-in users only */}
        {user && <NotificationBell />}
        <button className="btn btn-outline-secondary btn-sm px-3 fw-bold rounded-pill" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2"></i>Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;