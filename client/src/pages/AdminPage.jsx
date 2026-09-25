import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  Receipt,
  IndianRupee,
  Activity,
  Search,
  Key,
  Trash2,
  Eye,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Lock,
} from 'lucide-react';
import { adminService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';

export const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals state
  const [expenseModalUser, setExpenseModalUser] = useState(null);
  const [userExpenses, setUserExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toastError(err.response?.data?.error || 'Failed to load administrator dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Open expenses inspection modal
  const handleOpenExpenses = async (u) => {
    setExpenseModalUser(u);
    setLoadingExpenses(true);
    try {
      const res = await adminService.getUserExpenses(u.id);
      setUserExpenses(res.data.expenses);
    } catch (err) {
      toastError('Failed to load expenses for ' + u.email);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Toggle user role
  const handleToggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMessage =
      nextRole === 'admin'
        ? `Grant administrator privileges to ${targetUser.email}?`
        : `Revoke administrator privileges from ${targetUser.email}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await adminService.updateUserRole(targetUser.id, nextRole);
      success(`Role updated: ${targetUser.name} is now a ${nextRole}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
      );
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to update user role.');
    }
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toastError('Password must be at least 8 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await adminService.resetUserPassword(passwordModalUser.id, newPassword);
      success(`Password reset successfully for ${passwordModalUser.email}`);
      setPasswordModalUser(null);
      setNewPassword('');
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeletingUser(true);
    try {
      await adminService.deleteUser(deleteModalUser.id);
      success(`User ${deleteModalUser.email} deleted successfully.`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
      setDeleteModalUser(null);
      // Refresh stats
      const statsRes = await adminService.getStats();
      setStats(statsRes.data);
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeletingUser(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading administrator portal..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              SUPER ADMIN
            </span>
            <span className="text-xs text-slate-500">Platform Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage registered users, inspect expense records across accounts, and oversee platform analytics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalUsers}</p>
                <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalExpenses}</p>
                <p className="text-xs text-slate-500 mt-1">Across all accounts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Platform Volume
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{stats.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Total recorded spend</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Budgets
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalBudgets}</p>
                <p className="text-xs text-slate-500 mt-1">Configured monthly plans</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Directory Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredUsers.length} of {users.length} registered accounts
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  roleFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  roleFilter === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admins
              </button>
              <button
                onClick={() => setRoleFilter('user')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  roleFilter === 'user'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Users
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 text-sm">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            User
                          </span>
                        )}
                      </td>

                      {/* Expenses Count */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800">
                          {u.expense_count} {u.expense_count === 1 ? 'entry' : 'entries'}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">
                          ₹{u.total_spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        {u.budget_income ? (
                          <span className="text-emerald-700 font-medium">
                            ₹{u.budget_income.toLocaleString('en-IN')} / mo
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not configured</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Inspect Expenses Button */}
                          <button
                            onClick={() => handleOpenExpenses(u)}
                            title="Inspect Expenses"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => setPasswordModalUser(u)}
                            title="Reset Password"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Toggle Role Button */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleToggleRole(u)}
                              title={isAdmin ? 'Revoke Admin' : 'Make Admin'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isAdmin
                                  ? 'text-purple-600 hover:bg-purple-50'
                                  : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                              }`}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete User Button */}
                          {!isCurrent && (
                            <button
                              onClick={() => setDeleteModalUser(u)}
                              title="Delete Account"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Inspect User Expenses */}
      {expenseModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  Expenses Audit: {expenseModalUser.name}
                </h3>
                <p className="text-xs text-slate-500">{expenseModalUser.email}</p>
              </div>
              <button
                onClick={() => setExpenseModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingExpenses ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner size="md" text="Fetching transactions..." />
                </div>
              ) : userExpenses.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  This user has not logged any expenses yet.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <span>Total Transactions: <strong>{userExpenses.length}</strong></span>
                    <span>
                      Total Spent:{' '}
                      <strong className="text-slate-900">
                        ₹
                        {userExpenses
                          .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                          .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </span>
                  </div>

                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Date</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Merchant</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Category</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Notes</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-600">
                            {new Date(exp.expense_date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-slate-900">
                            {exp.merchant}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">
                            {exp.notes || '—'}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-xs font-bold text-slate-900 text-right">
                            ₹{parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setExpenseModalUser(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset User Password */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleResetPassword}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  Reset Password
                </h3>
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600">
                  You are setting a new password for{' '}
                  <strong className="text-slate-900">{passwordModalUser.email}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    New Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new secure password..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete User Confirmation */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Delete Account?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete account{' '}
                  <strong className="text-slate-800">{deleteModalUser.email}</strong>? All their logged
                  expenses, budget goals, and AI insights will be erased. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleDeleteUser}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                {deletingUser ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
