import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TakeoverBannerProps {
  agentName?: string;
  agentAvatar?: string;
}

export const TakeoverBanner = ({ agentName, agentAvatar }: TakeoverBannerProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
      {agentAvatar ? (
        <Avatar className="w-5 h-5">
          <AvatarImage src={agentAvatar} alt={agentName} />
          <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600">
            {(agentName || 'T')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : null}
      <span className="text-xs text-blue-700">
        You're now chatting with {agentName || 'a team member'}
      </span>
    </div>
  );
};
