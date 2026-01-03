/**
 * Lead Activity Panel Component
 * 
 * Unified activity feed and comments in a single chronological view.
 * Comment input is pinned at the bottom.
 */

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLeadComments, type LeadComment } from '@/hooks/useLeadComments';
import { useLeadActivities, type LeadActivity, type ActionData, type AssigneeProfile } from '@/hooks/useLeadActivities';
import { useLeadStages } from '@/hooks/useLeadStages';
import { useAuth } from '@/contexts/AuthContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { slideUpVariants, fadeReducedVariants, getVariants } from '@/lib/motion-variants';
import {
  Flag01,
  Edit02,
  Edit05,
  UserPlus01,
  UserMinus01,
  ArrowRight,
  Send01,
  XClose,
  Check,
  FilterLines,
  ArrowNarrowUp,
  ArrowNarrowDown,
  Tag01,
} from '@untitledui/icons';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { PriorityBadge } from '@/components/ui/priority-badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

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
  const { activities, assigneeProfiles, isLoading: activitiesLoading } = useLeadActivities(leadId);
  const { stages } = useLeadStages();
  const prefersReducedMotion = useReducedMotion();

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);
  const prevFeedLengthRef = useRef(0);

  const isLoading = commentsLoading || activitiesLoading;
  const itemVariants = getVariants(slideUpVariants, fadeReducedVariants, prefersReducedMotion);

  // Create stage lookup map
  const stageMap = useMemo(() => {
    return new Map(stages.map(s => [s.id, s]));
  }, [stages]);

  // Merge activities and comments into unified feed
  // Filter out comment_added activities since comments are shown separately
  const feedItems = useMemo<FeedItem[]>(() => {
    const filteredActivities = activities.filter(a => a.action_type !== 'comment_added');
    const items: FeedItem[] = [
      ...filteredActivities.map(a => ({ type: 'activity' as const, data: a, created_at: a.created_at })),
      ...comments.map(c => ({ type: 'comment' as const, data: c, created_at: c.created_at })),
    ];
    // Sort based on sortOrder
    return items.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [activities, comments, sortOrder]);

  // Track if user is at bottom of scroll
  const checkIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 50; // px from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Update wasAtBottom when user scrolls
  const handleScroll = useCallback(() => {
    wasAtBottomRef.current = checkIfAtBottom();
  }, [checkIfAtBottom]);

  // Auto-scroll when new items are added AND user was at bottom
  // For 'asc' (oldest first): scroll to bottom; for 'desc' (newest first): scroll to top
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Only scroll if we have new items and user was at the relevant edge
    if (feedItems.length > prevFeedLengthRef.current && wasAtBottomRef.current) {
      if (sortOrder === 'asc') {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTop = 0;
      }
    }
    prevFeedLengthRef.current = feedItems.length;
  }, [feedItems.length, sortOrder]);

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
        return <AriAgentsIcon size={12} />;
      case 'stage_changed':
        return <Flag01 className="h-3 w-3" />;
      case 'field_updated':
        return <Edit02 className="h-3 w-3" />;
      case 'assignee_added':
        return <UserPlus01 className="h-3 w-3" />;
      case 'assignee_removed':
        return <UserMinus01 className="h-3 w-3" />;
      case 'tag_added':
        return <Tag01 className="h-3 w-3" />;
      case 'tag_removed':
        return <Tag01 className="h-3 w-3" />;
      default:
        return <Edit02 className="h-3 w-3" />;
    }
  };

  // Get assignee display name from profiles map
  const getAssigneeDisplayName = (userId: string | undefined): string => {
    if (!userId) return 'Someone';
    return assigneeProfiles.get(userId)?.display_name || 'Someone';
  };

  // Render activity description
  const renderActivityDescription = (activity: LeadActivity) => {
    const data = (activity.action_data || {}) as ActionData;
    const userName = activity.profile?.display_name || 'Someone';

    switch (activity.action_type) {
      case 'created':
        return <span><span className="font-medium">Ari</span> created this lead</span>;

      case 'stage_changed':
        return (
          <span className="flex items-center gap-1 flex-wrap">
            <span className="font-medium">{userName}</span>
            <span>→</span>
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium"
              style={{ 
                backgroundColor: `${getStageColor(data.to_stage_id)}20`,
                color: getStageColor(data.to_stage_id),
              }}
            >
              {getStageName(data.to_stage_id)}
            </span>
          </span>
        );

      case 'status_changed':
        return (
          <span className="flex flex-col gap-0.5">
            <span>
              <span className="font-medium">{userName}</span>
              {' updated '}
              <span className="font-medium">Status</span>
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-2xs">
              <span className="capitalize">{data.from?.replace(/_/g, ' ')}</span>
              <ArrowRight className="h-2.5 w-2.5" />
              <span className="capitalize">{data.to?.replace(/_/g, ' ')}</span>
            </span>
          </span>
        );

      case 'field_updated':
        const fieldName = data.field?.replace(/_/g, ' ');
        const oldValue = data.from;
        const newValue = data.to;
        
        // Special handling for priority - show as badges
        if (data.field === 'priority') {
          return (
            <span className="flex flex-col gap-1">
              <span>
                <span className="font-medium">{userName}</span>
                {' updated '}
                <span className="font-medium">Priority</span>
              </span>
              <span className="flex items-center gap-1.5">
                {oldValue ? (
                  <PriorityBadge priority={oldValue} size="sm" />
                ) : (
                  <span className="text-2xs text-muted-foreground">none</span>
                )}
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                {newValue ? (
                  <PriorityBadge priority={newValue} size="sm" />
                ) : (
                  <span className="text-2xs text-muted-foreground">none</span>
                )}
              </span>
            </span>
          );
        }
        
        // Default text rendering for other fields
        return (
          <span className="flex flex-col gap-0.5">
            <span>
              <span className="font-medium">{userName}</span>
              {' updated '}
              <span className="font-medium capitalize">{fieldName}</span>
            </span>
            {(oldValue || newValue) && (
              <span className="text-muted-foreground flex items-center gap-1 text-2xs">
                <span className="line-through">{oldValue || 'empty'}</span>
                <ArrowRight className="h-2.5 w-2.5" />
                <span>{newValue || 'empty'}</span>
              </span>
            )}
          </span>
        );

      case 'assignee_added':
        const assignedUserName = getAssigneeDisplayName(data.user_id);
        return (
          <span>
            <span className="font-medium">{userName}</span>
            {' assigned '}
            <span className="font-medium">{assignedUserName}</span>
          </span>
        );

      case 'assignee_removed':
        const removedUserName = getAssigneeDisplayName(data.user_id);
        return (
          <span>
            <span className="font-medium">{userName}</span>
            {' unassigned '}
            <span className="font-medium">{removedUserName}</span>
          </span>
        );

      case 'tag_added':
        return (
          <span className="flex items-center gap-1 flex-wrap">
            <span className="font-medium">{userName}</span>
            <span>added tag</span>
            <Badge variant="secondary" className="text-2xs h-4">{data.tag}</Badge>
          </span>
        );

      case 'tag_removed':
        return (
          <span className="flex items-center gap-1 flex-wrap">
            <span className="font-medium">{userName}</span>
            <span>removed tag</span>
            <Badge variant="outline" className="text-2xs h-4 line-through opacity-60">{data.tag}</Badge>
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
      // Force scroll to bottom when user adds a comment
      wasAtBottomRef.current = true;
      await addComment(newComment.trim());
      setNewComment('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
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
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
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
    <div className="flex flex-col h-full min-h-0">
      {/* Header - white background */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b pr-12">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Activity</span>
          {feedItems.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {feedItems.length}
            </span>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton 
              variant="ghost" 
              size="icon-sm" 
              label={sortOrder === 'asc' ? 'Sorted oldest first' : 'Sorted newest first'}
            >
              <FilterLines className="h-4 w-4" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover z-50 space-y-1">
            <DropdownMenuItem onClick={() => setSortOrder('asc')} className={sortOrder === 'asc' ? 'bg-accent' : ''}>
              <ArrowNarrowUp className="h-4 w-4 mr-2" />
              Oldest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder('desc')} className={sortOrder === 'desc' ? 'bg-accent' : ''}>
              <ArrowNarrowDown className="h-4 w-4 mr-2" />
              Newest first
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Feed area with gray background - native scroll for reliability */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-muted/30"
      >
        <div className="px-4 pt-4 pb-2">
          {feedItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No activity yet
            </p>
          ) : (
            <div className="space-y-0">
              <AnimatePresence mode="popLayout" initial={false}>
              {feedItems.map((item, index) => {
                if (item.type === 'comment') {
                  const comment = item.data;
                  const isEditing = editingId === comment.id;
                  const isOwner = user?.id === comment.user_id;

                  return (
                    <motion.div
                      key={`comment-${comment.id}`}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="flex gap-2 py-2 group relative">
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
                                <Edit05 className="h-2 w-2" />
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
                              <Button size="sm" className="h-6 px-2 text-xs" onClick={() => handleUpdate(comment.id)} disabled={!editContent.trim()}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setEditingId(null); setEditContent(''); }}>
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
                    </motion.div>
                  );
                } else {
                  const activity = item.data;
                  const isSystemAction = activity.action_type === 'created';
                  
                  return (
                    <motion.div
                      key={`activity-${activity.id}`}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="flex gap-2 py-2 relative">
                      {/* Timeline line */}
                      {index < feedItems.length - 1 && (
                        <div className="absolute left-2.5 top-7 bottom-0 w-px bg-border" aria-hidden="true" />
                      )}
                      
                      {isSystemAction ? (
                        // Ari icon for system actions (created)
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <AriAgentsIcon size={12} className="text-primary" />
                        </div>
                      ) : activity.profile ? (
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
                    </motion.div>
                  );
                }
              })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Comment input - full width border */}
      <div className="px-4 py-3 border-t bg-background/50">
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
  );
}
