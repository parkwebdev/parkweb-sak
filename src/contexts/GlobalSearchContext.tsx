/**
 * Global Search Context
 * 
 * Provides shared state for the global search dialog.
 * Allows any component to open/close the search modal.
 * 
 * @module contexts/GlobalSearchContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface GlobalSearchContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined);

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Handle Cmd/Ctrl+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ open, setOpen }}>
      {children}
    </GlobalSearchContext.Provider>
  );
};

export const useGlobalSearch = () => {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
  }
  return context;
};
