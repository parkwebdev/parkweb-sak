import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TakeoverBannerProps {
  agentName?: string;
  agentAvatar?: string;
}

export const TakeoverBanner = ({ agentName, agentAvatar }: TakeoverBannerProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-muted rounded-lg border border-border">
      {agentAvatar ? (
        <Avatar className="w-5 h-5">
          <AvatarImage src={agentAvatar} alt={agentName} />
          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
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
