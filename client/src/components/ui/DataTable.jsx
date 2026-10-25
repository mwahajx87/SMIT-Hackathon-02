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
    <div className={`overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors ${className}`}>
      <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
        <thead className="bg-[var(--bg)] text-xs font-medium text-[var(--text-muted)]">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`px-4 py-3 font-medium text-[var(--text-muted)] ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
          {data.map((row, rowIdx) => (
            <tr key={row._id || rowIdx} className="h-12 hover:bg-[var(--bg)] transition-colors">
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx} 
                  className={`px-4 py-3 whitespace-nowrap text-sm text-[var(--text)] ${
                    col.align === 'right' || typeof row[col.accessorKey] === 'number' ? 'text-right tabular-nums' : 'text-left'
                  }`}
                >
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

