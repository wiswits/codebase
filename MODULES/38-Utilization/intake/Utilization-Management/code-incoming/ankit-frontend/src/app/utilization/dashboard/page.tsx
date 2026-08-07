/**
 * Utilization Dashboard Page
 */

'use client';

import React from 'react';
import { useDashboard } from '../../../hooks/useDashboard';
import LoadingState from '../../../components/common/LoadingState';
import ErrorState from '../../../components/common/ErrorState';
import PageHeader from '../../../components/common/PageHeader';
import DashboardSummary from '../../../components/dashboard/DashboardSummary';

export default function UtilizationDashboardPage() {
  const { loading, error, data, refresh, clearError } = useDashboard();

  if (loading) {
    return <LoadingState fullPage message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState fullPage message={error} onRetry={() => { clearError(); refresh(); }} />;
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Utilization Dashboard"
        subtitle="Monitor employee utilization and resource allocation"
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Utilization' },
          { label: 'Dashboard' },
        ]}
      />

      {data && (
        <>
          <div className="mb-6">
            <DashboardSummary summary={data.summary} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Department Utilization
                </h3>
                <div className="space-y-4">
                  {data.departments.map((dept) => (
                    <div key={dept.departmentId} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dept.departmentName}</p>
                        <p className="text-xs text-gray-500">{dept.employeeCount} employees</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${dept.utilizationPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {dept.utilizationPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {data.recentActivities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{activity.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}