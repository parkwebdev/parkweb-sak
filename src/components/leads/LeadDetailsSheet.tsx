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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash02, LinkExternal02, InfoCircle, Globe01, Monitor01, Clock, Browser, XClose, Copy01, Phone01, MessageChatCircle, File02, Link01 } from '@untitledui/icons';
import { PHONE_FIELD_KEYS, EXCLUDED_LEAD_FIELDS, isConsentFieldKey, getPhoneFromLeadData } from '@/lib/field-keys';
import DOMPurify from 'isomorphic-dompurify';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { SkeletonLeadDetails } from '@/components/ui/page-skeleton';
import type { Tables, Enums, Json } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { LeadAssigneePicker } from './LeadAssigneePicker';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLeadAssignees } from '@/hooks/useLeadAssignees';
import { LeadActivityPanel } from './LeadActivityPanel';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { IconButton } from '@/components/ui/icon-button';

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

// Preset tags removed - users can add tags via the input field

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
  const { user } = useAuth();
  const [editedLead, setEditedLead] = useState<Partial<Tables<'leads'>>>({});
  const [editedCustomData, setEditedCustomData] = useState<Record<string, unknown>>({});
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track which fields are currently saving (for pulse animation)
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());

  // Track if user is actively editing to prevent state reset
  const isEditingRef = useRef(false);
  const isEditingNotesRef = useRef(false);

  // State for Priority, Tags, Notes
  const [newTag, setNewTag] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousNotesRef = useRef<string>('');
  
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

  // Initialize notes from conversation metadata (only when not actively editing)
  useEffect(() => {
    if (conversation?.metadata && !isEditingNotesRef.current) {
      const meta = conversation.metadata as ConversationMetadata;
      setInternalNotes(meta.notes || '');
      previousNotesRef.current = meta.notes || '';
    }
  }, [conversation?.id, conversation?.metadata]);

  // Reset edited state when lead changes (only if not actively editing)
  useEffect(() => {
    if (isEditingRef.current) return;
    
    setEditedLead({});
    setEditedCustomData({});
    setNewTag('');
  }, [lead?.id]);

  // Track which field was last edited
  const lastEditedFieldRef = useRef<string | null>(null);

  // Refs to track timeouts for cleanup
  const savingPulseTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up all timeouts on unmount
  useEffect(() => {
    const timeouts = savingPulseTimeoutsRef.current;
    const notesTimeout = notesTimeoutRef.current;
    const autoSaveTimeout = autoSaveTimeoutRef.current;
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
      if (notesTimeout) clearTimeout(notesTimeout);
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    };
  }, []);

  // Show saving pulse on a field
  const showSavingPulse = useCallback((fieldId: string) => {
    setSavingFields(prev => new Set(prev).add(fieldId));
    
    // Clear any existing timeout for this field
    const existing = savingPulseTimeoutsRef.current.get(fieldId);
    if (existing) clearTimeout(existing);
    
    const timeout = setTimeout(() => {
      setSavingFields(prev => {
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });
      savingPulseTimeoutsRef.current.delete(fieldId);
    }, 600);
    
    savingPulseTimeoutsRef.current.set(fieldId, timeout);
  }, []);

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
    
    // Show pulse animation on the last edited field
    if (lastEditedFieldRef.current) {
      showSavingPulse(lastEditedFieldRef.current);
    }
  }, [lead, editedLead, editedCustomData, onUpdate, showSavingPulse]);

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
      
      // Show pulse animation
      showSavingPulse(fieldName);

      // Log activity for internal notes changes
      if ('notes' in updates && lead?.id && user?.id) {
        const oldNotes = previousNotesRef.current;
        const newNotes = updates.notes || '';
        
        // Only log if notes actually changed
        if (oldNotes !== newNotes) {
          await supabase.from('lead_activities').insert({
            lead_id: lead.id,
            user_id: user.id,
            action_type: 'field_updated',
            action_data: {
              field: 'internal_notes',
              from: oldNotes || null,
              to: newNotes || null
            }
          });
          
          // Update previous notes ref
          previousNotesRef.current = newNotes;
          
          // Invalidate activities to show the new entry
          queryClient.invalidateQueries({ queryKey: queryKeys.leadActivities.list(lead.id) });
        }
      }
    }
  }, [lead?.conversation_id, lead?.id, conversation, queryClient, showSavingPulse, user?.id]);

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

  // Input class with saving pulse animation
  const getInputClassName = (fieldId: string, baseClass: string = '') => {
    const isSaving = savingFields.has(fieldId);
    return cn(
      "h-8 text-sm bg-muted/50 border-transparent focus:border-input focus:bg-background transition-all duration-200",
      isSaving && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background animate-pulse",
      baseClass
    );
  };

  // Render input based on value type with saving pulse
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
          <Label htmlFor={key} className="text-muted-foreground">{formatLabel(key)}</Label>
          <Textarea
            id={key}
            value={strValue}
            onChange={(e) => {
              lastEditedFieldRef.current = fieldId;
              setEditedCustomData({ ...editedCustomData, [key]: e.target.value });
            }}
            onFocus={() => { isEditingRef.current = true; }}
            onBlur={() => { isEditingRef.current = false; }}
            rows={3}
            className={cn(
              "transition-all duration-200",
              savingFields.has(fieldId) && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background animate-pulse"
            )}
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor={key} className="text-muted-foreground">{formatLabel(key)}</Label>
        <Input
          id={key}
          value={strValue}
          onChange={(e) => {
            lastEditedFieldRef.current = fieldId;
            setEditedCustomData({ ...editedCustomData, [key]: e.target.value });
          }}
          onFocus={() => { isEditingRef.current = true; }}
          onBlur={() => { isEditingRef.current = false; }}
          className={getInputClassName(fieldId)}
        />
      </div>
    );
  };

  // Extract first/last name from lead.data (matching Kanban pattern)
  const leadData = useMemo(() => (lead?.data || {}) as Record<string, unknown>, [lead?.data]);
  const currentFirstName = (editedCustomData.firstName as string) ?? 
    (leadData.firstName as string) ?? 
    (leadData['First Name'] as string) ?? '';
  const currentLastName = (editedCustomData.lastName as string) ?? 
    (leadData.lastName as string) ?? 
    (leadData['Last Name'] as string) ?? '';

  const handleFirstNameChange = (value: string) => {
    lastEditedFieldRef.current = 'firstName';
    setEditedCustomData({ ...editedCustomData, firstName: value });
    // Also sync the combined name field for backward compat
    setEditedLead({ ...editedLead, name: `${value} ${currentLastName}`.trim() });
  };

  const handleLastNameChange = (value: string) => {
    lastEditedFieldRef.current = 'lastName';
    setEditedCustomData({ ...editedCustomData, lastName: value });
    // Also sync the combined name field for backward compat
    setEditedLead({ ...editedLead, name: `${currentFirstName} ${value}`.trim() });
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Get source type from referrer journey
  const getSourceType = (): { type: string; icon: React.ReactNode } => {
    const referrer = conversationMetadata.referrer_url || conversationMetadata.referrer;
    if (!referrer) return { type: 'Direct', icon: <Link01 className="h-3 w-3" /> };
    
    const lowerRef = referrer.toLowerCase();
    if (lowerRef.includes('google') || lowerRef.includes('bing') || lowerRef.includes('yahoo')) {
      return { type: 'Organic', icon: <Globe01 className="h-3 w-3" /> };
    }
    if (lowerRef.includes('facebook') || lowerRef.includes('twitter') || lowerRef.includes('linkedin') || lowerRef.includes('instagram')) {
      return { type: 'Social', icon: <Globe01 className="h-3 w-3" /> };
    }
    return { type: 'Referral', icon: <Link01 className="h-3 w-3" /> };
  };

  // Get messages count from conversation
  const getMessagesCount = (): number => {
    return conversationMetadata.messages_count || 0;
  };

  // Get pages visited count
  const getPagesCount = (): number => {
    return conversationMetadata.visited_pages?.length || 0;
  };

  // Always render Sheet for proper animation handling
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl h-[94vh] p-0 flex overflow-hidden" aria-describedby="lead-details-description">
        {!lead ? (
          <div className="p-6">
            <SkeletonLeadDetails />
          </div>
        ) : (
          <>
            {/* Left side - header + scrollable content */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 p-6 pr-0">
              <SheetHeader className="flex-shrink-0 pb-4 pr-6">
                <SheetTitle>Lead Details</SheetTitle>
                <p id="lead-details-description" className="sr-only">View and edit lead information, activity, and comments</p>
              </SheetHeader>

              {/* Scrollable content */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-6">
                <div className="space-y-2 pb-4">
                  {/* Header Bar - Status, Priority, Created Date */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <LeadStatusDropdown
                      stageId={{ ...lead, ...editedLead }.stage_id}
                      onStageChange={(stageId) => {
                        lastEditedFieldRef.current = 'stage_id';
                        setEditedLead({ ...editedLead, stage_id: stageId });
                      }}
                    />
                    
                    {lead.conversation_id && (
                      <div className={cn(
                        "flex items-center gap-1 rounded transition-all duration-200",
                        savingFields.has('priority') && "ring-2 ring-primary/50"
                      )}>
                        <Select
                          value={conversationMetadata.priority || 'none'}
                          onValueChange={handlePriorityChange}
                        >
                          <SelectTrigger className="h-6 w-auto min-w-[80px] text-xs border-none bg-muted/50 hover:bg-muted px-2">
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
                    )}
                    
                    <span className="ml-auto text-2xs text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {/* Contact - Property List (no background) */}
                  <div className="space-y-2">
                    {/* First Name / Last Name Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground w-10 flex-shrink-0">First</Label>
                        <Input
                          value={currentFirstName}
                          onChange={(e) => handleFirstNameChange(e.target.value)}
                          onFocus={() => { isEditingRef.current = true; }}
                          onBlur={() => { isEditingRef.current = false; }}
                          className={cn(getInputClassName('firstName'), "flex-1")}
                          placeholder="First name"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground w-10 flex-shrink-0">Last</Label>
                        <Input
                          value={currentLastName}
                          onChange={(e) => handleLastNameChange(e.target.value)}
                          onFocus={() => { isEditingRef.current = true; }}
                          onBlur={() => { isEditingRef.current = false; }}
                          className={cn(getInputClassName('lastName'), "flex-1")}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    
                    {/* Email Row */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-10 flex-shrink-0">Email</Label>
                      <Input
                        type="email"
                        value={{ ...lead, ...editedLead }.email || ''}
                        onChange={(e) => {
                          lastEditedFieldRef.current = 'email';
                          setEditedLead({ ...editedLead, email: e.target.value });
                        }}
                        onFocus={() => { isEditingRef.current = true; }}
                        onBlur={() => { isEditingRef.current = false; }}
                        className={cn(getInputClassName('email'), "flex-1")}
                        placeholder="email@example.com"
                      />
                      {({ ...lead, ...editedLead }.email) && (
                        <IconButton
                          label="Copy email"
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard({ ...lead, ...editedLead }.email || '', 'Email')}
                        >
                          <Copy01 className="h-4 w-4" />
                        </IconButton>
                      )}
                    </div>
                    
                    {/* Phone Row */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-10 flex-shrink-0">Phone</Label>
                      <Input
                        type="tel"
                        value={{ ...lead, ...editedLead }.phone || phoneValue}
                        onChange={(e) => {
                          lastEditedFieldRef.current = 'phone';
                          setEditedLead({ ...editedLead, phone: e.target.value });
                        }}
                        onFocus={() => { isEditingRef.current = true; }}
                        onBlur={() => { isEditingRef.current = false; }}
                        className={cn(getInputClassName('phone'), "flex-1")}
                        placeholder="(555) 123-4567"
                      />
                      {({ ...lead, ...editedLead }.phone || phoneValue) && (
                        <>
                          <IconButton
                            label="Copy phone"
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard({ ...lead, ...editedLead }.phone || phoneValue, 'Phone')}
                          >
                            <Copy01 className="h-4 w-4" />
                          </IconButton>
                          <a href={`tel:${({ ...lead, ...editedLead }.phone || phoneValue).replace(/\D/g, '')}`}>
                            <IconButton
                              label="Call"
                              size="sm"
                              variant="ghost"
                              asChild
                            >
                              <Phone01 className="h-4 w-4" />
                            </IconButton>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Session Info - 3 Column Grid with background */}
                  {conversation && (
                    <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                      {/* Row 1: Source, Location, Device */}
                      <div className="flex items-center gap-1.5 truncate">
                        {getSourceType().icon}
                        <span>{getSourceType().type}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Globe01 className="h-3.5 w-3.5 flex-shrink-0" />
                        {conversationMetadata.city || conversationMetadata.country ? (
                          <span>
                            {conversationMetadata.city || conversationMetadata.country}
                            {(conversationMetadata.country_code || getCountryCode(conversationMetadata.country)) && (
                              <span className="ml-0.5" role="img" aria-label={conversationMetadata.country || ''}>
                                {countryCodeToFlag((conversationMetadata.country_code || getCountryCode(conversationMetadata.country))!)}
                              </span>
                            )}
                          </span>
                        ) : <span className="text-muted-foreground/50">—</span>}
                      </div>
                      <div className="flex items-center gap-1.5 truncate capitalize">
                        <Monitor01 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{conversationMetadata.device_type || conversationMetadata.device || '—'}</span>
                      </div>
                      
                      {/* Row 2: Browser, Messages, Pages */}
                      <div className="flex items-center gap-1.5 truncate">
                        <Browser className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{conversationMetadata.browser || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageChatCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{getMessagesCount()} msgs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <File02 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{getPagesCount()} pages</span>
                      </div>
                      
                      {/* Row 3: Time, Landing/Referrer */}
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: false }) : '—'}</span>
                      </div>
                      {conversationMetadata.landing_page ? (
                        <div className="flex items-center gap-1.5 truncate col-span-2">
                          <span className="text-muted-foreground/60 flex-shrink-0">Landing:</span>
                          <span className="truncate">{stripUrl(conversationMetadata.landing_page)}</span>
                        </div>
                      ) : (conversationMetadata.referrer_url || conversationMetadata.referrer) ? (
                        <div className="flex items-center gap-1.5 truncate col-span-2">
                          <span className="text-muted-foreground/60 flex-shrink-0">Referrer:</span>
                          <span className="truncate">{stripUrl(conversationMetadata.referrer_url || conversationMetadata.referrer || '')}</span>
                        </div>
                      ) : (
                        <div className="col-span-2" />
                      )}
                    </div>
                  )}

                  {/* Assignees */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Assignees</Label>
                    <LeadAssigneePicker
                      leadId={lead.id}
                      assignees={getAssignees(lead.id)}
                      onAdd={(userId) => addAssignee(lead.id, userId)}
                      onRemove={(userId) => removeAssignee(lead.id, userId)}
                      size="sm"
                    />
                  </div>

                  {/* Tags */}
                  {lead.conversation_id && (
                    <div className={cn(
                      "flex flex-wrap items-center gap-1.5 rounded transition-all duration-200",
                      savingFields.has('tags') && "ring-2 ring-primary/50"
                    )}>
                      <Label className="text-xs text-muted-foreground mr-1">Tags</Label>
                      {conversationMetadata.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs h-6">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-0.5 hover:bg-muted rounded p-0.5"
                            aria-label={`Remove ${tag} tag`}
                          >
                            <XClose className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
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
                        className="h-6 w-16 text-xs px-1.5 border-dashed"
                      />
                    </div>
                  )}

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

                  {/* Internal Notes */}
                  {lead.conversation_id && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Internal Notes</Label>
                      <Textarea
                        placeholder="Add internal notes..."
                        value={internalNotes}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        onFocus={() => { isEditingNotesRef.current = true; }}
                        onBlur={() => { isEditingNotesRef.current = false; }}
                        rows={2}
                        className={cn(
                          "resize-none text-sm min-h-[40px] transition-all duration-200",
                          savingFields.has('notes') && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background animate-pulse"
                        )}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
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
                        <Trash02 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Activity Panel */}
            <div className="w-[340px] border-l border-border flex flex-col h-full min-h-0 overflow-hidden">
              <LeadActivityPanel leadId={lead.id} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
