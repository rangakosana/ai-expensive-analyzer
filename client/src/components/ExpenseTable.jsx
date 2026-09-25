import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Calendar, FileText, AlertTriangle, Inbox } from 'lucide-react';
import { TableSkeleton } from './LoadingSpinner.jsx';

const CATEGORY_BADGE_CLASSES = {
  'Housing': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Transportation': 'bg-sky-50 text-sky-700 border-sky-200',
  'Food & Dining': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Utilities': 'bg-amber-50 text-amber-700 border-amber-200',
  'Entertainment': 'bg-pink-50 text-pink-700 border-pink-200',
  'Healthcare': 'bg-rose-50 text-rose-700 border-rose-200',
  'Shopping': 'bg-purple-50 text-purple-700 border-purple-200',
  'Personal Care': 'bg-teal-50 text-teal-700 border-teal-200',
  'Miscellaneous': 'bg-slate-100 text-slate-700 border-slate-200',
};

export const ExpenseTable = ({
  expenses = [],
  loading = false,
  onDelete,
  showActions = true,
  limit,
}) => {
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return <TableSkeleton rows={limit || 5} />;
  }

  const displayedExpenses = limit ? expenses.slice(0, limit) : expenses;

  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-800">No expenses logged</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          There are no expenses recorded matching your criteria. Start tracking your daily spending now.
        </p>
        <Link
          to="/expenses/new"
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Add Your First Expense
        </Link>
      </div>
    );
  }

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setDeleting(true);
    try {
      await onDelete(expenseToDelete.id);
      setExpenseToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Amount
                </th>
                {showActions && (
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayedExpenses.map((expense) => {
                const badgeClass =
                  CATEGORY_BADGE_CLASSES[expense.category] || 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <tr key={expense.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span>{expense.expense_date}</span>
                      </div>
                    </td>

                    {/* Merchant */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">{expense.merchant}</div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}
                      >
                        {expense.category}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                      {expense.notes ? (
                        <span title={expense.notes} className="flex items-center">
                          <FileText className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{expense.notes}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                      ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/expenses/${expense.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setExpenseToDelete(expense)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
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
              Are you sure you want to permanently delete this expense of{' '}
              <strong className="text-slate-900">₹{Number(expenseToDelete.amount).toFixed(2)}</strong> at{' '}
              <strong className="text-slate-900">{expenseToDelete.merchant}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseTable;
