/**
 * Admin Keyboard Shortcuts Hook
 * 
 * Provides keyboard navigation for admin sections.
 * Mirrors the regular app's keyboard shortcuts pattern.
 * 
 * @module hooks/admin/useAdminKeyboardShortcuts
 */

import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';

interface AdminShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  path?: string;
  action?: () => void;
  description: string;
}

const ADMIN_SHORTCUTS: AdminShortcut[] = [
  { key: 'o', altKey: true, path: '/admin', description: 'Overview' },
  { key: 'a', altKey: true, path: '/admin/accounts', description: 'Accounts' },
  { key: 'p', altKey: true, path: '/admin/prompts', description: 'Prompts' },
  { key: 'b', altKey: true, path: '/admin/plans', description: 'Plans & Billing' },
  { key: 'm', altKey: true, path: '/admin/team', description: 'Pilot Team' },
  { key: 'h', altKey: true, path: '/admin/knowledge', description: 'Help Articles' },
  { key: 'e', altKey: true, path: '/admin/emails', description: 'Emails' },
  { key: 'r', altKey: true, path: '/admin/analytics', description: 'Revenue' },
  { key: 'l', altKey: true, path: '/admin/audit', description: 'Audit Log' },
];

/**
 * Hook that registers admin keyboard shortcuts.
 * Only active when in /admin/* routes.
 * 
 * @returns {Object} Registered shortcuts for display
 */
export function useAdminKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme, theme } = useTheme();

  // Only register shortcuts when in admin area
  const isAdminArea = location.pathname.startsWith('/admin');

  // Theme toggle shortcut
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // All shortcuts including theme
  const allShortcuts: AdminShortcut[] = [
    { key: 't', altKey: true, action: toggleTheme, description: 'Theme' },
    ...ADMIN_SHORTCUTS,
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger in input fields
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement && e.target.isContentEditable)
    ) {
      return;
    }

    // Find matching shortcut
    const shortcut = allShortcuts.find(
      (s) =>
        s.key.toLowerCase() === e.key.toLowerCase() &&
        !!s.altKey === e.altKey &&
        !!s.ctrlKey === (e.ctrlKey || e.metaKey) &&
        !!s.shiftKey === e.shiftKey
    );

    if (shortcut) {
      e.preventDefault();
      if (shortcut.action) {
        shortcut.action();
      } else if (shortcut.path) {
        navigate(shortcut.path);
      }
    }
  }, [allShortcuts, navigate]);

  useEffect(() => {
    if (!isAdminArea) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAdminArea, handleKeyDown]);

  return { shortcuts: allShortcuts };
}
