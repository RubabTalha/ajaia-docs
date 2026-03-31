import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'owner';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-surface-100 text-surface-600',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-brand-50 text-brand-700 border border-brand-200',
    owner: 'bg-brand-100 text-brand-800 border border-brand-300',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};