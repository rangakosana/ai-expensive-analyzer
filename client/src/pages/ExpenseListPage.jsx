import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  PlusCircle,
  Receipt,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { expenseService } from '../services/api.js';
import { ExpenseTable } from '../components/ExpenseTable.jsx';
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

export const ExpenseListPage = () => {
  const [searchParams] = useSearchParams();
  const dateFromQuery = searchParams.get('date');
  const monthFromQuery = searchParams.get('month');

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState(
    dateFromQuery ? 'day' : 'month'
  );
  const [selectedMonth, setSelectedMonth] = useState(
    monthFromQuery || (dateFromQuery ? '' : new Date().toISOString().slice(0, 7))
  );
  const [selectedDate, setSelectedDate] = useState(dateFromQuery || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { error: toastError, success: toastSuccess } = useToast();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;

      if (dateFilterMode === 'day' && selectedDate) {
        params.date = selectedDate;
      } else if (dateFilterMode === 'range') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else if (dateFilterMode === 'month' && selectedMonth) {
        params.month = selectedMonth;
      }

      const response = await expenseService.getExpenses(params);
      setExpenses(response.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to fetch expenses list.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, dateFilterMode, selectedMonth, selectedDate, startDate, endDate, toastError]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDeleteExpense = async (id) => {
    try {
      await expenseService.deleteExpense(id);
      toastSuccess('Expense record deleted successfully.');
      fetchExpenses();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to delete expense.');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedMonth('');
    setSelectedDate('');
    setStartDate('');
    setEndDate('');
    setDateFilterMode('all');
  };

  const setFilterToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDateFilterMode('day');
    setSelectedDate(today);
  };

  const totalFilteredAmount = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const hasActiveFilters = !!(
    search ||
    selectedCategory ||
    (dateFilterMode === 'month' && selectedMonth) ||
    (dateFilterMode === 'day' && selectedDate) ||
    (dateFilterMode === 'range' && (startDate || endDate))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Expense Records
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and manage all logged transactions
          </p>
        </div>

        <Link
          to="/expenses/new"
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Expense
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Date Filter Type Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setDateFilterMode('month');
                if (!selectedMonth) setSelectedMonth(new Date().toISOString().slice(0, 7));
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilterMode === 'month'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              📅 Month
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilterMode('day');
                if (!selectedDate) setSelectedDate(new Date().toISOString().slice(0, 10));
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilterMode === 'day'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              📆 Specific Date
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('range')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilterMode === 'range'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              ↔️ Date Range
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilterMode === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              🌐 All Dates
            </button>
          </div>

          <button
            type="button"
            onClick={setFilterToday}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            ⚡ Today's Expenses
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant or notes..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-slate-700"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Date Filter Input */}
          {dateFilterMode === 'month' && (
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                title="Filter by Year & Month"
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-slate-700 cursor-pointer"
              />
            </div>
          )}

          {dateFilterMode === 'day' && (
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                title="Select specific Day & Date"
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-indigo-50/50 border border-indigo-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-slate-700 cursor-pointer font-medium"
              />
            </div>
          )}

          {dateFilterMode === 'range' && (
            <div className="flex items-center space-x-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="From Date"
                placeholder="From"
                className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition-all text-slate-700 cursor-pointer"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="To Date"
                placeholder="To"
                className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition-all text-slate-700 cursor-pointer"
              />
            </div>
          )}

          {dateFilterMode === 'all' && (
            <div className="flex items-center px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <Calendar className="w-4 h-4 mr-2 text-slate-300" />
              Showing all recorded dates
            </div>
          )}

          {/* Filter Actions */}
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </button>
            )}
            <button
              onClick={fetchExpenses}
              disabled={loading}
              title="Refresh"
              className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ml-auto cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Summary Stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{expenses.length}</strong> matching transaction
            {expenses.length === 1 ? '' : 's'}
          </span>
          <span>
            Total Filtered Sum:{' '}
            <strong className="text-indigo-600 text-sm font-bold">
              ₹{totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={fetchExpenses} className="text-xs font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {/* Expense Data Table */}
      <ExpenseTable
        expenses={expenses}
        loading={loading}
        onDelete={handleDeleteExpense}
        showActions={true}
      />
    </div>
  );
};

export default ExpenseListPage;
