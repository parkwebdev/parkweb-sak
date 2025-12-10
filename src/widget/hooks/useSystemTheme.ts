/**
 * useSystemTheme Hook
 * 
 * Listens for system color scheme changes and forces re-render
 * to ensure mobile browsers properly update theme.
 * 
 * @module widget/hooks/useSystemTheme
 */
import { useState, useEffect } from 'react';

export const useSystemTheme = (): 'light' | 'dark' => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    // Add listener for theme changes
    mediaQuery.addEventListener('change', handleChange);

    // Also set initial value in case it changed before hydration
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return theme;
};
