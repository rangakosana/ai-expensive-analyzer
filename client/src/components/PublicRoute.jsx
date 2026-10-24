import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingSpinner } from './LoadingSpinner.jsx';

/**
 * PublicRoute restricts access for authenticated users.
 * When a logged-in user visits the welcome / landing page ('/') or auth pages ('/login', '/register'),
 * they are automatically redirected directly into the application (/dashboard),
 * matching expected behavior in modern web applications.
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading session..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicRoute;
