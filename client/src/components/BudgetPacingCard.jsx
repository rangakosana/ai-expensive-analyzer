import React, { useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  IndianRupee,
  Clock,
  Settings,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const BudgetPacingCard = ({
  budget,
  expenses = [],
  selectedMonth,
  onOpenBudgetModal,
}) => {
  const [yearNum, monthNum] = useMemo(() => {
    const parts = (selectedMonth || '').split('-').map(Number);
    const now = new Date();
    return [parts[0] || now.getFullYear(), parts[1] || now.getMonth() + 1];
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(yearNum, monthNum, 0).getDate();
  }, [yearNum, monthNum]);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === yearNum && now.getMonth() + 1 === monthNum;
  const currentDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  const fixedBills = Array.isArray(budget?.fixed_bills) ? budget.fixed_bills : [];

  // Categorize actual expenses into Fixed vs Flexible (Hook MUST execute unconditionally at top level)
  const { fixedSpent, flexibleSpent, flexibleExpenses } = useMemo(() => {
    const fixedKeywords = fixedBills.map((b) => (b.name || '').toLowerCase());
    const fixedCategories = ['Housing'];

    let fixSum = 0;
    let flexSum = 0;
    const flexList = [];

    expenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      const mLower = (e.merchant || '').toLowerCase();
      const isFixed =
        fixedCategories.includes(e.category) ||
        fixedKeywords.some((k) => k && mLower.includes(k));

      if (isFixed) {
        fixSum += amt;
      } else {
        flexSum += amt;
        flexList.push(e);
      }
    });

    return { fixedSpent: fixSum, flexibleSpent: flexSum, flexibleExpenses: flexList };
  }, [expenses, fixedBills]);

  // Check if budget has been configured by user
  const hasBudgetConfigured = budget && Number(budget.monthly_income) > 0;

  if (!hasBudgetConfigured) {
    return (
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-indigo-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5 max-w-xl">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                Setup Required
              </span>
              <span className="text-xs text-indigo-200">• Personalized Runway Engine</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              Configure Your Monthly Budget & Fixed Bills
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 leading-relaxed">
              Enter your monthly earnings and fixed obligations (rent, internet, utilities). Our AI calculates your Safe Daily Spending Limit and protects your savings target.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenBudgetModal}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-900/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Settings className="w-4 h-4 mr-1.5" />
          Set Up Budget Now
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </button>
      </div>
    );
  }

  const monthlyIncome = Number(budget.monthly_income);
  const savingsPercent = Number(budget?.savings_target_percentage ?? 20);
  const savingsTargetAmount = Math.round(monthlyIncome * (savingsPercent / 100));
  const fixedBillsTotal = fixedBills.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const flexibleBudgetTotal = Math.max(0, monthlyIncome - savingsTargetAmount - fixedBillsTotal);

  const flexibleRemaining = flexibleBudgetTotal - flexibleSpent;
  const safeDailyAllowance = daysRemaining > 0 ? Math.max(0, flexibleRemaining / daysRemaining) : 0;

  // Actual daily spend vs safe daily allowance
  const currentDailyBurn = currentDay > 0 ? flexibleSpent / currentDay : 0;

  let pacingStatus = 'on_track';
  if (flexibleRemaining <= 0) {
    pacingStatus = 'deficit';
  } else if (daysRemaining > 0 && currentDailyBurn > (flexibleBudgetTotal / daysInMonth) * 1.15) {
    pacingStatus = 'caution';
  }

  const flexiblePercentUsed =
    flexibleBudgetTotal > 0 ? Math.min(Math.round((flexibleSpent / flexibleBudgetTotal) * 100), 100) : 0;

  const monthProgressPercent = Math.round((currentDay / daysInMonth) * 100);

  return (
    <div className="bg-white rounded-2xl border border-indigo-100/90 shadow-2xs p-4 sm:p-6 relative overflow-hidden space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600">
                Daily Budget Tracker
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Day {currentDay} of {daysInMonth} ({daysRemaining}d left)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Monthly Budget & Safe Daily Spending
            </h3>
          </div>
        </div>

        <div className="flex items-center self-end sm:self-auto">
          <button
            type="button"
            onClick={onOpenBudgetModal}
            className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Budget Settings
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
        {/* Card 1: Safe Daily Spending Allowance (Prioritized on Mobile) */}
        <div className={`order-first md:order-3 p-4 rounded-xl border flex flex-col justify-between ${
          pacingStatus === 'deficit'
            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
            : pacingStatus === 'caution'
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Safe Daily Limit
              </span>
              <span className={`inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                pacingStatus === 'deficit'
                  ? 'bg-rose-200/80 text-rose-800'
                  : pacingStatus === 'caution'
                  ? 'bg-amber-200/80 text-amber-800'
                  : 'bg-emerald-200/80 text-emerald-800'
              }`}>
                {pacingStatus === 'deficit' ? 'Over Budget' : pacingStatus === 'caution' ? 'Spending Fast' : 'On Track'}
              </span>
            </div>

            <div className="mt-2">
              <h4 className="text-2xl sm:text-3xl font-black">
                ₹{Math.round(safeDailyAllowance).toLocaleString('en-IN')}
                <span className="text-xs font-semibold opacity-70 ml-1">/ day</span>
              </h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {daysRemaining > 0
                  ? `For the remaining ${daysRemaining} days to preserve your ₹${savingsTargetAmount.toLocaleString('en-IN')} savings.`
                  : 'Month completed.'}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-xs font-bold">
            <span>Spent: ₹{Math.round(currentDailyBurn)}/day avg</span>
            <span>Fixed bills protected</span>
          </div>
        </div>

        {/* Card 2: Flexible Runway & Burn Rate */}
        <div className="order-2 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Daily Spending So Far
            </span>
            <span className="text-xs font-bold text-slate-600">
              {flexiblePercentUsed}% spent
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{flexibleSpent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                of ₹{flexibleBudgetTotal.toLocaleString('en-IN')} budget
              </span>
            </div>

            {/* Visual dual progress bar: Month time progress vs Flexible budget spent */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mt-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  flexibleRemaining <= 0
                    ? 'bg-rose-500'
                    : flexiblePercentUsed > monthProgressPercent + 10
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(flexiblePercentUsed, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Left: <strong className={flexibleRemaining >= 0 ? 'text-emerald-700' : 'text-rose-700'}>₹{Math.max(0, flexibleRemaining).toLocaleString('en-IN')}</strong></span>
            <span>Month Passed: <strong>{monthProgressPercent}%</strong></span>
          </div>
        </div>

        {/* Card 3: 3-Tier Budget Allocation */}
        <div className="order-3 md:order-1 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Budget Allocation
            </span>
            <span className="text-xs font-black text-slate-900">
              ₹{monthlyIncome.toLocaleString('en-IN')} Income
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
              <span className="text-slate-600 flex items-center">
                <Lock className="w-3 h-3 text-slate-400 mr-1.5 flex-shrink-0" />
                Fixed Bills:
              </span>
              <span className="font-bold text-slate-800">
                ₹{fixedBillsTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
              <span className="text-slate-600 flex items-center">
                <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1.5 flex-shrink-0" />
                Savings ({savingsPercent}%):
              </span>
              <span className="font-bold text-emerald-600">
                ₹{savingsTargetAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 border border-indigo-200/70">
              <span className="text-indigo-900 font-semibold">
                Daily Budget:
              </span>
              <span className="font-black text-indigo-700">
                ₹{flexibleBudgetTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPacingCard;
