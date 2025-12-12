/**
 * Theme Provider Component
 * 
 * Manages application-wide theme state (light/dark/system).
 * Persists theme preference to localStorage and applies CSS class to document.
 * 
 * @module components/ThemeProvider
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

/** Available theme options */
type Theme = 'dark' | 'light' | 'system';

/**
 * Props for the ThemeProvider component
 */
type ThemeProviderProps = {
  /** Child components to wrap */
  children: React.ReactNode;
  /** Initial theme if no preference is stored */
  defaultTheme?: Theme;
  /** localStorage key for persisting theme preference */
  storageKey?: string;
};

/**
 * Shape of the theme context value
 */
type ThemeProviderState = {
  /** Current theme setting */
  theme: Theme;
  /** Function to update theme */
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Theme provider component that manages dark/light mode.
 * Automatically syncs with system preference when set to 'system'.
 * 
 * @example
 * <ThemeProvider defaultTheme="dark" storageKey="app-theme">
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  // Apply theme class to document and handle system theme changes
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setThemeState(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * Hook to access the theme context.
 * Must be used within a ThemeProvider.
 * 
 * @throws Error if used outside ThemeProvider
 * @returns Theme context with current theme and setter
 * 
 * @example
 * const { theme, setTheme } = useTheme();
 * setTheme('dark');
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};