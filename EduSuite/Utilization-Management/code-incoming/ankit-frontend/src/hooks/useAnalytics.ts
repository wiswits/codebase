/**
 * useAnalytics Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../services/analytics.api';
import { AnalyticsData } from '../types/analytics.types';

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.getAnalytics();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to load analytics');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    data,
    refresh,
    clearError,
  };
}