import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  primaryColor,
  compact = false,
  isUserMessage = false,
}) => {
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

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
    setShowQuickPicker(false);
    setShowFullPicker(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          size="sm"
          className={`h-6 px-2 text-xs gap-1 transition-all hover:scale-110 animate-scale-in ${
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
          <span className="text-xs font-medium">{reaction.count}</span>
        </Button>
      ))}

      {compact ? (
        <Popover open={showQuickPicker} onOpenChange={setShowQuickPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <FaceSmile className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-transparent border-none shadow-none rounded-full" 
            align={isUserMessage ? "end" : "start"}
            side="top"
          >
            <QuickEmojiPicker
              onEmojiSelect={handleEmojiSelect}
              primaryColor={primaryColor}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Popover open={showFullPicker} onOpenChange={setShowFullPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-accent"
            >
              <Plus className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              primaryColor={primaryColor}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
