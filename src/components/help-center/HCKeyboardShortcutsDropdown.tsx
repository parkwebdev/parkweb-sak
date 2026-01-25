/**
 * Help Center Keyboard Shortcuts Dropdown
 * 
 * Article-specific dropdown showing available keyboard shortcuts.
 * Opens on click or when pressing '?' key.
 */

import { useState, useEffect, useCallback } from 'react';
import { Keyboard01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HELP_CENTER_SHORTCUTS,
  formatShortcutKeys,
  isInputField,
} from '@/lib/keyboard-shortcuts';

export function HCKeyboardShortcutsDropdown() {
  const [open, setOpen] = useState(false);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isInputField(document.activeElement)) return;
    
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          aria-label="Keyboard shortcuts"
          aria-keyshortcuts="?"
          className="h-7 w-7 p-0"
        >
          <Keyboard01 size={14} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Keyboard Shortcuts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="py-1">
          {HELP_CENTER_SHORTCUTS.map((shortcut, index) => {
            const keys = formatShortcutKeys(shortcut);
            return (
              <div 
                key={index} 
                className="flex items-center justify-between px-2 py-1.5"
              >
                <span className="text-sm text-foreground">{shortcut.description}</span>
                <div className="flex items-center gap-0.5">
                  {keys.map((key, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      size="sm"
                      className="px-1.5 py-0 font-mono text-2xs h-auto rounded-sm min-w-[20px] justify-center"
                    >
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
