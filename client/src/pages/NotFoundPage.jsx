import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const NotFoundPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full text-center bg-white p-6 sm:p-12 rounded-2xl border border-slate-200/80 shadow-md">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 border border-indigo-100">
          <HelpCircle className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">404 Error</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Back to {isAuthenticated ? 'Dashboard' : 'Home'}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
