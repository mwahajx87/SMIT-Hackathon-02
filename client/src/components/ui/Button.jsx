import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false, 
  loading = false,
  ...props 
}) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base"
  };

  const variants = {
    primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)] border border-transparent shadow-none",
    secondary: "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)] focus:ring-[var(--border)]",
    outline: "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)] focus:ring-[var(--border)]",
    danger: "bg-[var(--danger)] text-white hover:opacity-90 focus:ring-[var(--danger)] border border-transparent",
    ai: "bg-transparent text-[var(--ai)] border border-[var(--ai)] hover:bg-[var(--ai-soft)] focus:ring-[var(--ai)]",
    ghost: "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] border border-transparent"
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      ) : null}
      {children}
    </button>
  );
}

