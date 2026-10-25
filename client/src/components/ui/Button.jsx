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
    primary: "bg-[#0E8F7A] text-white hover:bg-[#0B7664] focus:ring-[#0E8F7A] border border-transparent shadow-none",
    secondary: "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)] focus:ring-[var(--border)]",
    danger: "bg-[#C23B3B] text-white hover:bg-[#A83232] focus:ring-[#C23B3B] border border-transparent",
    ai: "bg-transparent text-[#5B4FCF] border border-[#5B4FCF] hover:bg-[#EFEDFB] focus:ring-[#5B4FCF]",
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

