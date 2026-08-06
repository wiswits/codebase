import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helper,
  options,
  placeholder,
  size = 'md',
  variant = 'default',
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = 'w-full rounded-lg border bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-apex-gold focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none';
  
  const variants = {
    default: 'border-gray-300 hover:border-gray-400',
    outline: 'border-2 border-apex-navy hover:border-apex-gold',
    filled: 'border-transparent bg-apex-ivory hover:bg-gray-100 focus:bg-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm pr-8',
    md: 'px-4 py-2 text-base pr-10',
    lg: 'px-5 py-3 text-lg pr-12',
  };

  const errorStyles = error ? 'border-red-500 focus:ring-red-500 hover:border-red-500' : '';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={twMerge(clsx(
            baseStyles,
            variants[variant],
            sizes[size],
            errorStyles,
            className
          ))}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-0 top-0 h-full flex items-center pr-3 pointer-events-none">
          <ChevronDown size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} className="text-gray-400" />
        </div>
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

Select.displayName = 'Select';