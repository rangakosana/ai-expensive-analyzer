import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Calendar,
  History,
  Loader2,
  AlertCircle,
  TrendingUp,
  Inbox,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { insightService, budgetService } from '../services/api.js';
import { InsightCard } from '../components/InsightCard.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';
import { BudgetModal } from '../components/BudgetModal.jsx';
import { GeminiChatModal } from '../components/GeminiChatModal.jsx';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const InsightsPage = () => {
  const { user } = useAuth();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [pastReports, setPastReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [budget, setBudget] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { success, error: toastError } = useToast();

  // Load past reports
  const fetchReports = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [reportsRes, budgetRes] = await Promise.all([
        insightService.getInsights(),
        budgetService.getBudget().catch(() => ({ data: null })),
      ]);
      setPastReports(reportsRes.data);
      if (budgetRes?.data) setBudget(budgetRes.data);

      // Default active report to the currently selected month if available, or first report
      const matching = reportsRes.data.find((r) => r.report_month === selectedMonth);
      if (matching) {
        setActiveReport(matching);
      } else if (reportsRes.data.length > 0) {
        setActiveReport(reportsRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to load past insights:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Generate new report
  const handleGenerateReport = async () => {
    setErrorMsg('');
    setGenerating(true);
    try {
      const response = await insightService.generateInsight(selectedMonth);
      const newReport = response.data;
      setActiveReport(newReport);

      // Update past reports list
      setPastReports((prev) => {
        const filtered = prev.filter((r) => r.report_month !== selectedMonth);
        return [newReport, ...filtered];
      });

      success(`AI Financial report for ${selectedMonth} generated successfully!`);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Failed to generate AI insights. Please ensure expenses exist for this month and try again.';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleShiftMonth = (offset) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + offset, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
    const existing = pastReports.find((r) => r.report_month === newMonth);
    setActiveReport(existing || null);
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 animate-pulse" />
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Financial Advisor
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monthly reports powered by Google Gemini to identify waste and receive tips
          </p>
        </div>

        {/* Trigger form */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  const existing = pastReports.find((r) => r.report_month === e.target.value);
                  setActiveReport(existing || null);
                }}
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

          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            title="Chat with Gemini"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Chat
          </button>

          <button
            type="button"
            onClick={() => setIsBudgetModalOpen(true)}
            className="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Adjust Budget & Fixed Bills"
          >
            <Settings className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Budget Settings
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="inline-flex items-center justify-center px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-xs shadow-indigo-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed ml-auto sm:ml-0"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-amber-300" />
                Analyzing...
              </>
            ) : (
              <>
                {activeReport && activeReport.report_month === selectedMonth ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                    Re-analyze
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                    Analyze
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Analysis Failed</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Active Generating Banner */}
      {generating && (
        <div className="p-8 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-center animate-pulse space-y-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            Consulting Google Gemini Financial Advisor...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aggregating all expenses for {selectedMonth}, calculating category distributions, detecting micro-waste, and synthesizing 3 tailored tips.
          </p>
        </div>
      )}

      {/* Active Report View */}
      {activeReport && !generating && (
        <div className="space-y-4">
          <InsightCard
            insight={activeReport}
            onRegenerate={handleGenerateReport}
            isGenerating={generating}
            onOpenChat={() => setIsChatOpen(true)}
          />
        </div>
      )}

      {/* Empty State when no report is available */}
      {!activeReport && !generating && !loadingHistory && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-inner">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No AI Reports Generated Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 max-w-md mx-auto">
            Select a month with recorded expenses and click "Analyze {selectedMonth}" above to generate your first financial health report.
          </p>
          <button
            onClick={handleGenerateReport}
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
            Generate Report Now
          </button>
        </div>
      )}

      {/* Past Reports History Drawer / Section */}
      <div className="pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Generated Reports History</h3>
          </div>
          <span className="text-xs text-slate-500">
            {pastReports.length} report{pastReports.length === 1 ? '' : 's'} archived in database
          </span>
        </div>

        {loadingHistory ? (
          <LoadingSpinner size="md" text="Loading report history..." />
        ) : pastReports.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No past reports saved in database.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastReports.map((report) => {
              const isActive = activeReport?.id === report.id;
              const formattedDate = new Date(`${report.report_month}-01T00:00:00`).toLocaleDateString(
                'en-US',
                { month: 'long', year: 'numeric' }
              );

              return (
                <div
                  key={report.id}
                  onClick={() => setActiveReport(report)}
                  className={`p-5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900">{formattedDate}</span>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                      {report.report_month}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">
                    Total Analyzed:{' '}
                    <strong className="text-slate-800 font-semibold">
                      ₹{Number(
                        report.insight_data?.total_analyzed_amount || 0
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </p>

                  <div className="flex items-center justify-between text-xs text-indigo-600 font-semibold pt-2 border-t border-slate-100">
                    <span>{isActive ? 'Currently Viewing' : 'Click to View'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget & Fixed Obligations Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudget={budget}
        onSaveSuccess={(updated) => {
          setBudget(updated);
          handleGenerateReport();
        }}
      />

      {/* Interactive Google Gemini Chat Modal */}
      <GeminiChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        month={selectedMonth}
      />
    </div>
  );
};

export default InsightsPage;
