/**
 * @fileoverview Lead details sheet with editable fields and auto-save.
 * Displays contact info, custom data, timeline, session details from conversation, and related conversation link.
 * Sheet is always mounted to ensure proper open/close animations.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash02, LinkExternal02, InfoCircle, Globe01, Monitor01, Clock, Browser, Link01, Plus, XClose } from '@untitledui/icons';
import { PHONE_FIELD_KEYS, EXCLUDED_LEAD_FIELDS, isConsentFieldKey, getPhoneFromLeadData } from '@/lib/field-keys';
import DOMPurify from 'isomorphic-dompurify';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { SkeletonLeadDetails } from '@/components/ui/page-skeleton';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import type { Tables, Enums, Json } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { LeadAssigneePicker } from './LeadAssigneePicker';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLeadAssignees } from '@/hooks/useLeadAssignees';
import { LeadActivityPanel } from './LeadActivityPanel';

interface LeadDetailsSheetProps {
  lead: Tables<'leads'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Tables<'leads'>>) => void;
  /** If undefined, delete button will be hidden (user lacks permission) */
  onDelete?: (id: string) => void;
}

// Priority options with semantic colors
const PRIORITY_OPTIONS = [
  { value: 'none', label: 'Not Set', color: 'bg-muted' },
  { value: 'low', label: 'Low', color: 'bg-info' },
  { value: 'normal', label: 'Normal', color: 'bg-success' },
  { value: 'high', label: 'High', color: 'bg-warning' },
  { value: 'urgent', label: 'Urgent', color: 'bg-destructive' },
];

// Preset tags for quick selection
const PRESET_TAGS = ['VIP', 'Follow-up', 'Hot Lead', 'Cold Lead', 'Needs Review', 'Bug Report'];

// Helper to convert country code to emoji flag
const countryCodeToFlag = (code: string): string => {
  if (!code || code.length !== 2) return '';
  return code
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

// Country name to code mapping
const getCountryCode = (countryName: string | undefined): string | null => {
  if (!countryName) return null;
  const countryMap: Record<string, string> = {
    'United States': 'US', 'USA': 'US', 'US': 'US',
    'Canada': 'CA', 'Mexico': 'MX',
    'United Kingdom': 'GB', 'UK': 'GB', 'Great Britain': 'GB',
    'Germany': 'DE', 'France': 'FR', 'Spain': 'ES', 'Italy': 'IT',
    'Netherlands': 'NL', 'Belgium': 'BE', 'Switzerland': 'CH',
    'Australia': 'AU', 'New Zealand': 'NZ',
    'Japan': 'JP', 'China': 'CN', 'South Korea': 'KR',
    'India': 'IN', 'Brazil': 'BR', 'Argentina': 'AR',
  };
  return countryMap[countryName] || countryMap[countryName.trim()] || null;
};

// Strip URL to just domain
const stripUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.hostname + parsed.pathname;
  } catch {
    return url;
  }
};

