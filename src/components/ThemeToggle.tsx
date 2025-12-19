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
  /** Whether to render as a sidebar menu item */
  isSidebarItem?: boolean;
}

/**
 * Theme toggle button with animated transition.
 * Uses View Transitions API for a circular reveal effect.
 * 
 * @example
 * // In sidebar
 * <ThemeToggle isCollapsed={sidebarCollapsed} />
 * 
 * @example
 * // Standalone
 * <ThemeToggle />
 */
export function ThemeToggle({ isCollapsed = false, isSidebarItem = false }: ThemeToggleProps) {
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

  // Render as sidebar menu item
  if (isSidebarItem) {
    return (
      <button
        ref={ref}
        onClick={handleToggle}
        data-theme-toggle
        className="items-center flex w-full p-[11px] rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        title={isCollapsed ? (isDarkMode ? 'Light mode' : 'Dark mode') : ''}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div className="items-center flex gap-2 my-auto w-full overflow-hidden">
          <div className="items-center flex my-auto w-[18px] flex-shrink-0 justify-center">
            {isDarkMode ? (
              <Sun size={14} className="self-stretch my-auto" />
            ) : (
              <Moon size={14} className="self-stretch my-auto" />
            )}
          </div>
          {!isCollapsed && (
            <span className="text-sm font-normal leading-4 my-auto whitespace-nowrap">
              {isDarkMode ? 'Light mode' : 'Dark mode'}
            </span>
          )}
        </div>
      </button>
    );
  }

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