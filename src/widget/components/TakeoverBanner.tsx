/**
 * TakeoverBanner Component
 * 
 * Displays a notification banner when a team member takes over the conversation.
 * Shows the agent's avatar and name with personalized messaging.
 * 
 * @module widget/components/TakeoverBanner
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
        <Avatar className="w-5 h-5">
          <AvatarImage src={agentAvatar} alt={agentName} />
          <AvatarFallback className="text-2xs bg-muted text-muted-foreground">
            {(agentName || 'T')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : null}
      <span className="text-xs text-foreground">
        You're now chatting with {agentName || 'a team member'}
      </span>
    </div>
  );
};
