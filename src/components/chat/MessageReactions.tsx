/**
 * @fileoverview Message reactions component with emoji picker.
 * Displays existing reactions and allows adding/removing reactions.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { FaceSmile, Plus } from '@untitledui/icons';
import { EmojiPicker, QuickEmojiPicker } from './EmojiPicker';

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  primaryColor: string;
  compact?: boolean;
  isUserMessage?: boolean;
}

export function MessageReactions({
  reactions,
  onAddReaction,
  onRemoveReaction,
  primaryColor,
  compact = false,
  isUserMessage = false,
}: MessageReactionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleReactionClick = (reaction: Reaction) => {
    if (reaction.userReacted) {
      onRemoveReaction(reaction.emoji);
    } else {
      onAddReaction(reaction.emoji);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji);
    if (existingReaction?.userReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setPickerOpen(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          size="sm"
          className={`h-6 px-2 text-xs gap-1 transition-all animate-scale-in ${
            reaction.userReacted ? 'bg-primary/10 border border-primary/30' : ''
          }`}
          onClick={() => handleReactionClick(reaction)}
          style={
            reaction.userReacted
              ? { borderColor: `${primaryColor}50`, backgroundColor: `${primaryColor}15` }
              : {}
          }
        >
          <span className="text-sm">{reaction.emoji}</span>
          {reaction.count > 1 && <span className="text-xs font-medium">{reaction.count}</span>}
        </Button>
      ))}

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            {compact ? (
              <FaceSmile className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Plus className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align={isUserMessage ? "end" : "start"}
            side="top"
            sideOffset={4}
            className="z-50 outline-none"
          >
            {compact ? (
              <QuickEmojiPicker onEmojiSelect={handleEmojiSelect} />
            ) : (
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                primaryColor={primaryColor}
              />
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </Popover>
    </div>
  );
};
