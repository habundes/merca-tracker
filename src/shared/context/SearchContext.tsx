import React, { createContext, useContext, useState } from 'react';

type SearchContextType = {
  history: string[];
  addSearch: (url: string) => void;
  removeSearch: (url: string) => void;
  clearHistory: () => void;
};

const SearchContext = createContext<SearchContextType>({
  history: [],
  addSearch: () => {},
  removeSearch: () => {},
  clearHistory: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<string[]>([]);

  const addSearch = (url: string) => {
    setHistory(prev => [url, ...prev.filter(u => u !== url)]);
  };

  const removeSearch = (url: string) => {
    setHistory(prev => prev.filter(u => u !== url));
  };

  const clearHistory = () => setHistory([]);

  return (
    <SearchContext.Provider value={{ history, addSearch, removeSearch, clearHistory }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => useContext(SearchContext);
