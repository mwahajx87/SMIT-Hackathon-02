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
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-[#E3E7EE] my-4 ${className}`}>
      <div className="p-3 bg-gray-50 rounded-full mb-3 text-[#6B7385]">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-[#1F2A44] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#6B7385] max-w-sm mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
