import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User01,
  Mail01,
  Phone01,
  Globe01,
  Monitor01,
  Clock,
  Tag01,
  AlertCircle,
  File01,
  Plus,
  XClose,
  Building07,
  Link01,
  ChevronRight,
  ChevronLeft,
  MessageChatCircle,
} from '@untitledui/icons';
import { formatDistanceToNow, format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

// Channel icon component
const ChannelIcon: React.FC<{ channel: string; className?: string }> = ({ channel, className = "h-4 w-4" }) => {
  switch (channel) {
    case 'facebook':
      return (
        <svg className={cn(className, "text-[#1877F2]")} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg className={cn(className, "text-[#E4405F]")} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
        </svg>
      );
    case 'x':
      return (
        <svg className={cn(className, "text-foreground")} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    default:
      return <MessageChatCircle className={cn(className, "text-muted-foreground")} />;
  }
};

// Get channel label
const getChannelLabel = (channel: string): string => {
  switch (channel) {
    case 'facebook': return 'Facebook Messenger';
    case 'instagram': return 'Instagram DM';
    case 'x': return 'X (Twitter) DM';
    default: return 'Chat Widget';
  }
};

interface ConversationMetadata {
  lead_id?: string;
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  lead_company?: string;
  custom_fields?: Record<string, any>;
  ip_address?: string;
  country?: string;
  city?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  referrer_url?: string;
  session_started_at?: string;
  first_message_at?: string;
  messages_count?: number;
  tags?: string[];
  priority?: 'not_set' | 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  notes?: string;
}

interface ConversationMetadataPanelProps {
  conversation: Conversation;
  onUpdateMetadata: (conversationId: string, metadata: Partial<ConversationMetadata>) => Promise<void>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const priorityColors: Record<string, string> = {
  not_set: 'bg-muted text-muted-foreground',
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-primary/10 text-primary',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

const PRESET_TAGS = [
  'VIP', 'Follow-up', 'Bug Report', 'Feature Request', 'Billing', 
  'Technical', 'Sales', 'Support', 'Urgent', 'Resolved'
];

export const ConversationMetadataPanel: React.FC<ConversationMetadataPanelProps> = ({
  conversation,
  onUpdateMetadata,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const metadata = (conversation.metadata || {}) as ConversationMetadata;
  const [newTag, setNewTag] = useState('');
  const [notes, setNotes] = useState(metadata.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTag = async (tag: string) => {
    if (!tag.trim()) return;
    const currentTags = metadata.tags || [];
    if (currentTags.includes(tag.trim())) return;
    
    setIsSaving(true);
    try {
      await onUpdateMetadata(conversation.id, {
        ...metadata,
        tags: [...currentTags, tag.trim()],
      });
    } finally {
      setIsSaving(false);
      setNewTag('');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const currentTags = metadata.tags || [];
    setIsSaving(true);
    try {
      await onUpdateMetadata(conversation.id, {
        ...metadata,
        tags: currentTags.filter(t => t !== tagToRemove),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriorityChange = async (priority: string) => {
    setIsSaving(true);
    try {
      await onUpdateMetadata(conversation.id, {
        ...metadata,
        priority: priority as ConversationMetadata['priority'],
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onUpdateMetadata(conversation.id, {
        ...metadata,
        notes,
      });
      setIsEditingNotes(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getDeviceIcon = () => {
    switch (metadata.device_type) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      default:
        return '💻';
    }
  };

  return (
    <div 
      className={cn(
        "border-l bg-background flex flex-col h-full min-h-0 transition-all duration-200 ease-in-out overflow-x-hidden",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      {/* Header - always visible */}
      <div className="px-4 py-4 border-b flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <h3 className="font-semibold text-sm">Conversation Details</h3>
        )}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 w-7 p-0", isCollapsed && "mx-auto")}
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Content - hidden when collapsed via overflow + opacity */}
      <div 
        className={cn(
          "flex-1 min-h-0 overflow-y-auto transition-opacity duration-200",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}
      >
        <div className="p-4 space-y-6">
            {/* Contact Info */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Contact Info
              </h4>
              <div className="space-y-2.5">
                {metadata.lead_name && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <User01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{metadata.lead_name}</span>
                  </div>
                )}
                {metadata.lead_email && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{metadata.lead_email}</span>
                  </div>
                )}
                {metadata.lead_phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{metadata.lead_phone}</span>
                  </div>
                )}
                {metadata.lead_company && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Building07 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{metadata.lead_company}</span>
                  </div>
                )}
                {!metadata.lead_name && !metadata.lead_email && (
                  <p className="text-sm text-muted-foreground italic">No contact info</p>
                )}
              </div>

              {/* Custom Fields */}
              {metadata.custom_fields && Object.keys(metadata.custom_fields).length > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed space-y-2">
                  {Object.entries(metadata.custom_fields).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2.5 text-sm">
                      <File01 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground">{key}:</span>{' '}
                        <span className="break-words">{String(value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Session Info */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Session Info
              </h4>
              <div className="space-y-2.5">
                {/* Channel */}
                <div className="flex items-center gap-2.5 text-sm">
                  <ChannelIcon channel={conversation.channel || 'widget'} />
                  <span>{getChannelLabel(conversation.channel || 'widget')}</span>
                </div>
                {metadata.country && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Globe01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>
                      {metadata.city ? `${metadata.city}, ` : ''}{metadata.country}
                    </span>
                  </div>
                )}
                {metadata.ip_address && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="text-muted-foreground text-xs w-4 text-center">IP</span>
                    <span className="font-mono text-xs">{metadata.ip_address}</span>
                  </div>
                )}
                {metadata.device_type && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Monitor01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="capitalize">
                      {getDeviceIcon()} {metadata.device_type}
                      {metadata.browser && ` • ${metadata.browser}`}
                    </span>
                  </div>
                )}
                {metadata.os && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="text-muted-foreground text-xs w-4 text-center">OS</span>
                    <span>{metadata.os}</span>
                  </div>
                )}
                {metadata.referrer_url && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <Link01 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="truncate text-xs text-muted-foreground" title={metadata.referrer_url}>
                      {metadata.referrer_url}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>
                    Started {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Priority */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Priority
              </h4>
              <Select
                value={metadata.priority || 'not_set'}
                onValueChange={handlePriorityChange}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_set">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted border border-muted-foreground/30" />
                      Not set
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Normal
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Tags */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Tags
              </h4>
              
              {/* Existing Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(metadata.tags || []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                      disabled={isSaving}
                    >
                      <XClose className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!metadata.tags || metadata.tags.length === 0) && (
                  <span className="text-sm text-muted-foreground italic">No tags</span>
                )}
              </div>

              {/* Add Tag */}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(newTag);
                    }
                  }}
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => handleAddTag(newTag)}
                  disabled={isSaving || !newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Preset Tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                {PRESET_TAGS.filter(t => !(metadata.tags || []).includes(t)).slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    disabled={isSaving}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Internal Notes
                </h4>
                {!isEditingNotes && metadata.notes && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>

              {isEditingNotes || !metadata.notes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this conversation..."
                    className="min-h-[80px] text-sm resize-none"
                    disabled={isSaving}
                  />
                  <div className="flex justify-end gap-2">
                    {metadata.notes && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNotes(metadata.notes || '');
                          setIsEditingNotes(false);
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={isSaving}
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3">
                  {metadata.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};
