import React from 'react';
import { TableSkeleton } from './Skeleton.jsx';
import { EmptyState } from './EmptyState.jsx';

export function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = "No records yet",
  emptyDescription = "There are no records to display here.",
  emptyActionLabel,
  onEmptyAction,
  className = ""
}) {
  if (loading) {
    return <TableSkeleton rows={5} cols={columns.length || 4} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-[#E3E7EE] bg-white ${className}`}>
      <table className="min-w-full divide-y divide-[#E3E7EE] text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold text-[#6B7385] uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3.5">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E3E7EE] text-[#1F2A44]">
          {data.map((row, rowIdx) => (
            <tr key={row._id || rowIdx} className="hover:bg-gray-50/75 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-4 py-3.5 whitespace-nowrap">
                  {col.cell ? col.cell(row) : (row[col.accessorKey] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
