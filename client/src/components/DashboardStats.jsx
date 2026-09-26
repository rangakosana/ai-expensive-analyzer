import React from 'react';
import { IndianRupee, Tag, CreditCard, Calculator } from 'lucide-react';
import { CardSkeleton } from './LoadingSpinner.jsx';

export const DashboardStats = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const totalSpent = summary?.total_spent || 0;
  const transactionCount = summary?.transaction_count || 0;
  const topCategory = summary?.top_category || 'None';
  const averageSpent = transactionCount > 0 ? totalSpent / transactionCount : 0;

  const stats = [
    {
      label: 'Total Spending',
      value: `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      description: 'Selected month',
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: 'Top Category',
      value: topCategory,
      description: topCategory !== 'None' ? 'Highest spend' : 'No spend',
      icon: Tag,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      label: 'Transactions',
      value: transactionCount,
      description: 'Logged records',
      icon: CreditCard,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      label: 'Avg / Expense',
      value: `₹${averageSpent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      description: 'Per transaction',
      icon: Calculator,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="p-3 sm:p-5 bg-white rounded-xl shadow-2xs border border-slate-200/80 hover:shadow-xs transition-shadow duration-200 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
                  {stat.label}
                </p>
                <h3 className="text-base sm:text-2xl font-extrabold text-slate-900 mt-1 truncate">
                  {stat.value}
                </h3>
              </div>
              <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border ${stat.color} flex-shrink-0`}>
                <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-3 truncate">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
