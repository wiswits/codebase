/**
 * Alumni Dashboard Page
 * Main dashboard with statistics, overview, and recent alumni
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAlumni } from '../hooks/useAlumni';
import AlumniStats from '../components/dashboard/AlumniStats';
import AlumniOverview from '../components/dashboard/AlumniOverview';
import BatchOverview from '../components/dashboard/BatchOverview';
import RecentAlumni from '../components/dashboard/RecentAlumni';
import { Users, Search, Loader2, AlertCircle } from 'lucide-react';

export default function AlumniDashboard() {
  const router = useRouter();
  const { 
    loading, 
    error, 
    stats, 
    alumni, 
    fetchStats, 
    fetchAlumni, 
    clearError 
  } = useAlumni();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    clearError();
    await Promise.all([
      fetchStats(),
      fetchAlumni({ limit: 5 })
    ]);
  };

  const handleRetry = () => {
    loadDashboard();
  };

  const handleViewProfile = (id) => {
    router.push(`/alumni/profile/${id}`);
  };

  const handleBatchClick = (batch) => {
    router.push(`/alumni/directory?batch=${batch}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alumni Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Overview of alumni data and statistics
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => router.push('/alumni/directory')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Search className="h-5 w-5 mr-2" />
              Browse Directory
            </button>
            <button
              onClick={() => router.push('/alumni/directory')}
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Users className="h-5 w-5 mr-2" />
              View All
            </button>
          </div>
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
                onClick={handleRetry}
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
          <AlumniStats stats={stats} isLoading={loading} />
        </div>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <AlumniOverview stats={stats} isLoading={loading} />
          </div>
          <div className="lg:col-span-1">
            <BatchOverview 
              batches={stats?.topBatches || []} 
              isLoading={loading}
              onBatchClick={handleBatchClick}
            />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/alumni/directory')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Alumni
                </button>
                <button
                  onClick={() => router.push('/alumni/directory')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center"
                >
                  <Users className="h-4 w-4 mr-2" />
                  View All Alumni
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alumni Table */}
        <div>
          <RecentAlumni 
            alumni={alumni} 
            isLoading={loading}
            onViewProfile={handleViewProfile}
          />
        </div>
      </div>
    </div>
  );
}