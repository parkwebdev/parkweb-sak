/**
 * Theme Toggle Component
 * 
 * Button to switch between light and dark themes.
 * Uses View Transitions API for smooth circular animation when available.
 * 
 * @module components/ThemeToggle
 */

import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Moon02 as Moon, Sun } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

/**
 * Props for the ThemeToggle component
 */
interface ThemeToggleProps {
  /** Whether the sidebar is collapsed (affects size) */
  isCollapsed?: boolean;
}

/**
 * Theme toggle button with animated transition.
 * Uses View Transitions API for a circular reveal effect.
 * 
 * @example
 * // Standalone
 * <ThemeToggle />
 */
export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLButtonElement>(null);
  
  // Determine if currently in dark mode
  const isDarkMode = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  /**
   * Toggle theme with optional View Transitions animation
   * @internal
   */
  const handleToggle = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    
    // Check for View Transitions API support
    if (!document.startViewTransition || !ref.current) {
      setTheme(newTheme);
      return;
    }
    
    // Get button position for animation origin
    const { top, left, width, height } = ref.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    
    // Start view transition
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(newTheme));
    });
    
    await transition.ready;
    
    // Animate the circle expansion from button position
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 500,
        easing: 'ease-out',
        pseudoElement: '::view-transition-new(root)'
      }
    );
  };

  return (
    <Button 
      ref={ref}
      variant="outline" 
      size="sm" 
      className={`relative p-0 ${isCollapsed ? 'h-6 w-6' : 'h-7 w-7'}`}
      onClick={handleToggle}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Moon className={isCollapsed ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      ) : (
        <Sun className={isCollapsed ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}