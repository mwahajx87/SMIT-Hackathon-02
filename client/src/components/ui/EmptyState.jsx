import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button.jsx';

export function EmptyState({ 
  icon: Icon = Inbox, 
  title = "No data found", 
  description, 
  actionLabel, 
  onAction,
  className = ""
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-[var(--surface)] rounded-xl border border-[var(--border)] my-4 transition-colors ${className}`}>
      <div className="p-3 bg-[var(--bg)] rounded-full mb-3 text-[var(--text-muted)]">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text)] mb-1 leading-6">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] max-w-sm mb-4 leading-5">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

