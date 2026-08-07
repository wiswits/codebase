/**
 * Recent Payroll Runs Component
 */

import React from 'react';
import { Calendar, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from '../../utils/payrollFormatters';
import { PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS } from '../../constants/payroll.constants';

export default function RecentRuns({ runs, isLoading = false, onViewRun }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payroll Runs</h3>
        <p className="text-gray-500 text-sm">No payroll runs found</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Payroll Runs</h3>
        <span className="text-sm text-gray-500">Latest runs</span>
      </div>
      <div className="divide-y divide-gray-200">
        {runs.map((run) => (
          <div key={run.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{run.runReference}</p>
                  <p className="text-xs text-gray-500">Period: {run.payrollPeriod}</p>
                  <p className="text-xs text-gray-500">
                    Employees: {run.employeeCount} | Total: {formatCurrency(run.finalTotal)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(run.status, PAYROLL_STATUS_COLORS)}`}>
                  {getStatusIcon(run.status)}
                  <span className="ml-1">{getStatusLabel(run.status, PAYROLL_STATUS_LABELS)}</span>
                </span>
                <button
                  onClick={() => onViewRun?.(run.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-400">
              Executed: {run.executedAt ? formatDateTime(run.executedAt) : 'Not executed'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}