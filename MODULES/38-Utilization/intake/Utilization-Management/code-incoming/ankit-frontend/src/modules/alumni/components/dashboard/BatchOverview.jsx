/**
 * Batch Overview Component
 * Displays top batches with counts
 */

import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

export default function BatchOverview({ batches, isLoading = false, onBatchClick }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Batches</h3>
        <p className="text-gray-500 text-sm">No batch data available</p>
      </div>
    );
  }

  // Sort batches by count (highest first)
  const sortedBatches = [...batches].sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Batches</h3>
      <div className="space-y-2">
        {sortedBatches.map((batch, index) => (
          <button
            key={index}
            onClick={() => onBatchClick?.(batch.batch)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Batch of {batch.batch}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{batch.count} alumni</span>
              <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}