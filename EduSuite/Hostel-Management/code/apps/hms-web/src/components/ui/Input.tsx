import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = 'w-full rounded-lg border bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-apex-gold focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'border-gray-300 hover:border-gray-400',
    outline: 'border-2 border-apex-navy hover:border-apex-gold',
    filled: 'border-transparent bg-apex-ivory hover:bg-gray-100 focus:bg-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const errorStyles = error ? 'border-red-500 focus:ring-red-500 hover:border-red-500' : '';

  const iconPadding = {
    left: leftIcon ? (size === 'sm' ? 'pl-9' : size === 'md' ? 'pl-10' : 'pl-12') : '',
    right: rightIcon ? (size === 'sm' ? 'pr-9' : size === 'md' ? 'pr-10' : 'pr-12') : '',
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-0 top-0 h-full flex items-center pl-3 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(clsx(
            baseStyles,
            variants[variant],
            sizes[size],
            errorStyles,
            iconPadding.left,
            iconPadding.right,
            className
          ))}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-0 top-0 h-full flex items-center pr-3 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';