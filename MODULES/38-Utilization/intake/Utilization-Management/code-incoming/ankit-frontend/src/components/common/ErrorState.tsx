/**
 * Error State Component
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export default function ErrorState({ message, onRetry, fullPage = false }: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="p-3 bg-red-50 rounded-full">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <p className="text-gray-600 text-center max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}