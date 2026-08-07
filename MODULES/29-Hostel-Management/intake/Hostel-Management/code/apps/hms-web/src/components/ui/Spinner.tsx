import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizes = {
    xs: 'h-3 w-3 border-2',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-3',
    lg: 'h-8 w-8 border-4',
    xl: 'h-12 w-12 border-4',
  };

  const colors = {
    primary: 'border-apex-gold border-t-apex-navy',
    secondary: 'border-apex-ivory border-t-apex-gold',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-300 border-t-gray-600',
  };

  return (
    <div
      className={twMerge(clsx(
        'animate-spin rounded-full',
        sizes[size],
        colors[color],
        className
      ))}
    />
  );
};

// Full page spinner
export const PageSpinner: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Spinner size="xl" />
      {message && (
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
};