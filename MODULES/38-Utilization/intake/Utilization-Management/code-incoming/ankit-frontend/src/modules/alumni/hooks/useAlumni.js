/**
 * useAlumni Hook
 * Manages alumni list and dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import { alumniApi } from '../services/alumniApi';

export function useAlumni() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alumni, setAlumni] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    batch: '',
    graduationYear: '',
    course: '',
    status: ''
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await alumniApi.getStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlumni = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = { ...filters, ...params };
      const response = await alumniApi.getAlumni(queryParams);
      if (response.success) {
        setAlumni(response.data.items || []);
        setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } else {
        setError(response.error?.message || 'Failed to fetch alumni');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      batch: '',
      graduationYear: '',
      course: '',
      status: ''
    });
  }, []);

  const goToPage = useCallback((page) => {
    fetchAlumni({ page });
  }, [fetchAlumni]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    loading,
    error,
    alumni,
    stats,
    pagination,
    filters,
    fetchAlumni,
    fetchStats,
    updateFilters,
    clearFilters,
    goToPage
  };
}