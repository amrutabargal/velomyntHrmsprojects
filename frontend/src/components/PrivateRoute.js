import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-dark-bg-tertiary border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-dark-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="text-dark-text-secondary">You don't have permission to access this page.</p>
        {user?.status === 'pending' && (
          <p className="text-yellow-500 mt-2">Your account is pending admin approval.</p>
        )}
      </div>
    );
  }

  return <Layout>{children}</Layout>;
};

export default PrivateRoute;

