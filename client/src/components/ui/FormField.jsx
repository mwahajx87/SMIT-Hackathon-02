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
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text)]">
          {label} {required && <span className="text-[var(--text-muted)] font-normal text-xs">(required)</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-[var(--danger)] font-normal mt-1">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-[var(--text-muted)] font-normal mt-1">{helperText}</p>
      )}
    </div>
  );
}

