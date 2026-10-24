import React from 'react';

export function KpiCard({ title, value, hint, icon: Icon, loading = false, className = '' }) {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#E3E7EE] p-5 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#6B7385] tracking-wide uppercase">{title}</span>
        {Icon && <Icon className="w-5 h-5 text-[#6B7385]" />}
      </div>
      <div className="my-3">
        <span className="text-2xl font-bold text-[#1F2A44]">{value}</span>
      </div>
      {hint && <span className="text-xs text-[#6B7385]">{hint}</span>}
    </div>
  );
}
