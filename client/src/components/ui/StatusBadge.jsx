import React from 'react';

const STATUS_MAP = {
  present: { bg: 'bg-[var(--success-soft)]', text: 'text-[var(--success)]', border: 'border-[var(--success)]/20', label: 'Present' },
  late: { bg: 'bg-[var(--warning-soft)]', text: 'text-[var(--warning)]', border: 'border-[var(--warning)]/20', label: 'Late' },
  half_day: { bg: 'bg-[var(--warning-soft)]', text: 'text-[var(--warning)]', border: 'border-[var(--warning)]/20', label: 'Half day' },
  absent: { bg: 'bg-[var(--danger-soft)]', text: 'text-[var(--danger)]', border: 'border-[var(--danger)]/20', label: 'Absent' },
  on_leave: { bg: 'bg-[var(--info-soft)]', text: 'text-[var(--info)]', border: 'border-[var(--info)]/20', label: 'On leave' },
  missing_checkout: { bg: 'bg-[var(--warning-soft)]', text: 'text-[var(--warning)]', border: 'border-dashed border-[var(--warning)]', label: 'Missing check-out' },
  not_checked_in: { bg: 'bg-[var(--bg)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', label: 'Not checked in' },
  pending: { bg: 'bg-[var(--warning-soft)]', text: 'text-[var(--warning)]', border: 'border-[var(--warning)]/20', label: 'Pending' },
  approved: { bg: 'bg-[var(--success-soft)]', text: 'text-[var(--success)]', border: 'border-[var(--success)]/20', label: 'Approved' },
  rejected: { bg: 'bg-[var(--danger-soft)]', text: 'text-[var(--danger)]', border: 'border-[var(--danger)]/20', label: 'Rejected' },
  cancelled: { bg: 'bg-[var(--bg)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', label: 'Cancelled' },
  draft: { bg: 'bg-[var(--bg)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', label: 'Draft' },
  finalized: { bg: 'bg-[var(--info-soft)]', text: 'text-[var(--info)]', border: 'border-[var(--info)]/20', label: 'Finalized 🔒' },
  active: { bg: 'bg-[var(--success-soft)]', text: 'text-[var(--success)]', border: 'border-[var(--success)]/20', label: 'Active' },
  probation: { bg: 'bg-[var(--info-soft)]', text: 'text-[var(--info)]', border: 'border-[var(--info)]/20', label: 'Probation' },
  exited: { bg: 'bg-[var(--bg)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', label: 'Exited' },
  inactive: { bg: 'bg-[var(--danger-soft)]', text: 'text-[var(--danger)]', border: 'border-[var(--danger)]/20', label: 'Inactive' }
};

export function StatusBadge({ status, label: customLabel, className = '' }) {
  const config = STATUS_MAP[status] || {
    bg: 'bg-[var(--bg)]',
    text: 'text-[var(--text-muted)]',
    border: 'border-[var(--border)]',
    label: status
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tabular-nums ${config.bg} ${config.text} ${config.border} ${className}`}>
      {customLabel || config.label}
    </span>
  );
}

