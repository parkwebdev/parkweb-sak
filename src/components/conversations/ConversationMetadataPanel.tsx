import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@untitledui/icons';
import { formatDistanceToNow, format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
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
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  notes?: string;
}

interface ConversationMetadataPanelProps {
  conversation: Conversation;
  onUpdateMetadata: (conversationId: string, metadata: Partial<ConversationMetadata>) => Promise<void>;
}

const priorityColors: Record<string, string> = {
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
    <div className="w-80 border-l bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Conversation Details</h3>
      </div>

      <ScrollArea className="flex-1">
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
              value={metadata.priority || 'normal'}
              onValueChange={handlePriorityChange}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
      </ScrollArea>
    </div>
  );
};

