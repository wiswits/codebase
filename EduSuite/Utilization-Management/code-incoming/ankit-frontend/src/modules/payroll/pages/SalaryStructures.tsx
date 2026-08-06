/**
 * Salary Structures Page
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSalaryStructures } from '../hooks/useSalaryStructures';
import SalaryStructureList from '../components/salary/SalaryStructureList';
import SalaryStructureFilters from '../components/salary/SalaryStructureFilters';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';

export default function SalaryStructures() {
  const router = useRouter();
  const {
    loading,
    error,
    structures,
    pagination,
    filters,
    fetchStructures,
    updateFilters,
    clearFilters,
    setError
  } = useSalaryStructures();

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
    fetchStructures({ ...filters, ...newFilters, page: 1 });
  };

  const handleClearFilters = () => {
    clearFilters();
    fetchStructures({ page: 1 });
  };

  const handleView = (id) => {
    router.push(`/hr/payroll/structures/${id}`);
  };

  const handleEdit = (id) => {
    router.push(`/hr/payroll/structures/${id}/edit`);
  };

  if (loading && structures.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading salary structures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Structures</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage employee salary structures
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => router.push('/hr/payroll/structures/create')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              New Structure
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
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <SalaryStructureFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* List */}
        <div>
          <SalaryStructureList
            structures={structures}
            isLoading={loading}
            onView={handleView}
            onEdit={handleEdit}
          />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <nav className="flex items-center space-x-2">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchStructures({ page: i + 1 })}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    pagination.page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}