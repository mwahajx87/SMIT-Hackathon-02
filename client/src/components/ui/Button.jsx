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
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base"
  };

  const variants = {
    primary: "bg-[#12A087] text-white hover:bg-[#0f8872] focus:ring-[#12A087]",
    secondary: "bg-white text-[#1F2A44] border border-[#E3E7EE] hover:bg-gray-50 focus:ring-[#1F2A44]",
    danger: "bg-[#D64545] text-white hover:bg-[#c23b3b] focus:ring-[#D64545]",
    accent: "bg-[#5B4FCF] text-white hover:bg-[#4d42b3] focus:ring-[#5B4FCF]",
    ghost: "bg-transparent text-[#6B7385] hover:bg-gray-100 hover:text-[#1F2A44]"
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
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
