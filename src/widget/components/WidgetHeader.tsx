/**
 * WidgetHeader Component
 * 
 * Header bar for the widget panel displaying agent name, online status,
 * sound settings dropdown, and close button.
 * 
 * @module widget/components/WidgetHeader
 */

import { Button } from '@/components/ui/button';
import { X, VolumeMax, VolumeX } from '@untitledui/icons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';

/** Custom sliders icon for settings button */
const SlidersIcon = ({ className }: { className?: string }) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M3 8L15 8M15 8C15 9.65686 16.3431 11 18 11C19.6569 11 21 9.65685 21 8C21 6.34315 19.6569 5 18 5C16.3431 5 15 6.34315 15 8ZM9 16L21 16M9 16C9 17.6569 7.65685 19 6 19C4.34315 19 3 17.6569 3 16C3 14.3431 4.34315 13 6 13C7.65685 13 9 14.3431 9 16Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Small CSS-only toggle switch for settings */
const SmallToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`
      relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full 
      transition-colors duration-200 ease-in-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      ${checked ? 'bg-success' : 'bg-input'}
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-3 w-3 rounded-full bg-background shadow-sm
        ring-0 transition-transform duration-200 ease-in-out
        ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}
        mt-0.5
      `}
    />
  </button>
);

/** Props for the WidgetHeader component */
interface WidgetHeaderProps {
  /** Agent name to display */
  title: string;
  /** Primary brand color */
  primaryColor: string;
  /** Close button click handler */
  onClose: () => void;
  /** Whether sound notifications are enabled */
  soundEnabled: boolean;
  /** Sound toggle handler */
  onSoundToggle: () => void;
  /** Whether settings dropdown is visible */
  showSettingsDropdown: boolean;
  /** Settings button click handler */
  onSettingsToggle: () => void;
}

/**
 * Widget header component with agent info and controls.
 * 
 * @param props - Component props
 * @returns Header element with agent info, settings, and close button
 */
export const WidgetHeader = ({
  title,
  primaryColor,
  onClose,
  soundEnabled,
  onSoundToggle,
  showSettingsDropdown,
  onSettingsToggle,
}: WidgetHeaderProps) => {
  return (
    <div className="p-4 flex items-center justify-between relative bg-background border-b">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
          <ChatBubbleIcon className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-1.5">
            <div className="relative flex items-center">
              <div className="w-2 h-2 bg-success rounded-full" />
              <div className="absolute w-2 h-2 bg-success rounded-full animate-pulse-slow" />
            </div>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 relative">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground hover:bg-transparent h-8 w-8" 
            onClick={onSettingsToggle}
          >
            <SlidersIcon className="h-4 w-4" />
          </Button>
          {showSettingsDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg p-3 z-50 min-w-[160px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <VolumeMax className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Sound</span>
                </div>
                <SmallToggle checked={soundEnabled} onChange={onSoundToggle} />
              </div>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-transparent h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
