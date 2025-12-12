/**
 * @fileoverview Quick emoji picker button component.
 * Provides a popover with frequently used emojis for quick selection.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FaceSmile } from '@untitledui/icons';

interface QuickEmojiButtonProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = ['😊', '👍', '❤️', '😂', '🎉', '👋', '🙏', '✨'];

export const QuickEmojiButton: React.FC<QuickEmojiButtonProps> = ({
  onEmojiSelect,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-9 w-9 shrink-0"
          aria-label="Add emoji"
        >
          <FaceSmile size={18} className="text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2" 
        side="top" 
        align="start"
        sideOffset={8}
      >
        <div className="flex gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="text-xl p-1.5 hover:bg-muted rounded transition-transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
