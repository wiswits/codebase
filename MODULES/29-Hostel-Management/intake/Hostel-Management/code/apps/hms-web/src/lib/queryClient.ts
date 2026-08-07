import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

// Error handler
const handleApiError = (error: unknown) => {
  if (error instanceof Error) {
    // Handle specific error types
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      // Server responded with error
      const status = axiosError.response.status;
      const data = axiosError.response.data as any;
      
      switch (status) {
        case 401:
          // Redirect to login
          window.location.href = `${import.meta.env.VITE_APEX_URL}/login`;
          break;
        case 403:
          console.error('Permission denied:', data?.message || 'Insufficient permissions');
          break;
        case 409:
          console.error('Conflict:', data?.message || 'Resource conflict');
          break;
        case 422:
          console.error('Validation error:', data?.errors || 'Invalid data');
          break;
        default:
          console.error('API Error:', data?.message || error.message);
      }
    } else if (axiosError.request) {
      // Request made but no response
      console.error('Network error - please check your connection');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
  }
  return error;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (cache time)
      retry: (failureCount, error) => {
        // Don't retry on 401, 403, 404
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          const status = axiosError.response.status;
          if (status === 401 || status === 403 || status === 404) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      suspense: false,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        handleApiError(error);
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      handleApiError(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      handleApiError(error);
    },
  }),
});

// Helper to invalidate multiple query keys
export function invalidateQueries(keys: string | string[]) {
  const keyArray = Array.isArray(keys) ? keys : [keys];
  return queryClient.invalidateQueries({
    queryKey: keyArray,
  });
}

// Helper to prefetch data
export function prefetchQuery<TData = unknown>(
  key: string[],
  fetcher: () => Promise<TData>
) {
  return queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fetcher,
  });
}

// Helper to get cached data
export function getCachedData<TData = unknown>(key: string[]): TData | undefined {
  return queryClient.getQueryData<TData>(key);
}

// Helper to set cached data
export function setCachedData<TData = unknown>(
  key: string[],
  data: TData
) {
  return queryClient.setQueryData<TData>(key, data);
}