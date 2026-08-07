import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface User {
  apexUserId: string;
  orgId: string;
  campusIds: string[];
  roles: string[];
  studentId?: string;
  parentOf?: string[];
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/me');
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: false,
  });

  const isAuthenticated = !!user;
  const isStudent = user?.roles?.includes('student') ?? false;
  const isParent = user?.roles?.includes('parent') ?? false;
  const isAdmin = user?.roles?.some(r => r.includes('admin')) ?? false;

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    isStudent,
    isParent,
    isAdmin,
  };
}