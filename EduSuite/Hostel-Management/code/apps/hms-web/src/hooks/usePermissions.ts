import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface PermissionsResponse {
  permissions: string[];
}

export function usePermissions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await apiClient.get<PermissionsResponse>('/me/permissions');
      return response.data.permissions;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const can = (permission: string): boolean => {
    if (!data) return false;
    return data.includes(permission);
  };

  const canAny = (permissions: string[]): boolean => {
    if (!data || permissions.length === 0) return false;
    return permissions.some(p => data.includes(p));
  };

  const canAll = (permissions: string[]): boolean => {
    if (!data || permissions.length === 0) return false;
    return permissions.every(p => data.includes(p));
  };

  const hasRole = (role: string): boolean => {
    // This would check user roles from the token
    // Implementation depends on how roles are stored
    return false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(r => hasRole(r));
  };

  return {
    permissions: data || [],
    isLoading,
    error,
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
  };
}