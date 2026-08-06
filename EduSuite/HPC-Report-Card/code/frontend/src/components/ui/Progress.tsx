import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function Progress({ value, max = 100, className, showLabel = false }: ProgressProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className={cn('h-2 flex-1 rounded-full bg-navy/10 overflow-hidden', className)}>
        <div
          className="h-full rounded-full bg-gold transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-navy tabular-nums w-10 text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
