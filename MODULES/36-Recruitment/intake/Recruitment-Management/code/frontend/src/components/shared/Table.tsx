'use client';

import { cn } from '@/utils/cn';
import { forwardRef, HTMLAttributes, ReactNode } from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  cell?: (item: T) => ReactNode;
  className?: string;
}

export interface TableProps<T = any> extends HTMLAttributes<HTMLTableElement> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: string | ((item: T) => string);
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, columns, data, rowKey, onRowClick, emptyMessage = 'No data available', ...props }, ref) => {
    const getRowKey = (item: any, index: number): string => {
      if (typeof rowKey === 'function') return rowKey(item);
      if (rowKey && item[rowKey]) return String(item[rowKey]);
      return String(index);
    };

    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn('w-full text-sm', className)}
          {...props}
        >
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-left py-3 px-3 font-medium text-gray-500',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={getRowKey(item, index)}
                  className={cn(
                    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('py-2.5 px-3', col.className)}
                    >
                      {col.cell ? col.cell(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export { Table };