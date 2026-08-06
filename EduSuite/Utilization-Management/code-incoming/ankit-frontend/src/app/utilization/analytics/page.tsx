/**
 * Utilization Analytics Page
 */

'use client';

import React from 'react';
import { useAnalytics } from '../../../hooks/useAnalytics';
import LoadingState from '../../../components/common/LoadingState';
import ErrorState from '../../../components/common/ErrorState';
import PageHeader from '../../../components/common/PageHeader';
import { formatPercent, formatNumber } from '../../../utils/formatter';

export default function UtilizationAnalyticsPage() {
  const { loading, error, data, refresh, clearError } = useAnalytics();

  if (loading) {
    return <LoadingState fullPage message="Loading analytics..." />;
  }

  if (error) {
    return <ErrorState fullPage message={error} onRetry={() => { clearError(); refresh(); }} />;
  }

  if (!data) {
    return null;
  }

  const kpis = data.kpis;

  return (
    <div className="p-6">
      <PageHeader
        title="Utilization Analytics"
        subtitle="Detailed analytics and insights"
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Utilization' },
          { label: 'Analytics' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600">Overall Utilization</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatPercent(kpis.overallUtilization)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600">Bench Percentage</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatPercent(kpis.benchPercentage)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600">Over Utilized</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatNumber(kpis.overUtilizedCount)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600">Under Utilized</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {formatNumber(kpis.underUtilizedCount)}
          </p>
        </div>
      </div>

      {/* Trends */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="space-y-3">
          {data.trends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{trend.period}</span>
              <div className="flex items-center space-x-4 flex-1 ml-4">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${trend.utilization}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
                  {trend.utilization.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Comparison */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Comparison</h3>
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
                    className={`h-full rounded-full ${
                      dept.utilizationPercentage >= 85
                        ? 'bg-red-500'
                        : dept.utilizationPercentage >= 70
                        ? 'bg-green-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${dept.utilizationPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
                  {dept.utilizationPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}