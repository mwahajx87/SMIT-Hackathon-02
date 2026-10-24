import React from 'react';

export function Card({ children, className = '', title, subtitle, action, ...props }) {
  return (
    <div className={`bg-white rounded-xl border border-[#E3E7EE] shadow-xs p-5 ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E3E7EE]">
          <div>
            {title && <h3 className="text-base font-semibold text-[#1F2A44]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#6B7385] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
