/**
 * useSalaryStructures Hook
 * Manages salary structures data
 */

import { useState, useEffect, useCallback } from 'react';
import { payrollApi } from '../services/payrollApi';
import { SalaryStructure } from '../types/payroll.types';

interface UseSalaryStructuresProps {
  initialPage?: number;
  initialLimit?: number;
}

export function useSalaryStructures({ initialPage = 1, initialLimit = 20 }: UseSalaryStructuresProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  const fetchStructures = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = { ...filters, ...params };
      const response = await payrollApi.getSalaryStructures(queryParams);
      if (response.success) {
        setStructures(response.data.items);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to load structures');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createStructure = useCallback(async (data: Partial<SalaryStructure>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await payrollApi.createSalaryStructure(data);
      if (response.success) {
        await fetchStructures();
        return response.data;
      } else {
        setError(response.message || 'Failed to create structure');
        return null;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchStructures]);

  const updateStructure = useCallback(async (id: number, data: Partial<SalaryStructure>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await payrollApi.updateSalaryStructure(id, data);
      if (response.success) {
        await fetchStructures();
        return response.data;
      } else {
        setError(response.message || 'Failed to update structure');
        return null;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchStructures]);

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: '' });
  }, []);

  useEffect(() => {
    fetchStructures({ page: initialPage, limit: initialLimit });
  }, []);

  return {
    loading,
    error,
    structures,
    pagination,
    filters,
    fetchStructures,
    createStructure,
    updateStructure,
    updateFilters,
    clearFilters,
    setError
  };
}