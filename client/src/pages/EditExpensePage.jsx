import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Edit2,
  IndianRupee,
  Store,
  Tag,
  Calendar,
  FileText,
  ArrowLeft,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { expenseService } from '../services/api.js';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';
import { useToast } from '../components/Toast.jsx';

const CATEGORIES = [
  'Housing',
  'Transportation',
  'Food & Dining',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Personal Care',
  'Miscellaneous',
];

export const EditExpensePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [expenseDate, setExpenseDate] = useState('');
  const [notes, setNotes] = useState('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchExpense = async () => {
      setInitialLoading(true);
      try {
        const response = await expenseService.getExpenseById(id);
        const exp = response.data;
        setAmount(String(exp.amount));
        setMerchant(exp.merchant);
        setCategory(exp.category);
        setExpenseDate(exp.expense_date);
        setNotes(exp.notes || '');
      } catch (err) {
        setErrorMsg('Expense record not found or unauthorized.');
        toastError('Expense record not found.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchExpense();
  }, [id, toastError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    if (!merchant.trim()) {
      setErrorMsg('Merchant name is required.');
      return;
    }

    setSaving(true);
    try {
      await expenseService.updateExpense(id, {
        amount: numericAmount,
        merchant: merchant.trim(),
        category,
        expense_date: expenseDate,
        notes: notes.trim() || null,
      });

      success('Expense updated successfully!');
      navigate('/expenses');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Failed to update expense.';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await expenseService.deleteExpense(id);
      success('Expense deleted successfully.');
      navigate('/expenses');
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <LoadingSpinner size="lg" text="Loading expense details..." />
      </div>
    );
  }

  if (errorMsg && !merchant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Expense Not Found</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            The requested expense does not exist or you do not have permission to view it.
          </p>
          <Link
            to="/expenses"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Expenses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 min-w-0">
      {/* Back button */}
      <Link
        to="/expenses"
        className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Expenses
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-4 sm:p-8">
        <div className="flex items-center justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Edit Expense</h1>
              <p className="text-xs sm:text-sm text-slate-500">Modify transaction details</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Amount (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 text-base font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Merchant / Payee <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Store className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={100}
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Whole Foods, Shell, Starbucks"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-slate-700"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes (Optional)
            </label>
            <div className="relative rounded-xl">
              <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                rows={3}
                maxLength={255}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 text-right">{notes.length}/255 characters</p>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Link
              to="/expenses"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Expense</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to permanently delete this expense record for{' '}
              <strong className="text-slate-900">{merchant}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditExpensePage;
