/**
 * Payroll Dashboard Page
 */

import React from 'react';
import { useRouter } from 'next/router';
import { usePayrollDashboard } from '../hooks/usePayrollDashboard';
import StatsCards from '../components/dashboard/StatsCards';
import RecentRuns from '../components/dashboard/RecentRuns';
import QuickActions from '../components/dashboard/QuickActions';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function PayrollDashboard() {
  const router = useRouter();
  const { loading, error, stats, clearError, refresh } = usePayrollDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payroll dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of payroll activities and statistics
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refresh}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards stats={stats} isLoading={loading} />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Recent Runs */}
        <div>
          <RecentRuns
            runs={stats?.recentRuns || []}
            isLoading={loading}
            onViewRun={(id) => router.push(`/hr/payroll/runs/${id}`)}
          />
        </div>
      </div>
    </div>
  );
}