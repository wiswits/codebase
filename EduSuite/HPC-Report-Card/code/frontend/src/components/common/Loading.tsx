import React from 'react';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-navy/60">
      <span className="h-6 w-6 rounded-full border-2 border-navy/20 border-t-navy animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
