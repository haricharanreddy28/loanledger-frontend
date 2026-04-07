import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure 'id' exists as 'userId' for convenience/consistency
      if (parsedUser.userId && !parsedUser.id) {
        parsedUser.id = parsedUser.userId;
      }
      setToken(storedToken);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    const userData = {
      id: authData.userId, // Map userId to id for user-requested consistency
      userId: authData.userId,
      name: authData.name,
      email: authData.email,
      role: authData.role,
    };
    localStorage.setItem('token', authData.token || 'dummy-token');
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authData.token || 'dummy-token');
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => !!token;

  const hasRole = (role) => user && user.role === role;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};