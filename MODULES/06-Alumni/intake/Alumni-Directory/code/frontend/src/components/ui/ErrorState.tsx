"use client";

import {
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message,
  onRetry
}: ErrorStateProps) {
  return (
    <div className="surface-card flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
        <AlertCircle size={23} />
      </div>

      <h3 className="mt-4 font-display text-xl font-bold text-navy">
        Unable to load data
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c3568]"
        >
          <RefreshCw size={16} />

          Try again
        </button>
      )}
    </div>
  );
}