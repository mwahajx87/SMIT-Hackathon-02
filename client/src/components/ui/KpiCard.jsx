import React from 'react';

export function KpiCard({ title, value, hint, loading = false, className = '' }) {
  if (loading) {
    return (
      <div className={`bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 animate-pulse ${className}`}>
        <div className="h-4 bg-[var(--bg)] rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-[var(--bg)] rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-[var(--bg)] rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className={`bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between transition-colors ${className}`}>
      <span className="text-xs font-normal text-[var(--text-muted)] leading-4">{title}</span>
      <div className="my-2.5">
        <span className="text-[28px] leading-[36px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
          {value}
        </span>
      </div>
      {hint ? (
        <span className="text-xs text-[var(--text-muted)] leading-4">{hint}</span>
      ) : (
        <span className="text-xs text-transparent select-none leading-4">-</span>
      )}
    </div>
  );
}

