import { useEffect, useCallback } from 'react';
import type { CalendarView } from '@/types/calendar';

interface UseCalendarKeyboardShortcutsProps {
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

/**
 * Hook for calendar-specific keyboard shortcuts.
 * 
 * Shortcuts:
 * - ArrowLeft: Go to previous period
 * - ArrowRight: Go to next period
 * - T: Go to today
 * - M: Switch to month view
 * - W: Switch to week view
 * - D: Switch to day view
 */
export const useCalendarKeyboardShortcuts = ({
  onPrevious,
  onNext,
  onToday,
  onViewChange,
}: UseCalendarKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger if typing in input field
    const activeElement = document.activeElement;
    const isInputField = activeElement?.tagName === 'INPUT' || 
                        activeElement?.tagName === 'TEXTAREA' || 
                        activeElement?.getAttribute('contenteditable') === 'true';
    if (isInputField) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        onPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        onNext();
        break;
      case 't':
      case 'T':
        event.preventDefault();
        onToday();
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        onViewChange('month');
        break;
      case 'w':
      case 'W':
        event.preventDefault();
        onViewChange('week');
        break;
      case 'd':
      case 'D':
        event.preventDefault();
        onViewChange('day');
        break;
    }
  }, [onPrevious, onNext, onToday, onViewChange]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
