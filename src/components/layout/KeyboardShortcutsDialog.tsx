/**
 * @fileoverview Keyboard Shortcuts Dialog
 * Displays all available keyboard shortcuts organized by context.
 */

import { useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  APP_SHORTCUTS,
  ADMIN_SHORTCUTS,
  HELP_CENTER_SHORTCUTS,
  GENERAL_SHORTCUTS,
  formatShortcutKeys,
  type KeyboardShortcut,
} from '@/lib/keyboard-shortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShortcutRow({ shortcut }: { shortcut: KeyboardShortcut }) {
  const keys = formatShortcutKeys(shortcut);
  
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-foreground">{shortcut.description}</span>
      <div className="flex items-center gap-0.5">
        {keys.map((key, index) => (
          <Badge
            key={index}
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
}

function ShortcutSection({ 
  title, 
  shortcuts 
}: { 
  title: string; 
  shortcuts: KeyboardShortcut[];
}) {
  if (shortcuts.length === 0) return null;
  
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-0.5">
        {shortcuts.map((shortcut, index) => (
          <ShortcutRow key={index} shortcut={shortcut} />
        ))}
      </div>
    </section>
  );
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  const isHelpCenter = location.pathname.startsWith('/help-center');
  
  const navigationShortcuts = isAdminArea ? ADMIN_SHORTCUTS : APP_SHORTCUTS;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick navigation shortcuts for the app.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <ShortcutSection 
            title="Navigation" 
            shortcuts={navigationShortcuts} 
          />
          
          {isHelpCenter && (
            <ShortcutSection 
              title="Help Center" 
              shortcuts={HELP_CENTER_SHORTCUTS} 
            />
          )}
          
          <ShortcutSection 
            title="General" 
            shortcuts={GENERAL_SHORTCUTS} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
