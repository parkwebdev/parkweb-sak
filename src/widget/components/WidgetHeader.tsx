import { Button } from '@/components/ui/button';
import { X, Settings01, VolumeMax, VolumeX } from '@untitledui/icons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';

interface WidgetHeaderProps {
  title: string;
  primaryColor: string;
  onClose: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  showSettingsDropdown: boolean;
  onSettingsToggle: () => void;
}

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
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground">
          <ChatBubbleIcon className="h-6 w-6 text-background" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-1.5">
            <div className="relative flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse-slow" />
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
            <Settings01 className="h-4 w-4" />
          </Button>
          {showSettingsDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg p-2 z-50 min-w-[180px]">
              <button
                onClick={onSoundToggle}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                {soundEnabled ? (
                  <VolumeMax className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                <span>Sound {soundEnabled ? 'On' : 'Off'}</span>
              </button>
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
