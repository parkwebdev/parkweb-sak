/**
 * Theme Switcher Component
 * 
 * A 3-way toggle for theme selection (System, Light, Dark).
 * Uses View Transitions API for smooth circular animation when available.
 * 
 * @module components/ui/theme-switcher
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Monitor01 as Monitor, Sun, Moon02 as Moon } from '@untitledui/icons';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/components/ThemeProvider';

const themes = [
  { key: 'system' as Theme, icon: Monitor, label: 'System theme' },
  { key: 'light' as Theme, icon: Sun, label: 'Light theme' },
  { key: 'dark' as Theme, icon: Moon, label: 'Dark theme' },
];

export interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const buttonRefs = useRef<Map<Theme, HTMLButtonElement>>(new Map());
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeClick = useCallback(
    async (themeKey: Theme, event: React.MouseEvent<HTMLButtonElement>) => {
      if (themeKey === theme) return;

      const button = event.currentTarget;
      
      // Check for View Transitions API support
      if (!document.startViewTransition || !button) {
        setTheme(themeKey);
        return;
      }

      // Get button position for animation origin
      const { top, left, width, height } = button.getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Start view transition
      const transition = document.startViewTransition(() => {
        flushSync(() => setTheme(themeKey));
      });

      await transition.ready;

      // Animate the circle expansion from button position
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    },
    [theme, setTheme]
  );

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted p-1',
        className
      )}
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;
        return (
          <button
            key={key}
            ref={(el) => {
              if (el) buttonRefs.current.set(key, el);
            }}
            aria-label={label}
            className={cn(
              'relative flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={(e) => handleThemeClick(key, e)}
            type="button"
          >
            {isActive && (
              <motion.div
                layoutId="theme-switcher-active"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            <Icon size={14} className="relative z-10" />
          </button>
        );
      })}
    </div>
  );
}
