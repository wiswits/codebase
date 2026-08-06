import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  variant = 'default',
  size = 'md',
}: TableProps<T>) {
  const getSortIcon = (key: string) => {
    if (sortBy !== key) {
      return <ChevronsUpDown size={14} className="inline ml-1" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp size={14} className="inline ml-1" />
      : <ChevronDown size={14} className="inline ml-1" />;
  };

  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  const variantStyles = {
    default: '',
    striped: '[&_tr:nth-child(even)]:bg-apex-ivory',
    bordered: 'border border-gray-200 [&_td]:border [&_th]:border',
  };

  const sizeStyles = {
    sm: '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 text-sm',
    md: '[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3',
    lg: '[&_td]:px-6 [&_td]:py-4 [&_th]:px-6 [&_th]:py-4 text-lg',
  };

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={twMerge(clsx(
        'w-full',
        variantStyles[variant],
        sizeStyles[size]
      ))}>
        <thead>
          <tr className="border-b border-gray-200 bg-apex-ivory">
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  'font-semibold text-gray-700',
                  column.sortable ? 'cursor-pointer hover:text-apex-navy' : '',
                  alignStyles[column.align || 'left']
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                {column.header}
                {column.sortable && getSortIcon(column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={clsx(
                'border-b border-gray-100 hover:bg-apex-ivory transition-colors',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(alignStyles[column.align || 'left'])}
                >
                  {column.accessor ? column.accessor(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}