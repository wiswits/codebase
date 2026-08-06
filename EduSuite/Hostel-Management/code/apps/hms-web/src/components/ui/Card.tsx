import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  clickable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className,
  onClick,
  ...props
}) => {
  const baseStyles = 'rounded-xl bg-white transition-all duration-200';
  
  const variants = {
    default: 'border border-gray-200 shadow-sm',
    outline: 'border-2 border-apex-gold',
    elevated: 'shadow-lg hover:shadow-xl',
    flat: 'border-0 shadow-none',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const hoverEffects = hoverable || clickable
    ? 'hover:shadow-md hover:border-apex-gold cursor-pointer'
    : '';

  return (
    <div
      className={twMerge(clsx(
        baseStyles,
        variants[variant],
        paddings[padding],
        hoverEffects,
        className
      ))}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};