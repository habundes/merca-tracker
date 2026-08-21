import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type SearchContextType = {
  history: string[];
  addSearch: (url: string) => void;
  removeSearch: (url: string) => void;
  clearHistory: () => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<string[]>([]);

  const addSearch = useCallback((url: string) => {
    setHistory(prev => [url, ...prev.filter(u => u !== url)]);
  }, []);

  const removeSearch = useCallback((url: string) => {
    setHistory(prev => prev.filter(u => u !== url));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const value = useMemo(
    () => ({ history, addSearch, removeSearch, clearHistory }),
    [history, addSearch, removeSearch, clearHistory],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextType {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
