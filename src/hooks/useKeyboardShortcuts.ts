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

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[] = []) => {
  const navigate = useNavigate();

  // Default global shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      description: 'Create new onboarding',
      action: () => navigate('/onboarding')
    },
    {
      key: 's',
      ctrlKey: true,
      description: 'Go to Scope of Works',
      action: () => navigate('/scope-of-works')
    },
    {
      key: 'h',
      ctrlKey: true,
      description: 'Go to Dashboard',
      action: () => navigate('/')
    },
    {
      key: 't',
      ctrlKey: true,
      description: 'Go to Team Settings',
      action: () => {
        navigate('/settings');
        // Use a small timeout to ensure navigation completes before setting tab
        setTimeout(() => {
          const event = new CustomEvent('setActiveTab', { detail: 'team' });
          window.dispatchEvent(event);
        }, 100);
      }
    },
    {
      key: 'p',
      ctrlKey: true,
      description: 'Go to Profile Settings',
      action: () => {
        navigate('/settings');
        // Use a small timeout to ensure navigation completes before setting tab
        setTimeout(() => {
          const event = new CustomEvent('setActiveTab', { detail: 'profile' });
          window.dispatchEvent(event);
        }, 100);
      }
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