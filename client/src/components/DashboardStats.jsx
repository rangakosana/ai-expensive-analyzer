import React from 'react';
import { IndianRupee, Tag, CreditCard, Calculator } from 'lucide-react';
import { CardSkeleton } from './LoadingSpinner.jsx';

export const DashboardStats = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      value: `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Total for selected month',
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: 'Top Category',
      value: topCategory,
      description: topCategory !== 'None' ? 'Highest expenditure area' : 'No spending recorded',
      icon: Tag,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      label: 'Transactions',
      value: transactionCount,
      description: 'Logged records this month',
      icon: CreditCard,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      label: 'Average / Transaction',
      value: `₹${averageSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Per recorded transaction',
      icon: Calculator,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="p-5 bg-white rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 truncate">
                  {stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl border ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
