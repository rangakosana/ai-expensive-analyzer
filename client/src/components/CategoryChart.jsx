import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Inbox } from 'lucide-react';

const CATEGORY_COLORS = {
  'Housing': '#6366f1', // Indigo
  'Transportation': '#0ea5e9', // Sky
  'Food & Dining': '#10b981', // Emerald
  'Utilities': '#f59e0b', // Amber
  'Entertainment': '#ec4899', // Pink
  'Healthcare': '#ef4444', // Red
  'Shopping': '#8b5cf6', // Purple
  'Personal Care': '#14b8a6', // Teal
  'Miscellaneous': '#64748b', // Slate
};

const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b'];

export const CategoryChart = ({ data = [] }) => {
  const [chartType, setChartType] = useState('pie'); // 'pie' | 'bar'

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-700">No Category Data</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Add expenses for this month to visualize your category spending distribution.
        </p>
      </div>
    );
  }

  // Format data for charts
  const chartData = data.map((item, idx) => ({
    name: item.category,
    value: Number(item.total_spent),
    percentage: item.percentage,
    count: item.count,
    color: CATEGORY_COLORS[item.category] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700">
          <div className="font-semibold flex items-center space-x-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            ></span>
            <span>{item.name}</span>
          </div>
          <div className="text-slate-200 font-medium">
            Amount: <span className="text-emerald-400">₹{item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {item.percentage !== undefined && (
            <div className="text-slate-400">Share: {item.percentage}%</div>
          )}
          <div className="text-slate-400">Transactions: {item.count}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Spending by Category</h3>
          <p className="text-xs text-slate-500">Distribution of expenditures this month</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg space-x-1">
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              chartType === 'pie'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Pie chart view"
          >
            <PieIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              chartType === 'bar'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Bar chart view"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(val) => <span className="text-xs text-slate-600">{val}</span>}
              />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryChart;
