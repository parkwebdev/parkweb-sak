import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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

  // Default global shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'd',
      ctrlKey: true,
      description: 'Go to Dashboard',
      action: () => navigate('/dashboard')
    },
    {
      key: 'a',
      ctrlKey: true,
      description: 'Go to Agents',
      action: () => navigate('/agents')
    },
    {
      key: 'c',
      ctrlKey: true,
      description: 'Go to Conversations',
      action: () => navigate('/conversations')
    },
    {
      key: 'l',
      ctrlKey: true,
      description: 'Go to Leads',
      action: () => navigate('/leads')
    },
    {
      key: 'y',
      ctrlKey: true,
      description: 'Go to Analytics',
      action: () => navigate('/analytics')
    },
    {
      key: ',',
      ctrlKey: true,
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

    const shortcut = allShortcuts.find(s => 
      s.key === event.key.toLowerCase() &&
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