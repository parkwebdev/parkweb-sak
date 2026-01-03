/**
 * Lead Comments Component
 * 
 * Displays and manages comments on a lead.
 * Supports adding, editing, and deleting comments.
 */

import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { IconButton } from '@/components/ui/icon-button';
import { useLeadComments, type LeadComment } from '@/hooks/useLeadComments';
import { useAuth } from '@/contexts/AuthContext';
import { Send01, Edit02, Trash02, XClose, Check } from '@untitledui/icons';

interface LeadCommentsProps {
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

export function LeadComments({ leadId }: LeadCommentsProps) {
  const { user } = useAuth();
  const {
    comments,
    isLoading,
    addComment,
    updateComment,
    deleteComment,
    isAdding,
  } = useLeadComments(leadId);

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when editing
  useEffect(() => {
    if (editingId) {
      const comment = comments.find(c => c.id === editingId);
      if (comment) {
        setEditContent(comment.content);
      }
    }
  }, [editingId, comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    try {
      await addComment(newComment.trim());
      setNewComment('');
      textareaRef.current?.focus();
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
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to add one!
          </p>
        ) : (
          comments.map((comment: LeadComment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={comment.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(comment.profile?.display_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {comment.profile?.display_name || 'Unknown'}
                  </span>
                  <time className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </time>
                  
                  {/* Edit/Delete actions - only for own comments */}
                  {user?.id === comment.user_id && editingId !== comment.id && (
                    <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton
                        size="icon-sm"
                        variant="ghost"
                        label="Edit comment"
                        onClick={() => setEditingId(comment.id)}
                      >
                        <Edit02 className="h-3 w-3" />
                      </IconButton>
                      <IconButton
                        size="icon-sm"
                        variant="ghost"
                        label="Delete comment"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash02 className="h-3 w-3" />
                      </IconButton>
                    </div>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px] text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}
                      >
                        <XClose className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg px-3 py-2">
                    {comment.content}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New comment input */}
      <div className="pt-4 border-t mt-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Add a comment... (⌘+Enter to send)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
        </div>
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isAdding}
          >
            <Send01 className="h-4 w-4 mr-1.5" />
            {isAdding ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
