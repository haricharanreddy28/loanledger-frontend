import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import LenderDashboard from './pages/LenderDashboard';
import BorrowerDashboard from './pages/BorrowerDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const DashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated()) return <Navigate to="/home" />;
  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin" />;
    case 'BORROWER': return <Navigate to="/borrower" />;
    case 'LENDER': return <Navigate to="/lender" />;
    case 'ANALYST': return <Navigate to="/analyst" />;
    default: return <Navigate to="/home" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<DashboardRedirect />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/borrower/*"
            element={
              <ProtectedRoute allowedRoles={['BORROWER']}>
                <BorrowerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lender/*"
            element={
              <ProtectedRoute allowedRoles={['LENDER']}>
                <LenderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyst/*"
            element={
              <ProtectedRoute allowedRoles={['ANALYST']}>
                <AnalystDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;