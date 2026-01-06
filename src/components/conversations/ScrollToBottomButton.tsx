/**
 * Scroll to Bottom Button Component
 * 
 * Floating action button that appears when user scrolls up in message threads.
 * Provides quick navigation to the latest messages.
 * 
 * @component
 */

import { memo } from 'react';
import { ChevronDown } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScrollToBottomButtonProps {
  /** Whether the button should be visible */
  visible: boolean;
  /** Click handler to scroll to bottom */
  onClick: () => void;
  /** Optional className for positioning */
  className?: string;
}

export const ScrollToBottomButton = memo(function ScrollToBottomButton({
  visible,
  onClick,
  className,
}: ScrollToBottomButtonProps) {
  if (!visible) return null;

  return (
    <Button
      size="icon"
      variant="secondary"
      className={cn(
        "absolute bottom-4 right-4 rounded-full shadow-lg z-10 h-10 w-10",
        "bg-background/90 backdrop-blur-sm border border-border",
        "hover:bg-accent transition-all",
        className
      )}
      onClick={onClick}
      aria-label="Scroll to latest messages"
    >
      <ChevronDown size={20} aria-hidden="true" />
    </Button>
  );
});

export default ScrollToBottomButton;
