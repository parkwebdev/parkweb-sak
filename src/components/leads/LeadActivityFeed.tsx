/**
 * Lead Activity Feed Component
 * 
 * Displays a chronological list of lead activities including
 * stage changes, field updates, and other tracked events.
 */

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeadActivities, type LeadActivity, type ActionData } from '@/hooks/useLeadActivities';
import { useLeadStages } from '@/hooks/useLeadStages';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Flag01,
  Edit02,
  UserPlus01,
  UserMinus01,
  MessageTextSquare02,
  Plus,
  ArrowRight,
} from '@untitledui/icons';

interface LeadActivityFeedProps {
  leadId: string;
}

// Get initials from name
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function LeadActivityFeed({ leadId }: LeadActivityFeedProps) {
  const { activities, isLoading } = useLeadActivities(leadId);
  const { stages } = useLeadStages();

  // Create stage lookup map
  const stageMap = useMemo(() => {
    return new Map(stages.map(s => [s.id, s]));
  }, [stages]);

  // Get stage name by ID
  const getStageName = (stageId: string | undefined): string => {
    if (!stageId) return 'None';
    return stageMap.get(stageId)?.name || 'Unknown';
  };

  // Get stage color by ID
  const getStageColor = (stageId: string | undefined): string => {
    if (!stageId) return '#6b7280';
    return stageMap.get(stageId)?.color || '#6b7280';
  };

  // Get icon for activity type
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Plus className="h-3.5 w-3.5" />;
      case 'stage_changed':
        return <Flag01 className="h-3.5 w-3.5" />;
      case 'field_updated':
        return <Edit02 className="h-3.5 w-3.5" />;
      case 'assignee_added':
        return <UserPlus01 className="h-3.5 w-3.5" />;
      case 'assignee_removed':
        return <UserMinus01 className="h-3.5 w-3.5" />;
      case 'comment_added':
        return <MessageTextSquare02 className="h-3.5 w-3.5" />;
      default:
        return <Edit02 className="h-3.5 w-3.5" />;
    }
  };

  // Render activity description
  const renderActivityDescription = (activity: LeadActivity) => {
    const data = (activity.action_data || {}) as ActionData;
    const userName = activity.profile?.display_name || 'Someone';

    switch (activity.action_type) {
      case 'created':
        return (
          <span>
            <span className="font-medium">{userName}</span> created this lead
          </span>
        );

      case 'stage_changed':
        return (
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium">{userName}</span>
            <span>moved to</span>
            <span 
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ 
                backgroundColor: `${getStageColor(data.to_stage_id)}20`,
                color: getStageColor(data.to_stage_id),
              }}
            >
              {getStageName(data.to_stage_id)}
            </span>
            {data.from_stage_id && (
              <>
                <span className="text-muted-foreground">from</span>
                <span 
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                  style={{ 
                    backgroundColor: `${getStageColor(data.from_stage_id)}15`,
                    color: getStageColor(data.from_stage_id),
                  }}
                >
                  {getStageName(data.from_stage_id)}
                </span>
              </>
            )}
          </span>
        );

      case 'field_updated':
        return (
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium">{userName}</span>
            <span>updated</span>
            <span className="font-medium capitalize">{data.field?.replace(/_/g, ' ')}</span>
            {data.from && data.to && (
              <>
                <span className="text-muted-foreground line-through text-xs">{data.from}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{data.to}</span>
              </>
            )}
          </span>
        );

      case 'comment_added':
        return (
          <span>
            <span className="font-medium">{userName}</span> added a comment
          </span>
        );

      default:
        return (
          <span>
            <span className="font-medium">{userName}</span> made a change
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, index) => (
        <div 
          key={activity.id} 
          className="flex gap-3 py-3 relative"
        >
          {/* Timeline line */}
          {index < activities.length - 1 && (
            <div 
              className="absolute left-3 top-9 bottom-0 w-px bg-border" 
              aria-hidden="true" 
            />
          )}
          
          {/* Avatar / Icon */}
          {activity.profile ? (
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={activity.profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xs">
                {getInitials(activity.profile.display_name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              {getActivityIcon(activity.action_type)}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm leading-relaxed">
              {renderActivityDescription(activity)}
            </div>
            <time className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
