import React from 'react';

export function Card({ children, className = '', title, subtitle, action, ...props }) {
  return (
    <div className={`bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 transition-colors ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--border)]">
          <div>
            {title && <h3 className="text-base font-semibold text-[var(--text)] leading-6">{title}</h3>}
            {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-4">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

