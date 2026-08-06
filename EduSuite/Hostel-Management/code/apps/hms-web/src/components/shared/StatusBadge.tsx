import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle, XCircle, Clock, AlertCircle, MinusCircle } from 'lucide-react';

export type StatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'pending' 
  | 'inactive'
  | 'active'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; icon: React.ReactNode; defaultLabel: string }> = {
  success: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle size={12} />,
    defaultLabel: 'Success',
  },
  error: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle size={12} />,
    defaultLabel: 'Error',
  },
  warning: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertCircle size={12} />,
    defaultLabel: 'Warning',
  },
  info: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <AlertCircle size={12} />,
    defaultLabel: 'Info',
  },
  pending: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Clock size={12} />,
    defaultLabel: 'Pending',
  },
  inactive: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <MinusCircle size={12} />,
    defaultLabel: 'Inactive',
  },
  active: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle size={12} />,
    defaultLabel: 'Active',
  },
  approved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle size={12} />,
    defaultLabel: 'Approved',
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle size={12} />,
    defaultLabel: 'Rejected',
  },
  completed: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <CheckCircle size={12} />,
    defaultLabel: 'Completed',
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <XCircle size={12} />,
    defaultLabel: 'Cancelled',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status as StatusType] || {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <MinusCircle size={12} />,
    defaultLabel: String(status),
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  return (
    <span
      className={twMerge(clsx(
        'inline-flex items-center rounded-full border font-medium',
        config.color,
        sizes[size],
        className
      ))}
    >
      {showIcon && config.icon}
      {label || config.defaultLabel}
    </span>
  );
};

// Composition helpers
export const StatusBadgeGroup: React.FC<{
  items: Array<{ status: StatusType; label?: string }>;
  size?: StatusBadgeProps['size'];
}> = ({ items, size }) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <StatusBadge
          key={index}
          status={item.status}
          label={item.label}
          size={size}
        />
      ))}
    </div>
  );
};