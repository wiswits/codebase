import { cn } from '@/utils/cn';
import { Loader2, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface DataStatesProps {
  isLoading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  children: React.ReactNode;
  onRetry?: () => void;
}

export function DataStates({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'No data found',
  loadingMessage = 'Loading...',
  errorMessage = 'Failed to load data',
  children,
  onRetry,
}: DataStatesProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="mt-4 text-gray-500">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-red-500">{errorMessage}</p>
        <p className="text-sm text-gray-500">{error.message}</p>
        {onRetry && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-gray-400" />
        <p className="mt-4 text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}