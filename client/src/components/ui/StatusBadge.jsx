import React from 'react';

const STATUS_MAP = {
  present: { bg: 'bg-[#E6F4EC]', text: 'text-[#1E8E4F]', border: 'border-[#1E8E4F]/20', label: 'Present' },
  late: { bg: 'bg-[#FFF3DC]', text: 'text-[#B76E00]', border: 'border-[#B76E00]/20', label: 'Late' },
  half_day: { bg: 'bg-[#FFF3DC]', text: 'text-[#B76E00]', border: 'border-[#B76E00]/20', label: 'Half day' },
  absent: { bg: 'bg-[#FBE9E9]', text: 'text-[#C23B3B]', border: 'border-[#C23B3B]/20', label: 'Absent' },
  on_leave: { bg: 'bg-[#E8F0FA]', text: 'text-[#2563A8]', border: 'border-[#2563A8]/20', label: 'On leave' },
  missing_checkout: { bg: 'bg-[#FFF3DC]', text: 'text-[#B76E00]', border: 'border-dashed border-[#B76E00]', label: 'Missing check-out' },
  not_checked_in: { bg: 'bg-[var(--bg)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', label: 'Not checked in' },
  pending: { bg: 'bg-[#FFF3DC]', text: 'text-[#B76E00]', border: 'border-[#B76E00]/20', label: 'Pending' },
  approved: { bg: 'bg-[#E6F4EC]', text: 'text-[#1E8E4F]', border: 'border-[#1E8E4F]/20', label: 'Approved' },
  rejected: { bg: 'bg-[#FBE9E9]', text: 'text-[#C23B3B]', border: 'border-[#C23B3B]/20', label: 'Rejected' },
  cancelled: { bg: 'bg-[var(--bg)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', label: 'Cancelled' },
  draft: { bg: 'bg-[var(--bg)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', label: 'Draft' },
  finalized: { bg: 'bg-[#E8F0FA]', text: 'text-[#2563A8]', border: 'border-[#2563A8]/20', label: 'Finalized 🔒' },
  active: { bg: 'bg-[#E6F4EC]', text: 'text-[#1E8E4F]', border: 'border-[#1E8E4F]/20', label: 'Active' },
  probation: { bg: 'bg-[#E8F0FA]', text: 'text-[#2563A8]', border: 'border-[#2563A8]/20', label: 'Probation' },
  exited: { bg: 'bg-[var(--bg)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', label: 'Exited' },
  inactive: { bg: 'bg-[#FBE9E9]', text: 'text-[#C23B3B]', border: 'border-[#C23B3B]/20', label: 'Inactive' }
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

