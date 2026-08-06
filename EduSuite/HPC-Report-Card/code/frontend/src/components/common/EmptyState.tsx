import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  message,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-navy/20 py-16 text-center">
      <div className="text-navy/30">{icon ?? <Inbox className="h-8 w-8" />}</div>
      <p className="font-medium text-navy">{title}</p>
      {message && <p className="max-w-sm text-sm text-navy/50">{message}</p>}
      {action}
    </div>
  );
}
