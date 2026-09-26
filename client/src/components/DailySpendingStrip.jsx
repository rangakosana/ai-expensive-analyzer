import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  PlusCircle,
  Tag,
  Receipt,
  X,
  ArrowRight,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

export const DailySpendingStrip = ({
  selectedMonth,
  expenses = [],
  selectedDate,
  onSelectDate,
  loading = false,
}) => {
  const [yearNum, monthNum] = useMemo(() => {
    const parts = (selectedMonth || '').split('-').map(Number);
    return [parts[0] || new Date().getFullYear(), parts[1] || new Date().getMonth() + 1];
  }, [selectedMonth]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

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

  // Generate all days in selected month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(yearNum, monthNum, 0).getDate();
    const days = [];

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dt = new Date(yearNum, monthNum - 1, day);
      const weekday = WEEKDAY_NAMES[dt.getDay()];
      const dayExpenses = expensesByDate[dateStr] || [];
      const totalAmount = dayExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

      days.push({
        dayNum: day,
        dateStr,
        weekday,
        isToday: dateStr === todayStr,
        expenses: dayExpenses,
        totalAmount,
        hasExpenses: dayExpenses.length > 0,
      });
    }

    return days;
  }, [yearNum, monthNum, expensesByDate, todayStr]);

  // Selected date details
  const activeDayData = useMemo(() => {
    if (!selectedDate) return null;
    const items = expensesByDate[selectedDate] || [];
    const total = items.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const [y, m, d] = selectedDate.split('-').map(Number);
    const formatted = new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return {
      dateStr: selectedDate,
      formatted,
      items,
      total,
    };
  }, [selectedDate, expensesByDate]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5 space-y-3 sm:space-y-4 min-w-0">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <h3 className="text-sm sm:text-lg font-bold text-slate-900">
              Daily Spending & Date Explorer
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Tap any day to inspect transactions
          </p>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {selectedDate && (
            <button
              type="button"
              onClick={() => onSelectDate('')}
              className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reset
            </button>
          )}

          <Link
            to="/calendar"
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70 transition-colors"
          >
            Calendar
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* Horizontal Day Strip */}
      <div className="relative min-w-0">
        <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-2 pt-1 no-scrollbar sm:scrollbar-thin">
          {daysInMonth.map((day) => {
            const isSelected = selectedDate === day.dateStr;

            return (
              <button
                key={day.dayNum}
                type="button"
                onClick={() => onSelectDate(isSelected ? '' : day.dateStr)}
                className={`flex-shrink-0 w-13 sm:w-18 py-1.5 sm:py-2.5 px-1 sm:px-1.5 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-102'
                    : day.isToday
                    ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 hover:bg-indigo-100'
                    : day.hasExpenses
                    ? 'bg-emerald-50/50 border-emerald-200/80 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50'
                    : 'bg-slate-50/50 border-slate-200/70 text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? 'text-indigo-100' : 'text-slate-400'
                  }`}
                >
                  {day.weekday}
                </div>
                <div
                  className={`text-sm sm:text-lg font-black leading-tight my-0.5 ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {day.dayNum}
                </div>
                {day.hasExpenses ? (
                  <div
                    className={`text-[9px] sm:text-[10px] font-bold truncate px-0.5 sm:px-1 rounded-sm ${
                      isSelected
                        ? 'bg-indigo-700/80 text-indigo-50'
                        : 'bg-emerald-100/80 text-emerald-800'
                    }`}
                  >
                    ₹{day.totalAmount >= 1000 ? `${(day.totalAmount / 1000).toFixed(1)}k` : Math.round(day.totalAmount)}
                  </div>
                ) : (
                  <div
                    className={`text-[9px] sm:text-[10px] ${
                      isSelected ? 'text-indigo-200' : 'text-slate-300'
                    }`}
                  >
                    —
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      {activeDayData && (
        <div className="mt-3 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Viewing Transactions For
              </span>
              <h4 className="text-base font-bold text-slate-900">
                {activeDayData.formatted}
              </h4>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Day Total: </span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{activeDayData.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <Link
                to={`/expenses/new?date=${activeDayData.dateStr}`}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add on this Date
              </Link>
            </div>
          </div>

          {activeDayData.items.length === 0 ? (
            <div className="py-4 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No transactions recorded on {activeDayData.formatted}. Zero expenses!</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {activeDayData.items.map((item) => {
                const badge = CATEGORY_COLORS[item.category] || 'bg-slate-100 text-slate-700';
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between space-x-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-sm border ${badge}`}>
                        {item.category}
                      </span>
                      <p className="text-xs font-bold text-slate-800 truncate mt-1">
                        {item.merchant}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-slate-400 truncate">{item.notes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-slate-900">
                        ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailySpendingStrip;
