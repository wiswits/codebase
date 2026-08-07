interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading..."
}: LoadingStateProps) {
  return (
    <div
      role="status"
      className="surface-card flex min-h-56 flex-col items-center justify-center gap-4 p-8"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-gold" />

      <p className="text-sm font-medium text-slate-500">
        {message}
      </p>
    </div>
  );
}