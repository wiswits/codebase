import React from 'react';
import { cn } from '@/lib/utils/cn';
import { WorkflowStatus } from '@/lib/types';
import { STATUS_STYLES } from '@/lib/utils/constants';
import { statusLabel } from '@/lib/utils/formatters';

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkflowStatus | null | undefined }) {
  const style = status ? STATUS_STYLES[status] : 'bg-slate-300 text-white border-transparent';
  return <Badge className={style}>{statusLabel(status)}</Badge>;
}
