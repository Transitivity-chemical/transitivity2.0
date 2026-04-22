'use client';

/**
 * sessionStorage-backed React state. Survives page reloads within the same
 * tab, clears when the tab closes. For in-progress workbench inputs so an
 * accidental reload doesn't wipe uploads and temperatures.
 *
 * Hydration uses the lazy-initializer form of useState (no setState in an
 * effect), so there's no cascading render on mount. SSR hand-off is
 * consistent because the initializer returns the default during SSR and
 * reads sessionStorage on the client's first render.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.sessionStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  // Persist on every change. Skip the very first run to avoid writing the
  // hydrated value back unnecessarily.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Quota or disabled — keep running without persistence.
    }
  }, [key, state]);

  const clear = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key]);

  return [state, setState, clear];
}
