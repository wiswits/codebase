/**
 * usePayrollDashboard Hook
 * Manages payroll dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import { payrollApi } from '../services/payrollApi';
import { PayrollDashboardStats } from '../types/payroll.types';

export function usePayrollDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PayrollDashboardStats | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await payrollApi.getDashboard();
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const clearError = () => setError(null);
  const refresh = () => fetchDashboard();

  return {
    loading,
    error,
    stats,
    clearError,
    refresh
  };
}