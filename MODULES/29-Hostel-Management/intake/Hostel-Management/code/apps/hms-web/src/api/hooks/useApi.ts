import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { ApiError } from '../api/client';

// Generic API hook wrapper
export function useApiQuery<TData = unknown, TError = ApiError>(
  key: string[],
  url: string,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get<TData>(url);
      return response.data;
    },
    ...options,
  });
}

// Generic mutation hook
export function useApiMutation<TData = unknown, TVariables = unknown>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post'
) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const response = await apiClient[method]<TData>(url, variables);
      return response.data;
    },
  });
}

// Hook for invalidating queries
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  return (keys: string[]) => {
    return queryClient.invalidateQueries({ queryKey: keys });
  };
}