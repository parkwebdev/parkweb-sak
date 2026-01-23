/**
 * Admin Global Search Context
 * 
 * Provides shared state for the admin global search dialog.
 * Only active when user is in the /admin/* routes.
 * 
 * @module contexts/AdminGlobalSearchContext
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

interface AdminGlobalSearchContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AdminGlobalSearchContext = createContext<AdminGlobalSearchContextType | undefined>(undefined);

export function AdminGlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Handle Cmd/Ctrl+K keyboard shortcut for admin area
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

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <AdminGlobalSearchContext.Provider value={value}>
      {children}
    </AdminGlobalSearchContext.Provider>
  );
}

export const useAdminGlobalSearch = () => {
  const context = useContext(AdminGlobalSearchContext);
  if (!context) {
    throw new Error('useAdminGlobalSearch must be used within an AdminGlobalSearchProvider');
  }
  return context;
};
