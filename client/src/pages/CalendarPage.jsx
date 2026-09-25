import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Receipt,
  IndianRupee,
  Clock,
  Tag,
  ArrowRight,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { expenseService } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATEGORY_COLORS = {
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

const CATEGORY_DOT_COLORS = {
  'Housing': 'bg-indigo-500',
  'Transportation': 'bg-sky-500',
  'Food & Dining': 'bg-emerald-500',
  'Utilities': 'bg-amber-500',
  'Entertainment': 'bg-pink-500',
  'Healthcare': 'bg-rose-500',
  'Shopping': 'bg-purple-500',
  'Personal Care': 'bg-teal-500',
  'Miscellaneous': 'bg-slate-500',
};

export const CalendarPage = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const currentMonthStr = todayStr.slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Parse Year and Month
  const [yearNum, monthNum] = useMemo(() => {
    const parts = selectedMonth.split('-').map(Number);
    return [parts[0] || today.getFullYear(), parts[1] || today.getMonth() + 1];
  }, [selectedMonth, today]);

  // Fetch month expenses
  const fetchMonthExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.getExpenses({ month: selectedMonth });
      setExpenses(response.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load expenses for this month.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, toastError]);

  useEffect(() => {
    fetchMonthExpenses();
  }, [fetchMonthExpenses]);

  // Make sure selectedDate stays within the chosen month, or default to 1st of that month if shifted
  useEffect(() => {
    if (!selectedDate.startsWith(selectedMonth)) {
      setSelectedDate(`${selectedMonth}-01`);
    }
  }, [selectedMonth, selectedDate]);

  // Group expenses by date: { 'YYYY-MM-DD': [expenses...] }
  const expensesByDate = useMemo(() => {
    const map = {};
    expenses.forEach((item) => {
      const d = item.expense_date;
      if (!map[d]) map[d] = [];
      map[d].push(item);
    });
    return map;
  }, [expenses]);

  // Monthly metrics
  const monthMetrics = useMemo(() => {
    const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const activeDates = Object.keys(expensesByDate);
    const activeDayCount = activeDates.length;

    let highestDay = null;
    let highestAmount = 0;
    activeDates.forEach((d) => {
      const daySum = expensesByDate[d].reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      if (daySum > highestAmount) {
        highestAmount = daySum;
        highestDay = { date: d, amount: daySum };
      }
    });

    const averagePerActiveDay = activeDayCount > 0 ? totalSpent / activeDayCount : 0;

    return {
      totalSpent,
      transactionCount: expenses.length,
      activeDayCount,
      highestDay,
      averagePerActiveDay,
    };
  }, [expenses, expensesByDate]);

  // Calendar days grid calculation
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(yearNum, monthNum - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInCurrentMonth = new Date(yearNum, monthNum, 0).getDate();
    const daysInPrevMonth = new Date(yearNum, monthNum - 1, 0).getDate();

    const cells = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
      const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayExpenses = expensesByDate[dateStr] || [];
      const totalAmount = dayExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        expenses: dayExpenses,
        totalAmount,
        hasExpenses: dayExpenses.length > 0,
      });
    }

    // 3. Next month leading days to complete the 7-column grid
    const remainingSlots = (7 - (cells.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
      const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
      const nextYear = monthNum === 12 ? yearNum + 1 : yearNum;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      cells.push({
        dayNum: nextDay,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [yearNum, monthNum, todayStr, expensesByDate]);

  // Navigate months
  const handleShiftMonth = (offset) => {
    const d = new Date(yearNum, monthNum - 1 + offset, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleJumpToToday = () => {
    setSelectedMonth(currentMonthStr);
    setSelectedDate(todayStr);
  };

  // Expenses for the currently selected date
  const selectedDayExpenses = useMemo(() => {
    return expensesByDate[selectedDate] || [];
  }, [expensesByDate, selectedDate]);

  const selectedDayTotal = useMemo(() => {
    return selectedDayExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [selectedDayExpenses]);

  // Selected date human readable
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Delete an expense
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setDeleting(true);
    try {
      await expenseService.deleteExpense(expenseToDelete.id);
      toastSuccess('Expense deleted successfully.');
      setExpenseToDelete(null);
      fetchMonthExpenses();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Monthly Calendar & Daily Activity
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Explore day-by-day spending, inspect transactions on any date, and log new purchases
              </p>
            </div>
          </div>
        </div>

        {/* Month Navigation & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              onClick={() => handleShiftMonth(-1)}
              title="Previous Month"
              className="p-2 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1.5 text-sm font-bold text-slate-800 border-x border-slate-100 min-w-[140px] text-center">
              {MONTH_NAMES[monthNum - 1]} {yearNum}
            </div>
            <button
              onClick={() => handleShiftMonth(1)}
              title="Next Month"
              className="p-2 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Today
          </button>

          <button
            onClick={fetchMonthExpenses}
            title="Refresh"
            disabled={loading}
            className="p-2 text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <Link
            to={`/expenses/new?date=${selectedDate}`}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add for {selectedDate.slice(8)}th
          </Link>
        </div>
      </div>

      {/* Monthly Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Month Spent
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{monthMetrics.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 mt-2 flex items-center">
            Across {monthMetrics.transactionCount} total transaction{monthMetrics.transactionCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Spending Days
          </p>
          <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">
            {monthMetrics.activeDayCount} <span className="text-sm font-normal text-slate-500">days</span>
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Days with logged expenses
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Highest Spending Day
          </p>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
            {monthMetrics.highestDay
              ? `₹${monthMetrics.highestDay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'None'}
          </h3>
          <p className="text-xs text-slate-400 mt-2 truncate">
            {monthMetrics.highestDay ? `Peak on ${monthMetrics.highestDay.date}` : 'No expenditure recorded'}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Daily Average (Active)
          </p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{monthMetrics.averagePerActiveDay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Average per active spending day
          </p>
        </div>
      </div>

      {/* Main Grid: Calendar Grid (7 cols) + Selected Day Inspector (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid View (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
              {MONTH_NAMES[monthNum - 1]} {yearNum}
            </h2>
            <div className="text-xs text-slate-500 font-medium">
              Click any date to inspect transactions
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-1 border-b border-slate-100">
            {WEEKDAYS.map((day, i) => (
              <div key={day} className={i === 0 || i === 6 ? 'text-slate-400' : ''}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarGrid.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDate;
              const hasItems = cell.hasExpenses;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!cell.isCurrentMonth}
                  onClick={() => cell.isCurrentMonth && setSelectedDate(cell.dateStr)}
                  className={`min-h-[76px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-xl text-left flex flex-col justify-between transition-all duration-150 relative border cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/50 border-transparent text-slate-300 opacity-40 cursor-default'
                      : isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                      : hasItems
                      ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300'
                      : 'bg-white hover:bg-slate-50/80 border-slate-100 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {/* Day header: Day number & Today indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                        cell.isToday
                          ? 'bg-indigo-600 text-white'
                          : isSelected
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'text-slate-800'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {cell.isToday && (
                      <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day content: Spending pill or empty state */}
                  <div className="w-full mt-1">
                    {hasItems ? (
                      <div className="space-y-1">
                        <div className="inline-flex items-center w-full px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] sm:text-xs font-bold truncate">
                          ₹{cell.totalAmount >= 1000 ? `${(cell.totalAmount / 1000).toFixed(1)}k` : cell.totalAmount}
                        </div>
                        {/* Category Dots */}
                        <div className="flex items-center space-x-1 overflow-hidden">
                          {cell.expenses.slice(0, 3).map((exp, expIdx) => (
                            <span
                              key={expIdx}
                              className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT_COLORS[exp.category] || 'bg-slate-400'}`}
                              title={exp.category}
                            />
                          ))}
                          {cell.expenses.length > 3 && (
                            <span className="text-[9px] text-slate-400 leading-none">
                              +{cell.expenses.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : cell.isCurrentMonth ? (
                      <div className="h-4"></div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-2">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mr-1.5" />
                Today
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-100 border border-emerald-300 mr-1.5" />
                Has Expenses
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-md border-2 border-indigo-600 mr-1.5" />
                Selected Day
              </span>
            </div>
            <Link
              to={`/expenses?month=${selectedMonth}`}
              className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
            >
              View all in table <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Selected Day Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6 sticky top-24">
          {/* Day Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                Daily Breakdown
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                {selectedDateFormatted}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDayExpenses.length} transaction{selectedDayExpenses.length !== 1 ? 's' : ''} logged
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">Total Spent</p>
              <h3 className="text-2xl font-black text-slate-900">
                ₹{selectedDayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          {/* Expenses List for this Date */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {selectedDayExpenses.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Expenses Recorded</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
                  No purchases logged for this date. It was a zero-spending day!
                </p>
                <Link
                  to={`/expenses/new?date=${selectedDate}`}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Log Expense for this Day
                </Link>
              </div>
            ) : (
              selectedDayExpenses.map((expense) => {
                const badgeClass =
                  CATEGORY_COLORS[expense.category] || 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={expense.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md border ${badgeClass}`}>
                            {expense.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                          {expense.merchant}
                        </h4>
                        {expense.notes && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {expense.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/60 opacity-90 group-hover:opacity-100">
                      <Link
                        to={`/expenses/${expense.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs inline-flex items-center"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs inline-flex items-center cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to={`/expenses/new?date=${selectedDate}`}
              className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Expense on this Date
            </Link>

            <Link
              to={`/expenses?date=${selectedDate}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              title="Open filtered list in Records view"
            >
              <Receipt className="w-4 h-4 mr-1.5" />
              View in Records
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Expense Record?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-semibold text-slate-800">{expenseToDelete.merchant}</span> (₹{expenseToDelete.amount}) on {expenseToDelete.expense_date}? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteExpense}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center"
              >
                {deleting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
