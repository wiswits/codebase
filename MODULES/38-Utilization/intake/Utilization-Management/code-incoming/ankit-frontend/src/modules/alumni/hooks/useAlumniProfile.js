/**
 * useAlumniProfile Hook
 * Manages alumni profile data
 */

import { useState, useCallback } from 'react';
import { alumniApi } from '../services/alumniApi';

export function useAlumniProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await alumniApi.getProfile(id);
      if (response.success) {
        setProfile(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch profile');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    profile,
    fetchProfile,
    clearProfile
  };
}