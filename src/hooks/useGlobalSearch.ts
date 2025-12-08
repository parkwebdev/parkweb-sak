import { useState, useEffect } from 'react';

/**
 * Hook for managing global search dialog state.
 * Handles Cmd/Ctrl+K keyboard shortcut to toggle search.
 * 
 * @returns {Object} Search dialog state
 * @returns {boolean} open - Whether search dialog is open
 * @returns {Function} setOpen - Toggle search dialog
 */
export const useGlobalSearch = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
};