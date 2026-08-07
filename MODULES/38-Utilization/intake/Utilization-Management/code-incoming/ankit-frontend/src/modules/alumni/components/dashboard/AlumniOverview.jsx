/**
 * Alumni Overview Component
 * Quick overview of alumni statistics
 */

import React from 'react';
import { BarChart3, Users, Award, Calendar } from 'lucide-react';

export default function AlumniOverview({ stats, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const overviewItems = [
    { label: 'Total Alumni', value: stats?.totalAlumni || 0, icon: <Users className="h-4 w-4" /> },
    { label: 'Active Alumni', value: stats?.activeAlumni || 0, icon: <Award className="h-4 w-4" /> },
    { label: 'Recent Graduates', value: stats?.recentGraduates || 0, icon: <GraduationCap className="h-4 w-4" /> },
    { label: 'Total Batches', value: stats?.topBatches?.length || 0, icon: <Calendar className="h-4 w-4" /> }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Alumni Overview</h3>
      <div className="space-y-3">
        {overviewItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center space-x-2 text-gray-600">
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}