import { useState, useEffect, useCallback } from 'react';

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export function useDebounce<T>(
  value: T,
  delay: number,
  options: DebounceOptions = {}
): T {
  const { leading = false, trailing = true, maxWait } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [lastCallTime, setLastCallTime] = useState<number>(0);

  useEffect(() => {
    const now = Date.now();
    const isLeadingCall = leading && lastCallTime === 0;

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    // Leading edge
    if (isLeadingCall) {
      setDebouncedValue(value);
      setLastCallTime(now);
      return;
    }

    // Max wait handling
    if (maxWait && now - lastCallTime >= maxWait) {
      setDebouncedValue(value);
      setLastCallTime(now);
      return;
    }

    // Trailing edge
    if (trailing) {
      const id = setTimeout(() => {
        setDebouncedValue(value);
        setLastCallTime(0);
      }, delay);
      setTimeoutId(id);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [value, delay, leading, trailing, maxWait, lastCallTime]);

  // Force update
  const flush = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setDebouncedValue(value);
    setLastCallTime(0);
  }, [value]);

  // Cancel pending updates
  const cancel = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  return debouncedValue;
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: DebounceOptions = {}
): [T, () => void, () => void] {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [lastCallTime, setLastCallTime] = useState<number>(0);

  const { leading = false, trailing = true, maxWait } = options;

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const isLeadingCall = leading && lastCallTime === 0;

      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }

      // Leading edge
      if (isLeadingCall) {
        callback(...args);
        setLastCallTime(now);
        return;
      }

      // Max wait handling
      if (maxWait && now - lastCallTime >= maxWait) {
        callback(...args);
        setLastCallTime(now);
        return;
      }

      // Trailing edge
      if (trailing) {
        const id = setTimeout(() => {
          callback(...args);
          setLastCallTime(0);
        }, delay);
        setTimeoutId(id);
      }
    },
    [callback, delay, leading, trailing, maxWait, lastCallTime]
  );

  const flush = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    // This is a simplified version - in practice you'd need to store the last args
  }, [timeoutId]);

  const cancel = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  return [debouncedCallback as T, flush, cancel];
}