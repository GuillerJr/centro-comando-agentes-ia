import { useEffect, useMemo, useState } from 'react';

type PersistedFiltersOptions<T extends Record<string, string>> = {
  storageKey: string;
  initialState: T;
};

export function usePersistedFilters<T extends Record<string, string>>({ storageKey, initialState }: PersistedFiltersOptions<T>) {
  const [filters, setFilters] = useState<T>(() => {
    if (typeof window === 'undefined') return initialState;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return initialState;
      const parsed = JSON.parse(raw) as Partial<T>;
      return { ...initialState, ...parsed };
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(filters));
  }, [filters, storageKey]);

  const actions = useMemo(
    () => ({
      set<K extends keyof T>(key: K, value: T[K]) {
        setFilters((current) => ({ ...current, [key]: value }));
      },
      reset() {
        setFilters(initialState);
      },
    }),
    [initialState],
  );

  return { filters, setFilters, ...actions };
}
