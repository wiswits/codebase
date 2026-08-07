import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
  className?: string;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    styles: 'bg-green-50 border-green-200 text-green-800',
    iconStyles: 'text-green-600',
  },
  error: {
    icon: XCircle,
    styles: 'bg-red-50 border-red-200 text-red-800',
    iconStyles: 'text-red-600',
  },
  warning: {
    icon: AlertCircle,
    styles: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconStyles: 'text-yellow-600',
  },
  info: {
    icon: Info,
    styles: 'bg-blue-50 border-blue-200 text-blue-800',
    iconStyles: 'text-blue-600',
  },
};

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={twMerge(clsx(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300',
        config.styles,
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      ))}
      role="alert"
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', config.iconStyles)} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Toast Container
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    message: string;
  }>;
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  removeToast,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};