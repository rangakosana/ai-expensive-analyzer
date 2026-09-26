import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  IndianRupee,
  TrendingUp,
  Calendar,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Lock,
  Clock,
  MessageSquare,
} from 'lucide-react';

const TIP_TITLES = [
  'What You Spent & Days Left',
  'Where to Save Money',
  'Plan for the Next Few Days',
];

const TIP_COLORS = [
  { bg: 'bg-indigo-50/70', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-800' },
  { bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-950', badge: 'bg-amber-100 text-amber-900' },
  { bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-950', badge: 'bg-emerald-100 text-emerald-900' },
];

export const InsightCard = ({ insight, month, onRegenerate, isGenerating, onOpenChat }) => {
  if (!insight) return null;

  const data = insight.insight_data || insight;
  const reportMonth = insight.report_month || month;

  const formattedMonth = reportMonth
    ? new Date(`${reportMonth}-01T00:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : reportMonth;

  const flex = data.flexible_analysis;

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-md overflow-hidden transition-all min-w-0">
      {/* Card Header with gradient banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-indigo-200">
                  AI Financial Advisor
                </span>
                <span className="bg-indigo-500/40 text-indigo-100 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Personalized
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                {formattedMonth} Financial Analysis
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="inline-flex items-center px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 shadow-xs transition-all cursor-pointer"
                title="Chat directly with Gemini"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-amber-300" />
                Chat
              </button>
            )}

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="inline-flex items-center px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-indigo-900 bg-amber-400 hover:bg-amber-300 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title="Re-run AI analysis"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Re-analyzing...' : 'Re-analyze'}
              </button>
            )}

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/20 sm:text-right ml-auto sm:ml-0">
              <p className="text-[10px] sm:text-xs text-indigo-200 uppercase font-medium">Total Spend</p>
              <p className="text-lg sm:text-2xl font-extrabold text-white">
                ₹{Number(data.total_analyzed_amount || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-8">
        {/* Dynamic Budget & Spending Plan Section */}
        {flex && (
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 sm:pb-3 border-b border-slate-200/70">
              <div className="flex items-center space-x-2 text-indigo-900">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Monthly Budget & Spending Plan
                </h3>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
                Day {flex.days_elapsed} elapsed • {flex.days_remaining} days left
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Monthly Income
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{flex.monthly_income.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center justify-center">
                  <Lock className="w-3 h-3 mr-1 text-slate-400" />
                  Fixed Bills
                </span>
                <span className="text-lg font-black text-slate-700">
                  ₹{flex.fixed_bills_total.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Savings Target ({flex.savings_target_percentage}%)
                </span>
                <span className="text-lg font-black text-emerald-600">
                  ₹{flex.savings_target_amount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Safe Daily Limit
                </span>
                <span className="text-lg font-black text-indigo-900">
                  ₹{Math.round(flex.safe_daily_allowance).toLocaleString('en-IN')}/day
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              💡 <strong>How it works:</strong> Your fixed bills are protected. The tips below focus strictly on your everyday spending to help you stay within your safe daily limit and hit your ₹{flex.savings_target_amount.toLocaleString('en-IN')} savings goal.
            </p>
          </div>
        )}

        {/* Section 1: Category Breakdown */}
        {data.category_breakdown && data.category_breakdown.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 text-slate-900 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold">Category Breakdown</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.category_breakdown.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-800 mb-2">
                    <span className="truncate">{cat.category}</span>
                    <span className="text-indigo-600">
                      ₹{Number(cat.total_spent).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(cat.percentage_of_total || 0, 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-medium text-slate-500">
                    {cat.percentage_of_total}% of total spend
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Spending Observations */}
        <div>
          <div className="flex items-center space-x-2 text-slate-900 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold">Spending Observations</h3>
          </div>
          {data.unnecessary_spending_identified && data.unnecessary_spending_identified.length > 0 ? (
            <div className="space-y-2.5">
              {data.unnecessary_spending_identified.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-950 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5 mr-3 font-bold text-xs">
                    !
                  </div>
                  <p className="leading-relaxed font-medium">{item}</p>
                </div>
              ))}
            </div>
          ) : flex && (flex.flexible_remaining <= 0 || flex.pacing_status === 'deficit') ? (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-sm flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Daily Spending Budget Reached</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  You have spent ₹{flex.flexible_spent_so_far} of your ₹{flex.flexible_budget_total} everyday budget (100%+ used). Your ₹{flex.savings_target_amount} savings are still intact, but any extra purchases from now on will cut into your savings.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Your everyday spending is in healthy control!</span>
            </div>
          )}
        </div>

        {/* Section 3: Actionable Financial Tips (Strictly 3 Tips) */}
        <div>
          <div className="flex items-center space-x-2 text-slate-900 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold">Action Plan for the Rest of the Month</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.actionable_tips &&
              data.actionable_tips.map((tip, idx) => {
                const style = TIP_COLORS[idx] || TIP_COLORS[0];
                const title = TIP_TITLES[idx] || `Recommendation #${idx + 1}`;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col justify-between p-5 rounded-2xl border shadow-xs relative overflow-hidden ${style.bg} ${style.border}`}
                  >
                    <div>
                      <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider mb-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${style.badge}`}>
                          {idx + 1}
                        </span>
                        <span className={style.text}>{title}</span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        {tip}
                      </p>
                    </div>

                    <div className="pt-3 mt-4 border-t border-black/5 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Step #{idx + 1}</span>
                      <span className="text-indigo-600">Smart Tip</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {onOpenChat && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-amber-50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center">
                    Have more questions or want custom tips?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chat directly with Google Gemini. It has full real-time access to your expenses and budget.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenChat}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer flex-shrink-0"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Ask Gemini a Question
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        {insight.created_at && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Generated on {new Date(insight.created_at).toLocaleDateString()} at{' '}
              {new Date(insight.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="italic">Tailored to your custom budget & fixed obligations</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightCard;
