/**
 * Unified Search Context
 * 
 * Single context that provides search dialog state for both user and admin areas.
 * Automatically detects the current route to determine which mode to use.
 * 
 * @module contexts/UnifiedSearchContext
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface UnifiedSearchContextType {
  /** Whether search dialog is open */
  open: boolean;
  /** Toggle search dialog */
  setOpen: (open: boolean) => void;
  /** Whether currently in admin mode (on /admin/* routes) */
  isAdminMode: boolean;
}

const UnifiedSearchContext = createContext<UnifiedSearchContextType | undefined>(undefined);

/**
 * Provider for unified search state.
 * Handles Cmd/Ctrl+K keyboard shortcut globally.
 */
export function UnifiedSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isAdminMode = location.pathname.startsWith('/admin');

  // Handle Cmd/Ctrl+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ open, setOpen, isAdminMode }), [open, isAdminMode]);

  return (
    <UnifiedSearchContext.Provider value={value}>
      {children}
    </UnifiedSearchContext.Provider>
  );
}

/**
 * Hook to access unified search state.
 * Works in both user and admin areas.
 * 
 * @example
 * const { open, setOpen, isAdminMode } = useUnifiedSearch();
 */
export const useUnifiedSearch = () => {
  const context = useContext(UnifiedSearchContext);
  if (!context) {
    throw new Error('useUnifiedSearch must be used within a UnifiedSearchProvider');
  }
  return context;
};
