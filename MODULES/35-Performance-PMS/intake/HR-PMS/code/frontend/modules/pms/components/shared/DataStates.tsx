import { Button } from "./Button";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#1F3A5F]" />
      <p className="mt-5 text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-linear-to-b from-white to-slate-50 px-8 py-16 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF3F8] text-4xl">
        📄
      </div>

      <h3 className="text-xl font-bold text-slate-800">{title}</h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <div className="mb-4 text-5xl">⚠️</div>

      <h3 className="text-lg font-bold text-red-700">
        Something went wrong
      </h3>

      <p className="mt-3 text-sm text-red-600">{message}</p>

      {onRetry && (
        <div className="mt-6">
          <Button onClick={onRetry}>Try Again</Button>
        </div>
      )}
    </div>
  );
}

export function UnauthorizedState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
      <div className="mb-4 text-5xl">🔒</div>

      <h3 className="text-xl font-bold text-amber-800">
        Access Denied
      </h3>

      <p className="mt-3 text-sm text-amber-700">
        {message}
      </p>
    </div>
  );
}
export function NotFoundState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mb-4 text-5xl">🔍</div>

      <h3 className="text-xl font-bold text-slate-800">
        Not Found
      </h3>

      <p className="mt-3 text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}