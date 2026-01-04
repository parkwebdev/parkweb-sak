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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash02, LinkExternal02, InfoCircle, Globe01, Clock, XClose, Copy01, Phone01, Link01, Mail01 } from '@untitledui/icons';
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
import { copyToClipboard } from '@/lib/clipboard';
import { IconButton } from '@/components/ui/icon-button';
import { PRIORITY_OPTIONS } from '@/lib/priority-config';

interface LeadDetailsSheetProps {
  lead: Tables<'leads'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Tables<'leads'>>) => void;
  /** If undefined, delete button will be hidden (user lacks permission) */
  onDelete?: (id: string) => void;
}

// Preset tags for quick selection
const PRESET_TAGS = [
  'Follow-up', 'Hot Lead', 'Cold Lead', 
  'Qualified', 'Not Qualified', 'Callback', 'Demo Scheduled'
];

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
  const [isEditingName, setIsEditingName] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editedLead, setEditedLead] = useState<Partial<Tables<'leads'>>>({});
  const [editedCustomData, setEditedCustomData] = useState<Record<string, unknown>>({});
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track the last saved values to detect when lead prop has been updated
  const lastSavedValuesRef = useRef<{ lead: Partial<Tables<'leads'>>; customData: Record<string, unknown> } | null>(null);

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

  // Clean up all timeouts on unmount
  useEffect(() => {
    const notesTimeout = notesTimeoutRef.current;
    const autoSaveTimeout = autoSaveTimeoutRef.current;
    
    return () => {
      if (notesTimeout) clearTimeout(notesTimeout);
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    };
  }, []);

  // Clear local edited state once lead prop reflects saved values
  useEffect(() => {
    if (!lastSavedValuesRef.current || !lead) return;
    
    const { lead: savedLead, customData: savedCustomData } = lastSavedValuesRef.current;
    const currentData = (lead.data || {}) as Record<string, unknown>;
    
    // Check if lead prop now reflects saved values
    const leadValuesMatch = Object.entries(savedLead).every(
      ([key, value]) => lead[key as keyof Tables<'leads'>] === value
    );
    const customDataValuesMatch = Object.entries(savedCustomData).every(
      ([key, value]) => currentData[key] === value
    );
    
    if (leadValuesMatch && customDataValuesMatch) {
      // Lead prop has been updated, safe to clear local state
      setEditedLead({});
      setEditedCustomData({});
      lastSavedValuesRef.current = null;
    }
  }, [lead]);

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
    
    // Store what we're saving so we can clear local state once lead prop updates
    lastSavedValuesRef.current = {
      lead: editedLead,
      customData: editedCustomData,
    };
    
    onUpdate(lead.id, updates);
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
    if (!lead?.conversation_id) return;

    const currentMetadata = ((conversation?.metadata || {}) as ConversationMetadata);
    const newMetadata = { ...currentMetadata, ...updates };

    const { error } = await supabase
      .from('conversations')
      .update({ metadata: newMetadata as Json })
      .eq('id', lead.conversation_id);

    if (!error) {
      // Update local cache (even if conversation query hasn't resolved yet)
      queryClient.setQueryData(['conversation-for-lead', lead.conversation_id], {
        id: lead.conversation_id,
        metadata: newMetadata,
        created_at: conversation?.created_at ?? new Date().toISOString(),
        channel: conversation?.channel ?? null,
      });

      // Invalidate conversations list for sync
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Invalidate leads cache so Kanban/Table reflect updated tags/priority/notes
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });

      // Log activity for tag changes
      if ('tags' in updates && lead?.id && user?.id) {
        const oldTags = currentMetadata.tags || [];
        const newTags = updates.tags || [];
        
        // Find added tags
        const addedTags = newTags.filter(t => !oldTags.includes(t));
        // Find removed tags
        const removedTags = oldTags.filter(t => !newTags.includes(t));
        
        // Log each added tag
        for (const tag of addedTags) {
          await supabase.from('lead_activities').insert({
            lead_id: lead.id,
            user_id: user.id,
            action_type: 'tag_added',
            action_data: { tag },
          });
        }
        
        // Log each removed tag
        for (const tag of removedTags) {
          await supabase.from('lead_activities').insert({
            lead_id: lead.id,
            user_id: user.id,
            action_type: 'tag_removed',
            action_data: { tag },
          });
        }
        
        if (addedTags.length > 0 || removedTags.length > 0) {
          queryClient.invalidateQueries({ queryKey: queryKeys.leadActivities.list(lead.id) });
        }
      }

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
              to: newNotes || null,
            },
          });

          // Update previous notes ref
          previousNotesRef.current = newNotes;

          // Invalidate activities to show the new entry
          queryClient.invalidateQueries({ queryKey: queryKeys.leadActivities.list(lead.id) });
        }
      }

      // Log activity for priority changes
      if ('priority' in updates && lead?.id && user?.id) {
        const oldPriority = currentMetadata.priority ?? null;
        const newPriority = updates.priority ?? null;

        if (oldPriority !== newPriority) {
          await supabase.from('lead_activities').insert({
            lead_id: lead.id,
            user_id: user.id,
            action_type: 'field_updated',
            action_data: {
              field: 'priority',
              from: oldPriority,
              to: newPriority,
            },
          });

          queryClient.invalidateQueries({ queryKey: queryKeys.leadActivities.list(lead.id) });
        }
      }
    }
  }, [lead?.conversation_id, lead?.id, conversation, queryClient, user?.id]);

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

  // Input class styling
  const getInputClassName = (baseClass: string = '') => {
    return cn(
      "h-8 text-xs bg-muted/50 border-transparent focus:border-input focus:bg-background transition-all duration-200",
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
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{formatLabel(key)}</Label>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-2 min-h-8">
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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">{formatLabel(key)}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {sanitizedContent ? (
                    <div 
                      className="[&_a]:text-primary [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                    />
                  ) : (
                    <p className="text-xs">User agreed to the consent checkbox on the contact form.</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs bg-muted/50 rounded-md p-2 h-8 flex items-center">
            {consented ? 'Yes' : 'No'}
          </p>
        </div>
      );
    }
    
    const strValue = String(currentValue || '');
    if (strValue.length > 100) {
      return (
        <div className="space-y-1">
          <Label htmlFor={key} className="text-xs text-muted-foreground">{formatLabel(key)}</Label>
          <Textarea
            id={key}
            value={strValue}
            onChange={(e) => {
              lastEditedFieldRef.current = fieldId;
              setEditedCustomData({ ...editedCustomData, [key]: e.target.value });
            }}
            onFocus={() => { isEditingRef.current = true; }}
            onBlur={() => { isEditingRef.current = false; }}
            rows={2}
            className="text-xs min-h-8 resize-none transition-all duration-200"
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        <Label htmlFor={key} className="text-xs text-muted-foreground">{formatLabel(key)}</Label>
        <Input
          id={key}
          value={strValue}
          onChange={(e) => {
            lastEditedFieldRef.current = fieldId;
            setEditedCustomData({ ...editedCustomData, [key]: e.target.value });
          }}
          onFocus={() => { isEditingRef.current = true; }}
          onBlur={() => { isEditingRef.current = false; }}
          className={getInputClassName()}
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
      <SheetContent className="sm:max-w-5xl h-[94vh] p-0 flex overflow-hidden" aria-describedby="lead-details-description">
        {!lead ? (
          <div className="p-6">
            <SkeletonLeadDetails />
          </div>
        ) : (
          <>
            {/* Left side - header + scrollable content */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 p-6">
              <SheetHeader className="flex-shrink-0 pb-4">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={currentFirstName}
                      onChange={(e) => handleFirstNameChange(e.target.value)}
                      onFocus={() => { isEditingRef.current = true; }}
                      onBlur={() => { isEditingRef.current = false; }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsEditingName(false);
                        if (e.key === 'Enter') setIsEditingName(false);
                      }}
                      className={cn("h-8 text-lg font-semibold flex-1", getInputClassName())}
                      placeholder="First name"
                      autoFocus
                    />
                    <Input
                      value={currentLastName}
                      onChange={(e) => handleLastNameChange(e.target.value)}
                      onFocus={() => { isEditingRef.current = true; }}
                      onBlur={() => { isEditingRef.current = false; }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsEditingName(false);
                        if (e.key === 'Enter') setIsEditingName(false);
                      }}
                      className={cn("h-8 text-lg font-semibold flex-1", getInputClassName())}
                      placeholder="Last name"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => setIsEditingName(false)}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <SheetTitle
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditingName(true)}
                  >
                    {currentFirstName || currentLastName
                      ? `${currentFirstName} ${currentLastName}`.trim()
                      : <span className="text-muted-foreground">Unnamed Lead</span>}
                  </SheetTitle>
                )}
                <p id="lead-details-description" className="sr-only">View and edit lead information, activity, and comments</p>
              </SheetHeader>

              {/* Scrollable content */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="space-y-4 pb-4">
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
                      <div className="flex items-center gap-1 rounded transition-all duration-200">
                        <Select
                          value={conversationMetadata.priority || 'none'}
                          onValueChange={handlePriorityChange}
                        >
                          <SelectTrigger size="sm" className="w-auto min-w-[80px] text-xs border-none bg-muted/50 hover:bg-muted px-2">
                            <SelectValue>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    PRIORITY_OPTIONS.find(p => p.value === (conversationMetadata.priority || 'none'))?.dotColor || 'bg-muted'
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
                                  <span className={`h-2 w-2 rounded-full ${option.dotColor}`} />
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
                  <div className="space-y-1.5">
                    
                    {/* Email Row */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-12 flex-shrink-0">Email</Label>
                      <div className="flex flex-1 h-8 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                        <Input
                          size="sm"
                          type="email"
                          value={{ ...lead, ...editedLead }.email || ''}
                          onChange={(e) => {
                            lastEditedFieldRef.current = 'email';
                            setEditedLead({ ...editedLead, email: e.target.value });
                          }}
                          onFocus={() => { isEditingRef.current = true; }}
                          onBlur={() => { isEditingRef.current = false; }}
                          className={cn(
                            getInputClassName('email'),
                            'flex-1 h-8 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0'
                          )}
                          placeholder="email@example.com"
                        />
                        {({ ...lead, ...editedLead }.email) && (
                          <div className="flex h-full border-l border-border">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard({ ...lead, ...editedLead }.email || '', 'Email')}
                                  className="flex h-full w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                  aria-label="Copy email"
                                >
                                  <Copy01 className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Copy email</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => window.open(`mailto:${({ ...lead, ...editedLead }.email)}`, '_blank')}
                                  className="flex h-full w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l border-border"
                                  aria-label="Send email"
                                >
                                  <Mail01 className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Send email</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Phone Row */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-12 flex-shrink-0">Phone</Label>
                      <div className="flex flex-1 h-8 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                        <Input
                          size="sm"
                          type="tel"
                          value={{ ...lead, ...editedLead }.phone || phoneValue}
                          onChange={(e) => {
                            lastEditedFieldRef.current = 'phone';
                            setEditedLead({ ...editedLead, phone: e.target.value });
                          }}
                          onFocus={() => { isEditingRef.current = true; }}
                          onBlur={() => { isEditingRef.current = false; }}
                          className={cn(
                            getInputClassName('phone'),
                            'flex-1 h-8 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0'
                          )}
                          placeholder="(555) 123-4567"
                        />
                        {({ ...lead, ...editedLead }.phone || phoneValue) && (
                          <div className="flex h-full border-l border-border">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard({ ...lead, ...editedLead }.phone || phoneValue, 'Phone')}
                                  className="flex h-full w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                  aria-label="Copy phone"
                                >
                                  <Copy01 className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Copy phone</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => window.open(`tel:${({ ...lead, ...editedLead }.phone || phoneValue).replace(/\D/g, '')}`, '_self')}
                                  className="flex h-full w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l border-border"
                                  aria-label="Call"
                                >
                                  <Phone01 className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Call</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Session Info - 2 Column Grid with background */}
                  {conversation && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                      {/* Row 1: Source, Location */}
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
                      
                      {/* Row 2: Time, Landing/Referrer */}
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: false }) : '—'}</span>
                      </div>
                      {conversationMetadata.landing_page ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-muted-foreground/60 flex-shrink-0">Landing:</span>
                          <span className="truncate">{stripUrl(conversationMetadata.landing_page)}</span>
                        </div>
                      ) : (conversationMetadata.referrer_url || conversationMetadata.referrer) ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-muted-foreground/60 flex-shrink-0">Referrer:</span>
                          <span className="truncate">{stripUrl(conversationMetadata.referrer_url || conversationMetadata.referrer || '')}</span>
                        </div>
                      ) : null}
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

                  {/* Tags - Inline */}
                  {lead.conversation_id && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 rounded transition-all duration-200">
                        <Label className="text-xs text-muted-foreground flex-shrink-0">Tags</Label>
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                          {conversationMetadata.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-2xs h-5">
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
                            className="h-5 w-14 text-2xs px-1.5 border-dashed"
                          />
                        </div>
                      </div>
                      {/* Preset Tags */}
                      {PRESET_TAGS.filter(t => !(conversationMetadata.tags || []).includes(t)).length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-9">
                          {PRESET_TAGS
                            .filter(t => !(conversationMetadata.tags || []).includes(t))
                            .slice(0, 6)
                            .map((tag) => (
                              <button
                                key={tag}
                                onClick={() => handleAddTag(tag)}
                                className="text-2xs px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic Custom Fields - Accordion */}
                  {customFields.length > 0 && (
                    <Accordion type="single" collapsible className="border-0 p-0 bg-transparent rounded-none">
                      <AccordionItem value="additional-info" className="border-b-0">
                        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <span>Additional Information</span>
                            <span className="text-xs text-muted-foreground font-normal">({customFields.length} fields)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2 space-y-3">
                          {customFields.map(([key, value]) => {
                            const currentCustomData = { ...((lead.data || {}) as Record<string, unknown>), ...editedCustomData };
                            return (
                              <div key={key}>
                                {renderCustomFieldInput(key, value, currentCustomData)}
                              </div>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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
                        className="resize-none text-xs min-h-8 transition-all duration-200"
                      />
                    </div>
                  )}

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
