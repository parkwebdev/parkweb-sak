/**
 * Lead Activity Panel Component
 * 
 * Unified activity feed and comments in a single chronological view.
 * Comment input is pinned at the bottom.
 */

import { useMemo, useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IconButton } from '@/components/ui/icon-button';
import { useLeadComments, type LeadComment } from '@/hooks/useLeadComments';
import { useLeadActivities, type LeadActivity, type ActionData } from '@/hooks/useLeadActivities';
import { useLeadStages } from '@/hooks/useLeadStages';
import { useAuth } from '@/contexts/AuthContext';
import {
  Flag01,
  Edit02,
  UserPlus01,
  UserMinus01,
  Plus,
  ArrowRight,
  Send01,
  Trash02,
  XClose,
  Check,
  SearchMd,
  FilterLines,
} from '@untitledui/icons';

interface LeadActivityPanelProps {
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

type FeedItem = 
  | { type: 'activity'; data: LeadActivity; created_at: string }
  | { type: 'comment'; data: LeadComment; created_at: string };

export function LeadActivityPanel({ leadId }: LeadActivityPanelProps) {
  const { user } = useAuth();
  const { comments, isLoading: commentsLoading, addComment, updateComment, deleteComment, isAdding } = useLeadComments(leadId);
  const { activities, isLoading: activitiesLoading } = useLeadActivities(leadId);
  const { stages } = useLeadStages();

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = commentsLoading || activitiesLoading;

  // Create stage lookup map
  const stageMap = useMemo(() => {
    return new Map(stages.map(s => [s.id, s]));
  }, [stages]);

  // Merge activities and comments into unified feed
  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...activities.map(a => ({ type: 'activity' as const, data: a, created_at: a.created_at })),
      ...comments.map(c => ({ type: 'comment' as const, data: c, created_at: c.created_at })),
    ];
    // Sort by created_at descending (newest first)
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activities, comments]);

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
        return <Plus className="h-3 w-3" />;
      case 'stage_changed':
        return <Flag01 className="h-3 w-3" />;
      case 'field_updated':
        return <Edit02 className="h-3 w-3" />;
      case 'assignee_added':
        return <UserPlus01 className="h-3 w-3" />;
      case 'assignee_removed':
        return <UserMinus01 className="h-3 w-3" />;
      default:
        return <Edit02 className="h-3 w-3" />;
    }
  };

  // Render activity description
  const renderActivityDescription = (activity: LeadActivity) => {
    const data = (activity.action_data || {}) as ActionData;
    const userName = activity.profile?.display_name || 'Someone';

    switch (activity.action_type) {
      case 'created':
        return <span><span className="font-medium">{userName}</span> created this lead</span>;

      case 'stage_changed':
        return (
          <span className="flex items-center gap-1 flex-wrap">
            <span className="font-medium">{userName}</span>
            <span>→</span>
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ 
                backgroundColor: `${getStageColor(data.to_stage_id)}20`,
                color: getStageColor(data.to_stage_id),
              }}
            >
              {getStageName(data.to_stage_id)}
            </span>
          </span>
        );

      case 'field_updated':
        return (
          <span className="flex items-center gap-1 flex-wrap">
            <span className="font-medium">{userName}</span>
            <span>updated</span>
            <span className="font-medium capitalize">{data.field?.replace(/_/g, ' ')}</span>
          </span>
        );

      default:
        return <span><span className="font-medium">{userName}</span> made a change</span>;
    }
  };

  // Comment handlers
  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment(newComment.trim());
      setNewComment('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateComment({ commentId, content: editContent.trim() });
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startEditing = (comment: LeadComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="text-sm font-medium pb-3">Activity</div>
        <div className="flex-1 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - white background */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Activity</span>
          {feedItems.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {feedItems.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton size="icon-sm" variant="ghost" label="Search activity">
            <SearchMd className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton size="icon-sm" variant="ghost" label="Filter activity">
            <FilterLines className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      {/* Feed area with padding */}
      <div className="flex-1 flex flex-col min-h-0 p-4">
        {/* Unified feed - scrollable */}
        <ScrollArea className="flex-1 min-h-0">
          {feedItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No activity yet
            </p>
          ) : (
            <div className="space-y-0">
              {feedItems.map((item, index) => {
                if (item.type === 'comment') {
                  const comment = item.data;
                  const isEditing = editingId === comment.id;
                  const isOwner = user?.id === comment.user_id;

                  return (
                    <div key={`comment-${comment.id}`} className="flex gap-2 py-2 group relative">
                      {/* Timeline line */}
                      {index < feedItems.length - 1 && (
                        <div className="absolute left-2.5 top-7 bottom-0 w-px bg-border" aria-hidden="true" />
                      )}
                      
                      <Avatar className="h-5 w-5 flex-shrink-0">
                        <AvatarImage src={comment.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-2xs">
                          {getInitials(comment.profile?.display_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium truncate">
                            {comment.profile?.display_name || 'Unknown'}
                          </span>
                          <time className="text-2xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </time>
                          
                          {isOwner && !isEditing && (
                            <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <IconButton
                                size="icon-sm"
                                variant="ghost"
                                label="Edit"
                                onClick={() => startEditing(comment)}
                              >
                                <Edit02 className="h-2.5 w-2.5" />
                              </IconButton>
                              <IconButton
                                size="icon-sm"
                                variant="ghost"
                                label="Delete"
                                onClick={() => handleDelete(comment.id)}
                              >
                                <Trash02 className="h-2.5 w-2.5" />
                              </IconButton>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-1.5">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[50px] text-xs"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => handleUpdate(comment.id)} disabled={!editContent.trim()}>
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditContent(''); }}>
                                <XClose className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs whitespace-pre-wrap bg-background rounded px-2 py-1.5">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  const activity = item.data;
                  return (
                    <div key={`activity-${activity.id}`} className="flex gap-2 py-2 relative">
                      {/* Timeline line */}
                      {index < feedItems.length - 1 && (
                        <div className="absolute left-2.5 top-7 bottom-0 w-px bg-border" aria-hidden="true" />
                      )}
                      
                      {activity.profile ? (
                        <Avatar className="h-5 w-5 flex-shrink-0">
                          <AvatarImage src={activity.profile.avatar_url || undefined} />
                          <AvatarFallback className="text-2xs">
                            {getInitials(activity.profile.display_name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {getActivityIcon(activity.action_type)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-xs leading-relaxed">
                          {renderActivityDescription(activity)}
                        </div>
                        <time className="text-2xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </ScrollArea>

        {/* Comment input - inline send button */}
        <div className="pt-3 mt-auto border-t">
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-9 h-9 text-xs bg-background border-muted"
            />
            <IconButton
              size="icon-sm"
              variant="ghost"
              label="Send comment"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={handleSubmit}
              disabled={!newComment.trim() || isAdding}
            >
              <Send01 className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
