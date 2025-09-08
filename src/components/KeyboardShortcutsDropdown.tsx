import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { Keyboard01 } from '@untitledui/icons';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}

interface KeyboardShortcutsDropdownProps {
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsDropdown: React.FC<KeyboardShortcutsDropdownProps> = ({
  shortcuts
}) => {
  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    keys.push(shortcut.key.toUpperCase());
    return keys;
  };

  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.description.includes('Go to') ? 'Navigation' :
                    shortcut.description.includes('Create') || shortcut.description.includes('New') ? 'Actions' :
                    'General';
    
    if (!groups[category]) groups[category] = [];
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Keyboard01 size={16} className="mr-2" />
        Shortcuts
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-80 max-h-96 overflow-y-auto">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts], groupIndex) => (
          <React.Fragment key={category}>
            <div className="px-2 py-1.5">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                {category}
              </div>
              <div className="space-y-1">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-xs text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-0.5">
                      {formatShortcut(shortcut).map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <Badge 
                            variant="secondary" 
                            className="px-1.5 py-0.5 text-[10px] font-mono h-auto"
                          >
                            {key}
                          </Badge>
                          {keyIndex < formatShortcut(shortcut).length - 1 && (
                            <span className="text-[10px] text-muted-foreground mx-0.5">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {groupIndex < Object.keys(groupedShortcuts).length - 1 && (
              <Separator className="my-1" />
            )}
          </React.Fragment>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};