/**
 * WidgetVoiceInput Component
 * 
 * Lightweight voice recording UI for the widget.
 * CSS-only animations - NO motion/react dependency.
 * 
 * Visual parity with src/components/molecule-ui/voice-input.tsx
 * 
 * @module widget/components/WidgetVoiceInput
 */

import { cn } from '@/lib/utils';
import { XClose } from '../icons';

/**
 * Props for WidgetVoiceInput
 * Matches original VoiceInput interface exactly
 */
export interface WidgetVoiceInputProps {
  /** Whether currently recording (controlled) */
  isRecording: boolean;
  /** Current recording time in seconds */
  recordingTime: number;
  /** Called when stop button is clicked */
  onStop?: () => void;
  /** Called when cancel button is clicked */
  onCancel?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Format seconds to MM:SS display
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate random heights for frequency bars (deterministic per bar index)
 */
const getFreqHeights = (index: number): React.CSSProperties => {
  // Pseudo-random but consistent heights based on index
  const seed = (index * 7 + 3) % 10;
  return {
    '--freq-height-1': `${3 + seed}px`,
    '--freq-height-2': `${3 + ((seed * 2) % 12)}px`,
    '--freq-height-3': `${3 + ((seed + 5) % 8)}px`,
    '--freq-delay': `${index * 0.05}s`,
  } as React.CSSProperties;
};

/**
 * WidgetVoiceInput - CSS-only voice recording UI
 * 
 * Features:
 * - Cancel button (X icon)
 * - Animated stop button with rotating square
 * - Frequency visualization bars
 * - Timer display (MM:SS)
 * 
 * All animations use CSS keyframes instead of Framer Motion.
 */
export const WidgetVoiceInput = ({
  isRecording,
  recordingTime,
  onStop,
  onCancel,
  className,
}: WidgetVoiceInputProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 widget-voice-enter',
        className
      )}
    >
      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-input text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Cancel recording"
      >
        <XClose className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Main recording control */}
      <button
        type="button"
        className="flex cursor-pointer items-center justify-center rounded-full border border-input p-2 transition-all duration-300 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onStop}
        aria-label="Stop and send recording"
      >
        {/* Stop icon with rotation animation */}
        <div className="flex h-6 w-6 items-center justify-center">
          <div
            className="bg-destructive h-4 w-4 rounded-sm widget-stop-rotate"
            aria-hidden="true"
          />
        </div>

        {/* Expanded content when recording */}
        {isRecording && (
          <div className="flex items-center justify-center gap-2 widget-expand-content">
            {/* Frequency Animation - 12 bars */}
            <div className="flex items-center justify-center gap-0.5" aria-hidden="true">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-primary w-0.5 rounded-full widget-freq-bar"
                  style={getFreqHeights(i)}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-muted-foreground w-10 text-center text-xs tabular-nums">
              {formatTime(recordingTime)}
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default WidgetVoiceInput;
