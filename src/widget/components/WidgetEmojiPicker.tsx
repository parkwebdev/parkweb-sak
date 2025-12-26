/**
 * Widget Emoji Picker Components
 * 
 * Lightweight emoji picker without Radix UI dependencies.
 * Exports two components:
 * - WidgetEmojiPicker: Full tabbed picker with scroll area
 * - WidgetQuickEmojiPicker: Simplified single-row picker
 * 
 * @module widget/components/WidgetEmojiPicker
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Emoji Categories Data
// ============================================================================

const EMOJI_CATEGORIES = {
  smileys: {
    label: '😊',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱'],
  },
  gestures: {
    label: '👍',
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪'],
  },
  hearts: {
    label: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  },
  animals: {
    label: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈'],
  },
  food: {
    label: '🍕',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧈', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥖', '🥨', '🥯', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🫔', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜'],
  },
  activities: {
    label: '⚽',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️'],
  },
  travel: {
    label: '✈️',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢'],
  },
  objects: {
    label: '💡',
    emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳'],
  },
} as const;

type CategoryKey = keyof typeof EMOJI_CATEGORIES;

// ============================================================================
// Quick Emoji Picker (Single Row)
// ============================================================================

interface WidgetQuickEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export function WidgetQuickEmojiPicker({
  onEmojiSelect,
}: WidgetQuickEmojiPickerProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-1 bg-popover border border-border shadow-lg max-w-[180px] overflow-x-auto rounded-full">
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="h-8 w-8 p-0 text-lg hover:scale-110 transition-transform duration-150 flex-shrink-0 rounded-full flex items-center justify-center"
          onClick={() => onEmojiSelect(emoji)}
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Full Emoji Picker (Tabbed with Scroll)
// ============================================================================

interface WidgetEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  primaryColor: string;
}

export function WidgetEmojiPicker({
  onEmojiSelect,
  primaryColor,
}: WidgetEmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<CategoryKey>('smileys');

  return (
    <div className="w-[320px] bg-background border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Tab Bar - CSS-only, no Radix */}
      <div className="w-full grid grid-cols-8 h-12 bg-muted/50">
        {(Object.entries(EMOJI_CATEGORIES) as [CategoryKey, typeof EMOJI_CATEGORIES[CategoryKey]][]).map(([key, category]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "text-xl flex items-center justify-center transition-colors",
              activeTab === key && "bg-background"
            )}
            style={activeTab === key ? { borderBottom: `2px solid ${primaryColor}` } : {}}
            aria-selected={activeTab === key}
            role="tab"
            aria-label={`${key} emojis`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Tab Content - CSS-only scroll area, no Radix */}
      <div className="widget-emoji-scroll">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              className="h-10 w-10 p-0 text-2xl hover:scale-125 transition-transform duration-150 rounded flex items-center justify-center hover:bg-accent"
              onClick={() => onEmojiSelect(emoji)}
              aria-label={`Select ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
