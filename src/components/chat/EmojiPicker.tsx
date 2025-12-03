import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  primaryColor: string;
}

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
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  primaryColor,
}) => {
  const [activeTab, setActiveTab] = useState('smileys');

  return (
    <div className="w-[320px] bg-background border rounded-lg shadow-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-8 h-12 bg-muted/50">
          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="text-xl data-[state=active]:bg-background"
              style={
                activeTab === key
                  ? { borderBottom: `2px solid ${primaryColor}` }
                  : {}
              }
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
          <TabsContent key={key} value={key} className="mt-0">
            <ScrollArea className="h-[280px] p-2">
              <div className="grid grid-cols-8 gap-1">
                {category.emojis.map((emoji, index) => (
                  <Button
                    key={`${emoji}-${index}`}
                    variant="ghost"
                    className="h-10 w-10 p-0 text-2xl hover:scale-125 transition-transform"
                    onClick={() => onEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface QuickEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const QuickEmojiPicker: React.FC<QuickEmojiPickerProps> = ({
  onEmojiSelect,
}) => {
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  return (
    <div className="flex items-center gap-1 px-3 py-1 bg-white shadow-lg border max-w-[180px] overflow-x-auto rounded-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="h-8 w-8 p-0 text-lg hover:scale-110 hover:bg-gray-100 transition-all flex-shrink-0 rounded-full flex items-center justify-center"
          onClick={() => onEmojiSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
