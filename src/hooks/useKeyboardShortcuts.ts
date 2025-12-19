import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}

/**
 * Hook for registering global keyboard shortcuts.
 * Includes default navigation shortcuts (Ctrl+D for dashboard, etc.).
 * Ignores shortcuts when user is typing in input fields.
 * 
 * @param {KeyboardShortcut[]} [shortcuts=[]] - Additional custom shortcuts
 * @returns {Object} Shortcut data
 * @returns {KeyboardShortcut[]} shortcuts - All registered shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[] = []) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Determine if currently in dark mode
  const isDarkMode = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Default global shortcuts (using Alt+key to avoid browser conflicts)
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 't',
      altKey: true,
      description: 'Toggle Theme',
      action: () => setTheme(isDarkMode ? 'light' : 'dark')
    },
    {
      key: 'a',
      altKey: true,
      description: 'Go to Ari',
      action: () => navigate('/ari')
    },
    {
      key: 'c',
      altKey: true,
      description: 'Go to Inbox',
      action: () => navigate('/conversations')
    },
    {
      key: 'l',
      altKey: true,
      description: 'Go to Leads',
      action: () => navigate('/leads')
    },
    {
      key: 'y',
      altKey: true,
      description: 'Go to Analytics',
      action: () => navigate('/analytics')
    },
    {
      key: 'p',
      altKey: true,
      description: 'Go to Planner',
      action: () => navigate('/planner')
    },
    {
      key: 's',
      altKey: true,
      description: 'Go to Settings',
      action: () => navigate('/settings')
    }
  ];

  const allShortcuts = [...defaultShortcuts, ...shortcuts];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts if user is typing in an input field
    const activeElement = document.activeElement;
    const isInputField = activeElement?.tagName === 'INPUT' || 
                        activeElement?.tagName === 'TEXTAREA' || 
                        activeElement?.getAttribute('contenteditable') === 'true';

    if (isInputField) return;

    // Use event.code for physical key detection (fixes Mac Option key producing special chars)
    const pressedKey = event.code.replace('Key', '').toLowerCase();
    
    const shortcut = allShortcuts.find(s => 
      s.key === pressedKey &&
      !!s.ctrlKey === event.ctrlKey &&
      !!s.altKey === event.altKey &&
      !!s.shiftKey === event.shiftKey
    );

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [allShortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: allShortcuts };
};