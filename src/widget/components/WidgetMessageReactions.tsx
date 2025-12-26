/**
 * Widget Message Reactions Component
 * 
 * Lightweight message reactions with CSS-only popover.
 * No Radix UI dependencies.
 * 
 * @module widget/components/WidgetMessageReactions
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FaceSmile, Plus } from '@/widget/icons';
import { WidgetEmojiPicker, WidgetQuickEmojiPicker } from './WidgetEmojiPicker';

// ============================================================================
// Types
// ============================================================================

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface WidgetMessageReactionsProps {
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  primaryColor: string;
  compact?: boolean;
  isUserMessage?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function WidgetMessageReactions({
  reactions,
  onAddReaction,
  onRemoveReaction,
  primaryColor,
  compact = false,
  isUserMessage = false,
}: WidgetMessageReactionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle reaction toggle
  const handleReactionClick = (reaction: Reaction) => {
    if (reaction.userReacted) {
      onRemoveReaction(reaction.emoji);
    } else {
      onAddReaction(reaction.emoji);
    }
  };

  // Handle emoji selection from picker
  const handleEmojiSelect = (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji);
    if (existingReaction?.userReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setPickerOpen(false);
  };

  // Click outside detection
  useEffect(() => {
    if (!pickerOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  // Escape key handling
  useEffect(() => {
    if (!pickerOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPickerOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [pickerOpen]);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing Reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => handleReactionClick(reaction)}
          className={cn(
            "h-6 px-2 text-xs gap-1 rounded-full flex items-center transition-all border",
            "hover:bg-accent",
            reaction.userReacted ? "border-primary/30 bg-primary/10" : "border-transparent"
          )}
          aria-label={`${reaction.emoji} reaction, ${reaction.count} ${reaction.count === 1 ? 'reaction' : 'reactions'}${reaction.userReacted ? ', you reacted' : ''}`}
          aria-pressed={reaction.userReacted}
        >
          <span className="text-sm">{reaction.emoji}</span>
          {reaction.count > 1 && <span className="text-xs font-medium">{reaction.count}</span>}
        </button>
      ))}

      {/* Add Reaction Button with CSS Popover */}
      <div ref={containerRef} className="widget-emoji-popover-container">
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-accent transition-colors"
          aria-label="Add reaction"
          aria-expanded={pickerOpen}
          aria-haspopup="true"
        >
          {compact ? (
            <FaceSmile size={12} className="text-muted-foreground" />
          ) : (
            <Plus size={12} className="text-muted-foreground" />
          )}
        </button>

        {/* CSS-only Popover */}
        <div 
          className={cn(
            "widget-emoji-picker",
            isUserMessage ? "right-0" : "left-0"
          )}
          data-open={pickerOpen}
          role="dialog"
          aria-label="Emoji picker"
        >
          {compact ? (
            <WidgetQuickEmojiPicker onEmojiSelect={handleEmojiSelect} />
          ) : (
            <WidgetEmojiPicker
              onEmojiSelect={handleEmojiSelect}
              primaryColor={primaryColor}
            />
          )}
        </div>
      </div>
    </div>
  );
};
