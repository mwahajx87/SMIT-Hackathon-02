import React from 'react';

const STATUS_MAP = {
  present: { bg: 'bg-[#2E9E5B]/10', text: 'text-[#2E9E5B]', border: 'border-[#2E9E5B]/20', label: 'Present' },
  late: { bg: 'bg-[#E9962B]/10', text: 'text-[#E9962B]', border: 'border-[#E9962B]/20', label: 'Late' },
  half_day: { bg: 'bg-transparent', text: 'text-[#E9962B]', border: 'border-[#E9962B]', label: 'Half day' },
  absent: { bg: 'bg-[#D64545]/10', text: 'text-[#D64545]', border: 'border-[#D64545]/20', label: 'Absent' },
  on_leave: { bg: 'bg-[#5B4FCF]/10', text: 'text-[#5B4FCF]', border: 'border-[#5B4FCF]/20', label: 'On leave' },
  missing_checkout: { bg: 'bg-transparent', text: 'text-[#E9962B]', border: 'border-dashed border-[#E9962B]', label: 'Missing check-out' },
  pending: { bg: 'bg-[#E9962B]/10', text: 'text-[#E9962B]', border: 'border-[#E9962B]/20', label: 'Pending' },
  approved: { bg: 'bg-[#2E9E5B]/10', text: 'text-[#2E9E5B]', border: 'border-[#2E9E5B]/20', label: 'Approved' },
  rejected: { bg: 'bg-[#D64545]/10', text: 'text-[#D64545]', border: 'border-[#D64545]/20', label: 'Rejected' },
  draft: { bg: 'bg-gray-100', text: 'text-[#6B7385]', border: 'border-gray-200', label: 'Draft' },
  finalized: { bg: 'bg-[#1F2A44]/10', text: 'text-[#1F2A44]', border: 'border-[#1F2A44]/20', label: 'Finalized 🔒' },
  active: { bg: 'bg-[#2E9E5B]/10', text: 'text-[#2E9E5B]', border: 'border-[#2E9E5B]/20', label: 'Active' },
  probation: { bg: 'bg-[#E9962B]/10', text: 'text-[#E9962B]', border: 'border-[#E9962B]/20', label: 'Probation' },
  exited: { bg: 'bg-gray-100', text: 'text-[#6B7385]', border: 'border-gray-200', label: 'Exited' },
  inactive: { bg: 'bg-[#D64545]/10', text: 'text-[#D64545]', border: 'border-[#D64545]/20', label: 'Inactive' }
};

export function StatusBadge({ status, label: customLabel, className = '' }) {
  const config = STATUS_MAP[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    label: status
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {customLabel || config.label}
    </span>
  );
}
