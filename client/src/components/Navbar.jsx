import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  LayoutDashboard,
  Calendar,
  Receipt,
  Sparkles,
  PlusCircle,
  LogOut,
  User,
  Menu,
  X,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { info } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    info('You have been logged out.');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 text-base font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">AI Expense</span>
                <span className="text-lg font-semibold text-indigo-600"> Analyzer</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:ml-8 md:flex md:space-x-1">
                <NavLink to="/dashboard" className={navLinkClass}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </NavLink>
                <NavLink to="/calendar" className={navLinkClass}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </NavLink>
                <NavLink to="/expenses" end className={navLinkClass}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Expenses
                </NavLink>
                <NavLink to="/insights" className={navLinkClass}>
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                  AI Insights
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <ShieldCheck className="w-4 h-4 mr-2 text-purple-600" />
                    Admin Panel
                  </NavLink>
                )}
              </nav>
            )}
          </div>

          {/* Right Header Section */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/expenses/new"
                  className="inline-flex items-center px-3.5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add Expense
                </Link>

                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user?.name || 'Account'}
                  </span>
                  {user?.role === 'admin' && (
                    <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                      Admin
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/dashboard');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-onboarding-guide'));
                    }, 50);
                  }}
                  title="App Guide & Interactive Tour"
                  className="inline-flex items-center p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="inline-flex items-center p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    {user?.name}
                    {user?.role === 'admin' && (
                      <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
              </div>

              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </NavLink>
              <NavLink
                to="/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Calendar className="w-5 h-5 mr-3" />
                Calendar
              </NavLink>
              <NavLink
                to="/expenses"
                end
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Receipt className="w-5 h-5 mr-3" />
                Expenses
              </NavLink>
              <NavLink
                to="/insights"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Sparkles className="w-5 h-5 mr-3 text-amber-500" />
                AI Insights
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass}
                >
                  <ShieldCheck className="w-5 h-5 mr-3 text-purple-600" />
                  Admin Panel
                </NavLink>
              )}
              <NavLink
                to="/expenses/new"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <PlusCircle className="w-5 h-5 mr-3 text-indigo-600" />
                Add Expense
              </NavLink>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-onboarding-guide'));
                    }, 50);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-base font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-5 h-5 mr-3 text-slate-500" />
                  App Tour & Guide
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-base font-medium rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex justify-center py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex justify-center py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
