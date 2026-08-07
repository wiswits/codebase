'use client';

import { cn } from '@/utils/cn';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  className,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className={cn('w-full max-h-[90vh] overflow-y-auto', sizeClasses[size], className)}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-semibold text-navy">{title}</h3>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-auto"
          >
            <X size={20} />
          </Button>
        </div>
        <CardContent className="p-4">{children}</CardContent>
        {actions && (
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
            {actions}
          </div>
        )}
      </Card>
    </div>
  );
}