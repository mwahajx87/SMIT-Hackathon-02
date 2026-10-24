import React from 'react';

export function FormField({ 
  label, 
  error, 
  helperText, 
  id, 
  required = false, 
  children, 
  className = '' 
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[#1F2A44]">
          {label} {required && <span className="text-[#D64545]">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-[#D64545] font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-[#6B7385]">{helperText}</p>
      )}
    </div>
  );
}
