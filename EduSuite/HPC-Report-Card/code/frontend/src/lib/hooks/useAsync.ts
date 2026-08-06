import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Runs `fn` whenever `deps` change, tracking loading/error/data state.
 * Pass `enabled: false` to skip running (e.g. while required params are empty).
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong.';
      setState({ data: null, loading: false, error: message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch };
}
