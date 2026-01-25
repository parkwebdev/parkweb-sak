/**
 * @fileoverview Keyboard Shortcuts Button
 * Primary-colored button in TopBar that opens shortcuts dialog on click or '?' key.
 */

import { useState, useEffect, useCallback } from 'react';
import { Keyboard01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { isInputField } from '@/lib/keyboard-shortcuts';

export function KeyboardShortcutsButton() {
  const [open, setOpen] = useState(false);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isInputField(document.activeElement)) return;
    
    // '?' requires Shift+/ on most keyboards
    if (event.key === '?') {
      event.preventDefault();
      setOpen(prev => !prev);
    }
  }, []);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
        aria-keyshortcuts="?"
        className="h-7 w-7 p-0"
      >
        <Keyboard01 size={14} aria-hidden="true" />
      </Button>
      
      <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
