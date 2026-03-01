'use client';

import { useState, useCallback } from 'react';

interface UseWrapPromiseResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
}

export function useWrapPromise<T>(
  promiseFn: (...args: unknown[]) => Promise<T>,
): UseWrapPromiseResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await promiseFn(...args);
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
        return undefined;
      }
    },
    [promiseFn],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
