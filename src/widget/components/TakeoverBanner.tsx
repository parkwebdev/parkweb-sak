/**
 * TakeoverBanner Component
 * 
 * Displays a notification banner when a team member takes over the conversation.
 * Shows the agent's avatar and name with personalized messaging.
 * 
 * @module widget/components/TakeoverBanner
 */

import { WidgetAvatar, WidgetAvatarImage, WidgetAvatarFallback } from '../ui';

/** Props for the TakeoverBanner component */
interface TakeoverBannerProps {
  /** Name of the team member who took over */
  agentName?: string;
  /** Avatar URL of the team member */
  agentAvatar?: string;
}

/**
 * Human takeover notification banner component.
 * 
 * @param props - Component props
 * @returns Banner element with agent info
 */
export const TakeoverBanner = ({ agentName, agentAvatar }: TakeoverBannerProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-muted rounded-lg border border-border">
      {agentAvatar ? (
        <WidgetAvatar className="w-5 h-5">
          <WidgetAvatarImage src={agentAvatar} alt={agentName} />
          <WidgetAvatarFallback className="text-2xs bg-muted text-muted-foreground">
            {(agentName || 'T')[0].toUpperCase()}
          </WidgetAvatarFallback>
        </WidgetAvatar>
      ) : null}
      <span className="text-xs text-foreground">
        You're now chatting with {agentName || 'a team member'}
      </span>
    </div>
  );
};
