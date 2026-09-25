import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-indigo-600 animate-spin`} />
      {text && <p className="text-sm font-medium text-slate-500">{text}</p>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="w-full animate-pulse space-y-3 p-4">
      <div className="h-8 bg-slate-200 rounded w-full mb-4"></div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded w-full"></div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      <div className="h-8 bg-slate-200 rounded w-2/3"></div>
      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
    </div>
  );
};

export default LoadingSpinner;