export const LeadDetailsSheet = ({
  lead,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: LeadDetailsSheetProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editedLead, setEditedLead] = useState<Partial<Tables<'leads'>>>({});
  const [editedCustomData, setEditedCustomData] = useState<Record<string, unknown>>({});
  const [savedField, setSavedField] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for Priority, Tags, Notes
  const [newTag, setNewTag] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Lead assignees hook for multi-assignee support
  const { getAssignees, addAssignee, removeAssignee } = useLeadAssignees();

  // Fetch conversation data if lead has a conversation_id
  const { data: conversation, refetch: refetchConversation } = useQuery({
    queryKey: ['conversation-for-lead', lead?.conversation_id],
    queryFn: async () => {
      if (!lead?.conversation_id) return null;
      const { data, error } = await supabase
        .from('conversations')
        .select('id, metadata, created_at, channel')
        .eq('id', lead.conversation_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!lead?.conversation_id,
    staleTime: 30_000,
  });

  // Refetch conversation data when sheet opens to ensure fresh data
  useEffect(() => {
    if (open && lead?.conversation_id) {
      refetchConversation();
    }
  }, [open, lead?.conversation_id, refetchConversation]);

  // Real-time subscription for conversation metadata changes
  useEffect(() => {
    if (!open || !lead?.conversation_id) return;

    const channel = supabase
      .channel(`conversation-metadata-${lead.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${lead.conversation_id}`,
        },
        (payload) => {
          // Update local cache with new metadata
          if (payload.new) {
            queryClient.setQueryData(
              ['conversation-for-lead', lead.conversation_id],
              (old: { id: string; metadata: ConversationMetadata; created_at: string; channel: string | null } | null) => 
                old ? { ...old, ...payload.new } : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, lead?.conversation_id, queryClient]);

  const conversationMetadata = (conversation?.metadata || {}) as ConversationMetadata;

  // Initialize notes from conversation metadata
  useEffect(() => {
    if (conversation?.metadata) {
      const meta = conversation.metadata as ConversationMetadata;
      setInternalNotes(meta.notes || '');
    }
  }, [conversation?.id, conversation?.metadata]);

  // Reset edited state when lead changes
  useEffect(() => {
    setEditedLead({});
    setEditedCustomData({});
    setSavedField(null);
    setNewTag('');
  }, [lead?.id]);

  // Track which field was last edited
  const lastEditedFieldRef = useRef<string | null>(null);

  // Auto-save with debounce
  const performAutoSave = useCallback(() => {
    if (!lead) return;
    
    const hasLeadChanges = Object.keys(editedLead).length > 0;
    const hasCustomDataChanges = Object.keys(editedCustomData).length > 0;
    
    if (!hasLeadChanges && !hasCustomDataChanges) return;

    const currentData = (lead.data || {}) as Record<string, unknown>;
    const mergedData = { ...currentData, ...editedCustomData };
    
    const updates: Partial<Tables<'leads'>> = {
      ...editedLead,
      ...(hasCustomDataChanges ? { data: mergedData as Json } : {}),
    };
    
    onUpdate(lead.id, updates);
    setEditedLead({});
    setEditedCustomData({});
    
    // Show saved indicator under the last edited field
    if (lastEditedFieldRef.current) {
      setSavedField(lastEditedFieldRef.current);
      setTimeout(() => setSavedField(null), 2000);
    }
  }, [lead, editedLead, editedCustomData, onUpdate]);

  // Debounced auto-save effect
  useEffect(() => {
    const hasChanges = Object.keys(editedLead).length > 0 || Object.keys(editedCustomData).length > 0;
    
    if (!hasChanges) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 800);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editedLead, editedCustomData, performAutoSave]);

  // Get phone value: prioritize dedicated column, fallback to data JSONB for legacy leads
  const phoneValue = useMemo(() => {
    if (!lead) return '';
    return getPhoneFromLeadData(lead.phone, lead.data as Record<string, unknown>);
  }, [lead]);

  // Get custom fields from lead.data (excluding internal tracking fields, name fields, and phone fields)
  const customFields = useMemo(() => {
    if (!lead) return [];
    const data = (lead.data || {}) as Record<string, unknown>;
    return Object.entries(data).filter(([key]) => {
      // Exclude known internal fields
      if (EXCLUDED_LEAD_FIELDS.includes(key as typeof EXCLUDED_LEAD_FIELDS[number])) return false;
      // Exclude _content fields (internal rich text storage for checkboxes)
      if (key.endsWith('_content')) return false;
      return true;
    });
  }, [lead]);
  
  const handleDelete = () => {
    if (!lead || !onDelete) return;
    onDelete(lead.id);
  };

  const handleViewConversation = () => {
    if (lead?.conversation_id) {
      onOpenChange(false);
      navigate(`/conversations?id=${lead.conversation_id}`);
    }
  };

  // Update conversation metadata (for priority, tags, notes)
  const updateConversationMetadata = useCallback(async (
    updates: Partial<Pick<ConversationMetadata, 'priority' | 'tags' | 'notes'>>,
    fieldName: string
  ) => {
    if (!lead?.conversation_id || !conversation) return;

    const currentMetadata = (conversation.metadata || {}) as ConversationMetadata;
    const newMetadata = { ...currentMetadata, ...updates };

    const { error } = await supabase
      .from('conversations')
      .update({ metadata: newMetadata as Json })
      .eq('id', lead.conversation_id);

    if (!error) {
      // Update local cache
      queryClient.setQueryData(['conversation-for-lead', lead.conversation_id], {
        ...conversation,
        metadata: newMetadata,
      });
      // Invalidate conversations list for sync
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Show saved indicator
      setSavedField(fieldName);
      setTimeout(() => setSavedField(null), 2000);
    }
  }, [lead?.conversation_id, conversation, queryClient]);

  // Handle priority change
  const handlePriorityChange = useCallback((value: string) => {
    const priority = value === 'none' ? undefined : (value as ConversationMetadata['priority']);
    updateConversationMetadata({ priority }, 'priority');
  }, [updateConversationMetadata]);

  // Handle adding a tag
  const handleAddTag = useCallback((tag: string) => {
    if (!tag.trim()) return;
    const currentTags = conversationMetadata.tags || [];
    if (currentTags.includes(tag.trim())) return;
    updateConversationMetadata({ tags: [...currentTags, tag.trim()] }, 'tags');
    setNewTag('');
  }, [conversationMetadata.tags, updateConversationMetadata]);

  // Handle removing a tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const currentTags = conversationMetadata.tags || [];
    updateConversationMetadata({ tags: currentTags.filter(t => t !== tagToRemove) }, 'tags');
  }, [conversationMetadata.tags, updateConversationMetadata]);

  // Handle notes change with debounce
  const handleNotesChange = useCallback((value: string) => {
    setInternalNotes(value);
    
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    
    notesTimeoutRef.current = setTimeout(() => {
      updateConversationMetadata({ notes: value }, 'notes');
    }, 1000);
  }, [updateConversationMetadata]);

  // Helper to format field label from key
  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Check if field is a message field (should be read-only)
  const isMessageField = (key: string): boolean => {
    const messageKeys = ['message', 'Message', 'comments', 'Comments', 'note', 'notes'];
    return messageKeys.includes(key);
  };

  // Check if field is a consent field - uses centralized helper

  // Get consent content from custom data (look for related content field)
  const getConsentContent = (key: string, data: Record<string, unknown>): string | null => {
    // Look for content stored with various naming patterns
    const baseKey = key.toLowerCase().replace(/[_\s]/g, '');
    const contentKeys = [
      `${key}_content`, `${key}Content`, `${key}_text`, `${key}Text`,
      `${key}_label`, `${key}Label`, `${key}_description`,
      'consent_content', 'consentContent', 'consent_text', 'consentText',
      'consent_label', 'consentLabel', 'checkbox_text', 'checkboxText'
    ];
    
    for (const contentKey of contentKeys) {
      if (data[contentKey] && typeof data[contentKey] === 'string') {
        return data[contentKey] as string;
      }
    }
    
    // Also check for any key that might contain consent text
    for (const [dataKey, value] of Object.entries(data)) {
      const normalizedKey = dataKey.toLowerCase().replace(/[_\s]/g, '');
      if ((normalizedKey.includes('consent') || normalizedKey.includes(baseKey)) && 
          (normalizedKey.includes('text') || normalizedKey.includes('content') || normalizedKey.includes('label')) &&
          typeof value === 'string') {
        return value;
      }
    }
    
    return null;
  };

  // Render input based on value type with field-level saved indicator
  const renderCustomFieldInput = (key: string, value: unknown, currentCustomData: Record<string, unknown>) => {
    const currentValue = currentCustomData[key] ?? value;
    const fieldId = `custom_${key}`;
    
    // Message fields are read-only
    if (isMessageField(key)) {
      const strValue = String(currentValue || '');
      return (
        <div className="space-y-2">
          <Label className="text-muted-foreground">{formatLabel(key)}</Label>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3">
            {strValue || '-'}
          </p>
        </div>
      );
    }

    // Consent fields show as read-only text with tooltip
    if (isConsentFieldKey(key) || typeof value === 'boolean' || typeof currentValue === 'boolean') {
      const consented = Boolean(currentValue);
      const consentContent = getConsentContent(key, currentCustomData);
      // Sanitize consent content to prevent XSS
      const sanitizedContent = consentContent 
        ? DOMPurify.sanitize(consentContent, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'span'],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
          })
        : '';
      
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">{formatLabel(key)}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {sanitizedContent ? (
                    <div 
                      className="text-sm [&_a]:text-primary [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                    />
                  ) : (
                    <p className="text-sm">User agreed to the consent checkbox on the contact form.</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm bg-muted/50 rounded-md p-3">
            {consented ? 'Yes' : 'No'}
          </p>
        </div>
      );
    }
    
    const strValue = String(currentValue || '');
    if (strValue.length > 100) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={key} className="text-muted-foreground">{formatLabel(key)}</Label>
            <SavedIndicator show={savedField === fieldId} />
          </div>
          <Textarea
            id={key}
            value={strValue}
            onChange={(e) => {
              lastEditedFieldRef.current = fieldId;
              setEditedCustomData({ ...editedCustomData, [key]: e.target.value });
            }}
            rows={3}
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={key} className="text-muted-foreground">{formatLabel(key)}</Label>
          <SavedIndicator show={savedField === fieldId} />
        </div>
        <Input
          id={key}
          value={strValue}
          onChange={(e) => {
            lastEditedFieldRef.current = fieldId;
            setEditedCustomData({ ...editedCustomData, [key]: e.target.value });
          }}
        />
      </div>
    );
  };

  // Parse name into first and last
  const currentName = { ...lead, ...editedLead }.name || '';
  const nameParts = currentName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const handleNameChange = (first: string, last: string, fieldId: string) => {
    const fullName = [first, last].filter(Boolean).join(' ');
    lastEditedFieldRef.current = fieldId;
    setEditedLead({ ...editedLead, name: fullName });
  };

  // Always render Sheet for proper animation handling
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl h-[94vh] flex flex-col overflow-hidden" aria-describedby="lead-details-description">
        {!lead ? (
          <SkeletonLeadDetails />
        ) : (
          <>
            <SheetHeader className="flex-shrink-0 pb-4">
              <SheetTitle>Lead Details</SheetTitle>
              <p id="lead-details-description" className="sr-only">View and edit lead information, activity, and comments</p>
            </SheetHeader>

            {/* Two-column layout with independent scrolling */}
            <div className="flex flex-1 min-h-0">
              {/* Left column - Lead details with scroll */}
              <ScrollArea className="flex-1 min-w-0 pr-6">
                <div className="space-y-4 pb-4">
                  {/* Compact Property Grid - Status, Assignees, Priority */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <LeadStatusDropdown
                        stageId={{ ...lead, ...editedLead }.stage_id}
                        onStageChange={(stageId) => {
                          lastEditedFieldRef.current = 'stage_id';
                          setEditedLead({ ...editedLead, stage_id: stageId });
                        }}
                      />
                    </div>
                    
                    {/* Assignees */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Assignees</Label>
                      <LeadAssigneePicker
                        leadId={lead.id}
                        assignees={getAssignees(lead.id)}
                        onAdd={(userId) => addAssignee(lead.id, userId)}
                        onRemove={(userId) => removeAssignee(lead.id, userId)}
                        size="sm"
                      />
                    </div>
                    
                    {/* Priority */}
                    {lead.conversation_id && (
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Priority</Label>
                        <div className="flex items-center gap-1">
                          <SavedIndicator show={savedField === 'priority'} />
                          <Select
                            value={conversationMetadata.priority || 'none'}
                            onValueChange={handlePriorityChange}
                          >
                            <SelectTrigger className="h-7 w-auto min-w-[90px] text-xs border-none bg-transparent hover:bg-muted/50 px-2">
                              <SelectValue>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      PRIORITY_OPTIONS.find(p => p.value === (conversationMetadata.priority || 'none'))?.color || 'bg-muted'
                                    }`}
                                  />
                                  <span className="text-xs">{PRIORITY_OPTIONS.find(p => p.value === (conversationMetadata.priority || 'none'))?.label || 'Not Set'}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${option.color}`} />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags - inline */}
                  {lead.conversation_id && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Tags</Label>
                        <SavedIndicator show={savedField === 'tags'} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {conversationMetadata.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-0.5 hover:bg-muted rounded p-0.5"
                              aria-label={`Remove ${tag} tag`}
                            >
                              <XClose className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                        <div className="flex gap-1">
                          <Input
                            placeholder="Add..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag(newTag);
                              }
                            }}
                            className="h-6 w-20 text-xs px-2"
                          />
                        </div>
                      </div>
                      {/* Preset tags */}
                      <div className="flex flex-wrap gap-1">
                        {PRESET_TAGS.filter(t => !conversationMetadata.tags?.includes(t)).slice(0, 3).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleAddTag(tag)}
                            className="text-2xs px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Contact Information - Compact */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Contact</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                          <SavedIndicator show={savedField === 'firstName'} />
                        </div>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => handleNameChange(e.target.value, lastName, 'firstName')}
                          className="h-8 text-sm bg-muted/50 border-transparent focus:border-input focus:bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                          <SavedIndicator show={savedField === 'lastName'} />
                        </div>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => handleNameChange(firstName, e.target.value, 'lastName')}
                          className="h-8 text-sm bg-muted/50 border-transparent focus:border-input focus:bg-background"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                          <SavedIndicator show={savedField === 'email'} />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          value={{ ...lead, ...editedLead }.email || ''}
                          onChange={(e) => {
                            lastEditedFieldRef.current = 'email';
                            setEditedLead({ ...editedLead, email: e.target.value });
                          }}
                          className="h-8 text-sm bg-muted/50 border-transparent focus:border-input focus:bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
                          <SavedIndicator show={savedField === 'phone'} />
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          value={{ ...lead, ...editedLead }.phone || phoneValue}
                          onChange={(e) => {
                            lastEditedFieldRef.current = 'phone';
                            setEditedLead({ ...editedLead, phone: e.target.value });
                          }}
                          className="h-8 text-sm bg-muted/50 border-transparent focus:border-input focus:bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Custom Fields - Collapsible */}
                  {customFields.length > 0 && (
                    <>
                      <Separator />
                      <Collapsible defaultOpen={customFields.length <= 4}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-sm font-medium hover:text-foreground text-muted-foreground group">
                          <span>Additional Information</span>
                          <span className="text-xs">({customFields.length} fields)</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 space-y-3">
                          {customFields.map(([key, value]) => {
                            const currentCustomData = { ...((lead.data || {}) as Record<string, unknown>), ...editedCustomData };
                            return (
                              <div key={key}>
                                {renderCustomFieldInput(key, value, currentCustomData)}
                              </div>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  )}

                  {/* Session Details - Collapsible */}
                  {conversation && (
                    <>
                      <Separator />
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-sm font-medium hover:text-foreground text-muted-foreground">
                          <span>Session Details</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <div className="space-y-2 text-xs">
                            {conversationMetadata.country && (
                              <div className="flex items-center gap-2">
                                <Globe01 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span>
                                  {conversationMetadata.city || ''}{conversationMetadata.city && conversationMetadata.region ? ', ' : ''}{conversationMetadata.region || ''}
                                  {!conversationMetadata.city && !conversationMetadata.region && conversationMetadata.country}
                                </span>
                                {(conversationMetadata.country_code || getCountryCode(conversationMetadata.country)) && (
                                  <span className="flex-shrink-0" role="img" aria-label={conversationMetadata.country || ''}>
                                    {countryCodeToFlag((conversationMetadata.country_code || getCountryCode(conversationMetadata.country))!)}
                                  </span>
                                )}
                              </div>
                            )}
                            {(conversationMetadata.device_type || conversationMetadata.device) && (
                              <div className="flex items-center gap-2">
                                <Monitor01 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="capitalize">
                                  {conversationMetadata.device_type || conversationMetadata.device}
                                  {conversationMetadata.browser && ` • ${conversationMetadata.browser}`}
                                </span>
                              </div>
                            )}
                            {conversationMetadata.os && (
                              <div className="flex items-center gap-2">
                                <Browser className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span>{conversationMetadata.os}</span>
                              </div>
                            )}
                            {conversationMetadata.session_started_at && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span>
                                  Started {formatDistanceToNow(new Date(conversationMetadata.session_started_at), { addSuffix: true })}
                                </span>
                              </div>
                            )}
                            {!conversationMetadata.country && 
                             !conversationMetadata.device_type && 
                             !conversationMetadata.device && 
                             !conversationMetadata.session_started_at && (
                              <p className="text-muted-foreground italic">No session details available</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  )}

                  {/* Internal Notes */}
                  {lead.conversation_id && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Internal Notes</Label>
                          <SavedIndicator show={savedField === 'notes'} />
                        </div>
                        <Textarea
                          placeholder="Add internal notes..."
                          value={internalNotes}
                          onChange={(e) => handleNotesChange(e.target.value)}
                          rows={2}
                          className="resize-none text-sm min-h-[60px]"
                        />
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Actions - moved to bottom of left column */}
                  <div className="flex gap-2">
                    {lead.conversation_id && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={handleViewConversation}>
                        <LinkExternal02 className="h-3.5 w-3.5 mr-1.5" />
                        View Conversation
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={handleDelete}
                        aria-label="Delete lead"
                      >
                        <Trash02 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Right column - Activity & Comments - full height border */}
              <div className="w-72 border-l flex-shrink-0 flex flex-col -my-4 py-4 pl-4">
                <LeadActivityPanel leadId={lead.id} />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};