import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  PlusCircle,
  Sparkles,
  Receipt,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { expenseService, budgetService } from '../services/api.js';
import { DashboardStats } from '../components/DashboardStats.jsx';
import { CategoryChart } from '../components/CategoryChart.jsx';
import { ExpenseTable } from '../components/ExpenseTable.jsx';
import { DailySpendingStrip } from '../components/DailySpendingStrip.jsx';
import { BudgetPacingCard } from '../components/BudgetPacingCard.jsx';
import { BudgetModal } from '../components/BudgetModal.jsx';
import { OnboardingModal } from '../components/OnboardingModal.jsx';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const DashboardPage = () => {
  const { user } = useAuth();
  // Current month in YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedDate, setSelectedDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [monthExpenses, setMonthExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { error: toastError, success: toastSuccess } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, expensesRes, budgetRes] = await Promise.all([
        expenseService.getExpenseSummary(selectedMonth),
        expenseService.getExpenses({ month: selectedMonth }),
        budgetService.getBudget().catch(() => ({ data: null })),
      ]);
      setSummary(summaryRes.data);
      setMonthExpenses(expensesRes.data || []);
      if (budgetRes?.data) {
        setBudget(budgetRes.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load dashboard summary.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, toastError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Check onboarding tour on user login / register
  useEffect(() => {
    if (user?.id) {
      const hasSeen = localStorage.getItem(`has_seen_onboarding_${user.id}`);
      if (!hasSeen) {
        setIsOnboardingOpen(true);
      }
    }
    const handleOpenGuide = () => setIsOnboardingOpen(true);
    window.addEventListener('open-onboarding-guide', handleOpenGuide);
    return () => window.removeEventListener('open-onboarding-guide', handleOpenGuide);
  }, [user?.id]);

  // Reset selected date if month changes
  useEffect(() => {
    if (selectedDate && !selectedDate.startsWith(selectedMonth)) {
      setSelectedDate('');
    }
  }, [selectedMonth, selectedDate]);

  const handleDeleteExpense = async (id) => {
    try {
      await expenseService.deleteExpense(id);
      toastSuccess('Expense deleted successfully.');
      fetchDashboardData();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to delete expense.');
    }
  };

  const handleShiftMonth = (offset) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + offset, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  // Filtered transactions for recent table if a date is selected in the day strip
  const displayedExpenses = useMemo(() => {
    if (selectedDate) {
      return monthExpenses.filter((e) => e.expense_date === selectedDate);
    }
    return summary?.recent_expenses || [];
  }, [selectedDate, monthExpenses, summary]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 min-w-0">
      {/* Top Banner: Greeting, Month Selector & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time breakdown of your expenditures
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Month selector with prev/next buttons */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              onClick={() => handleShiftMonth(-1)}
              title="Previous Month"
              className="p-1.5 sm:p-2 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-2 py-1 space-x-1.5 border-x border-slate-100">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-hidden cursor-pointer"
              />
            </div>
            <button
              onClick={() => handleShiftMonth(1)}
              title="Next Month"
              className="p-1.5 sm:p-2 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchDashboardData}
            title="Refresh data"
            disabled={loading}
            className="p-2 text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Dedicated Calendar View Link */}
          <Link
            to="/calendar"
            className="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
            title="Open Calendar View"
          >
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-indigo-600" />
            Calendar
          </Link>

          {/* Quick AI Report CTA */}
          <Link
            to="/insights"
            className="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 border border-amber-200/80 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-amber-600" />
            AI Insights
          </Link>

          {/* In-App Interactive Guide / Slides CTA */}
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            title="Open Interactive Guide & Walkthrough"
            className="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-slate-500" />
            Guide
          </button>

          {/* Quick Add Expense CTA */}
          <Link
            to="/expenses/new"
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-100 transition-colors ml-auto sm:ml-0"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* Error alert if fetch failed */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Unable to load dashboard data: </span>
            {error}
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-semibold text-rose-900 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Live Runway, Budget Allocation & Safe Daily Allowance Card */}
      <BudgetPacingCard
        budget={budget}
        expenses={monthExpenses}
        selectedMonth={selectedMonth}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
      />

      {/* Stats Cards Row */}
      <DashboardStats summary={summary} loading={loading} />

      {/* Interactive Day Spending & Date Explorer Widget */}
      <DailySpendingStrip
        selectedMonth={selectedMonth}
        expenses={monthExpenses}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        loading={loading}
      />

      {/* Charts & Visual Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        <div className="lg:col-span-2 min-w-0">
          <CategoryChart data={summary?.category_breakdown || []} />
        </div>

        {/* AI Quick Callout Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-4 sm:p-6 text-white flex flex-col justify-between shadow-md relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 mb-3 sm:mb-4 border border-white/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">Need Financial Advice?</h3>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Google Gemini analyzes your {summary?.transaction_count || 0} transactions against your income & fixed obligations to protect your savings goal and keep you on budget.
            </p>
          </div>

          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-indigo-700/50">
            <Link
              to="/insights"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors shadow-sm"
            >
              Analyze {selectedMonth} with Gemini
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent / Filtered Transactions Section */}
      <div className="space-y-3 sm:space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {selectedDate ? (
                <span className="flex items-center space-x-2">
                  <span>Transactions on {selectedDateFormatted}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {displayedExpenses.length} found
                  </span>
                </span>
              ) : (
                'Recent Transactions'
              )}
            </h3>
          </div>

          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear Filter
              </button>
            )}

            <Link
              to={selectedDate ? `/expenses?date=${selectedDate}` : `/expenses?month=${selectedMonth}`}
              className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              {selectedDate ? 'View Records' : 'View all'}
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
            </Link>
          </div>
        </div>

        <ExpenseTable
          expenses={displayedExpenses}
          loading={loading}
          onDelete={handleDeleteExpense}
          showActions={true}
          limit={selectedDate ? undefined : 6}
        />
      </div>

      {/* Budget & Fixed Obligations Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudget={budget}
        onSaveSuccess={(updated) => {
          setBudget(updated);
          fetchDashboardData();
        }}
      />

      {/* Interactive In-App Onboarding & Feature Guide Carousel */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        userId={user?.id}
      />
    </div>
  );
};

export default DashboardPage;
