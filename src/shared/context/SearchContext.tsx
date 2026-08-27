import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MAX_TRACKED } from '@/features/search/domain';
import { DUMMY_TRACK_HISTORY } from '@/features/track/dummyHistory';

type SearchContextType = {
  history: string[];
  addSearch: (url: string) => void; // aplica MAX_TRACKED
  removeSearch: (url: string) => void;
  clearHistory: () => void;
  isFull: boolean; // history.length >= MAX_TRACKED
  lastAdded: string | null;
  setLastAdded: (url: string | null) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<string[]>(DUMMY_TRACK_HISTORY);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const addSearch = useCallback((url: string) => {
    setHistory(prev => {
      const withoutDup = prev.filter(u => u !== url);
      const isNew = withoutDup.length === prev.length;
      // Protege el tope: no agrega una URL nueva si la lista ya está llena.
      if (isNew && prev.length >= MAX_TRACKED) return prev;
      return [url, ...withoutDup];
    });
  }, []);

  const removeSearch = useCallback((url: string) => {
    setHistory(prev => prev.filter(u => u !== url));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const isFull = history.length >= MAX_TRACKED;

  const value = useMemo(
    () => ({
      history,
      addSearch,
      removeSearch,
      clearHistory,
      isFull,
      lastAdded,
      setLastAdded,
    }),
    [history, addSearch, removeSearch, clearHistory, isFull, lastAdded],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextType {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
