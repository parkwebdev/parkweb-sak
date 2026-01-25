/**
 * Keyboard Shortcuts Configuration
 * 
 * Centralized definitions for all keyboard shortcuts used throughout the app.
 * @module lib/keyboard-shortcuts
 */

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
}

/** Regular app navigation shortcuts */
export const APP_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'k', ctrlKey: true, description: 'Global Search' },
  { key: 't', altKey: true, description: 'Theme' },
  { key: 'a', altKey: true, description: 'Ari' },
  { key: 'c', altKey: true, description: 'Inbox' },
  { key: 'l', altKey: true, description: 'Leads' },
  { key: 'y', altKey: true, description: 'Analytics' },
  { key: 'p', altKey: true, description: 'Planner' },
  { key: 's', altKey: true, description: 'Settings' },
  { key: 'h', altKey: true, description: 'Help Center' },
];

/** Admin area navigation shortcuts */
export const ADMIN_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'k', ctrlKey: true, description: 'Admin Search' },
  { key: 't', altKey: true, description: 'Theme' },
  { key: 'o', altKey: true, description: 'Overview' },
  { key: 'a', altKey: true, description: 'Accounts' },
  { key: 'p', altKey: true, description: 'Prompts' },
  { key: 'b', altKey: true, description: 'Plans & Billing' },
  { key: 'm', altKey: true, description: 'Pilot Team' },
  { key: 'h', altKey: true, description: 'Help Articles' },
  { key: 'e', altKey: true, description: 'Emails' },
  { key: 'r', altKey: true, description: 'Revenue' },
  { key: 'l', altKey: true, description: 'Audit Log' },
];

/** Help Center specific shortcuts */
export const HELP_CENTER_SHORTCUTS: KeyboardShortcut[] = [
  { key: '←', description: 'Previous article' },
  { key: '→', description: 'Next article' },
  { key: 't', description: 'Scroll to top' },
];

/** General shortcuts available everywhere */
export const GENERAL_SHORTCUTS: KeyboardShortcut[] = [
  { key: '?', description: 'Open shortcuts help' },
];

/**
 * Format a shortcut into display keys (e.g., ['⌘', 'K'])
 */
export function formatShortcutKeys(shortcut: KeyboardShortcut): string[] {
  const keys: string[] = [];
  if (shortcut.ctrlKey) keys.push('⌘');
  if (shortcut.altKey) keys.push('Alt');
  if (shortcut.shiftKey) keys.push('⇧');
  keys.push(shortcut.key.toUpperCase());
  return keys;
}

/**
 * Check if the active element is an input field
 */
export function isInputField(element: Element | null): boolean {
  if (!element) return false;
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.getAttribute('contenteditable') === 'true'
  );
}
