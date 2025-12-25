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
import { Trash02, LinkExternal02, InfoCircle, Globe01, Monitor01, Clock, Browser, Link01, Plus, XClose } from '@untitledui/icons';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { SkeletonLeadDetails } from '@/components/ui/page-skeleton';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import type { Tables, Enums, Json } from '@/integrations/supabase/types';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface LeadDetailsSheetProps {
  lead: Tables<'leads'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Tables<'leads'>>) => void;
  onDelete: (id: string) => void;
}

interface ConversationMetadata {
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  ip_address?: string;
  country?: string;
  city?: string;
  country_code?: string;
  region?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  device?: string;
  browser?: string;
  os?: string;
  referrer_url?: string;
  session_started_at?: string;
  messages_count?: number;
  visited_pages?: Array<{ url: string; entered_at: string; duration_ms: number }>;
  referrer_journey?: {
    referrer_url: string | null;
    landing_page: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
  };
  // Priority, Tags, Notes
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  notes?: string;
}

// Priority options with colors
const PRIORITY_OPTIONS = [
  { value: 'none', label: 'Not Set', color: 'bg-muted' },
  { value: 'low', label: 'Low', color: 'bg-blue-500' },
  { value: 'normal', label: 'Normal', color: 'bg-green-500' },
  { value: 'high', label: 'High', color: 'bg-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
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
            queryClient.setQueryData(['conversation-for-lead', lead.conversation_id], (old: any) => ({
              ...old,
              ...payload.new,
            }));
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

  // Check if phone exists in custom data
  // Get phone value from custom data if it exists
  const phoneKeys = ['phone', 'Phone', 'phone_number', 'phoneNumber', 'Phone Number', 'Phone number', 'telephone', 'mobile'];
  
  const customPhoneValue = useMemo(() => {
    if (!lead) return '';
    const data = (lead.data || {}) as Record<string, unknown>;
    for (const key of phoneKeys) {
      if (key in data && data[key]) {
        return String(data[key]);
      }
    }
    return '';
  }, [lead]);

  // Get custom fields from lead.data (excluding internal tracking fields, name fields, and phone fields)
  const customFields = useMemo(() => {
    if (!lead) return [];
    const data = (lead.data || {}) as Record<string, unknown>;
    const excludedFields = [
      'source', 'referrer', 'page_url', 'visitor_id',
      'first_name', 'firstName', 'last_name', 'lastName', 'name', 'full_name', 'fullName',
      ...phoneKeys
    ];
    return Object.entries(data).filter(([key]) => !excludedFields.includes(key));
  }, [lead]);
  
  const handleDelete = () => {
    if (!lead) return;
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

  // Check if field is a consent field
  const isConsentField = (key: string): boolean => {
    const consentKeys = ['consent', 'Consent', 'i_consent', 'I Consent', 'I consent', 'agree', 'Agree', 'terms', 'Terms'];
    return consentKeys.some(k => key.toLowerCase().includes(k.toLowerCase()));
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
    if (isConsentField(key) || typeof value === 'boolean' || typeof currentValue === 'boolean') {
      const consented = Boolean(currentValue);
      const consentContent = getConsentContent(key, currentCustomData);
      
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
                  <p className="text-sm">{consentContent || 'User agreed to the consent checkbox on the contact form.'}</p>
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
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        {!lead ? (
          <SkeletonLeadDetails />
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <SheetTitle>Lead Details</SheetTitle>
                <LeadStatusDropdown
                  status={{ ...lead, ...editedLead }.status}
                  onStatusChange={(status) => {
                    lastEditedFieldRef.current = 'status';
                    setEditedLead({ ...editedLead, status: status as Enums<'lead_status'> });
                  }}
                />
              </div>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="firstName" className="text-muted-foreground">First Name</Label>
                      <SavedIndicator show={savedField === 'firstName'} />
                    </div>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => handleNameChange(e.target.value, lastName, 'firstName')}
                      className="bg-muted/50 border-transparent focus:border-input focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lastName" className="text-muted-foreground">Last Name</Label>
                      <SavedIndicator show={savedField === 'lastName'} />
                    </div>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => handleNameChange(firstName, e.target.value, 'lastName')}
                      className="bg-muted/50 border-transparent focus:border-input focus:bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-muted-foreground">Email</Label>
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
                      className="bg-muted/50 border-transparent focus:border-input focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-muted-foreground">Phone</Label>
                    <Input
                      id="phone"
                      value={customPhoneValue}
                      readOnly
                      className="bg-muted/50 border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields */}
              {customFields.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Additional Information</h3>
                    {customFields.map(([key, value]) => {
                      const currentCustomData = { ...((lead.data || {}) as Record<string, unknown>), ...editedCustomData };
                      return (
                        <div key={key}>
                          {renderCustomFieldInput(key, value, currentCustomData)}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Session Details from Conversation - only show if we have conversation metadata */}
              {conversation && (
                <>
                  <Separator />
                  <Accordion type="multiple" defaultValue={['session']}>
                    <AccordionItem value="session" className="border-none">
                      <AccordionTrigger className="py-2 text-base font-semibold hover:no-underline">
                        Session Details
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <div className="space-y-3 text-sm">
                          {/* Location */}
                          {conversationMetadata.country && (
                            <div className="flex items-center gap-2.5">
                              <Globe01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span>
                                {conversationMetadata.city || ''}{conversationMetadata.city && conversationMetadata.region ? ', ' : ''}{conversationMetadata.region || ''}
                                {!conversationMetadata.city && !conversationMetadata.region && conversationMetadata.country}
                              </span>
                              {(conversationMetadata.country_code || getCountryCode(conversationMetadata.country)) && (
                                <span className="text-sm flex-shrink-0" role="img" aria-label={conversationMetadata.country || ''}>
                                  {countryCodeToFlag((conversationMetadata.country_code || getCountryCode(conversationMetadata.country))!)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Device + Browser */}
                          {(conversationMetadata.device_type || conversationMetadata.device) && (
                            <div className="flex items-center gap-2.5">
                              <Monitor01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="capitalize">
                                {conversationMetadata.device_type || conversationMetadata.device}
                                {conversationMetadata.browser && ` • ${conversationMetadata.browser}`}
                              </span>
                            </div>
                          )}

                          {/* OS */}
                          {conversationMetadata.os && (
                            <div className="flex items-center gap-2.5">
                              <Browser className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span>{conversationMetadata.os}</span>
                            </div>
                          )}

                          {/* Session started */}
                          {conversationMetadata.session_started_at && (
                            <div className="flex items-center gap-2.5">
                              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span>
                                Session started {formatDistanceToNow(new Date(conversationMetadata.session_started_at), { addSuffix: true })}
                              </span>
                            </div>
                          )}

                          {/* Referrer / Landing page */}
                          {(conversationMetadata.referrer_url || conversationMetadata.referrer_journey?.landing_page) && (
                            <div className="flex items-start gap-2.5">
                              <Link01 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 space-y-1">
                                {conversationMetadata.referrer_journey?.landing_page && (
                                  <div>
                                    <span className="text-muted-foreground">Entry: </span>
                                    <span className="truncate">{stripUrl(conversationMetadata.referrer_journey.landing_page)}</span>
                                  </div>
                                )}
                                {conversationMetadata.referrer_url && (
                                  <div>
                                    <span className="text-muted-foreground">From: </span>
                                    <span className="truncate">{stripUrl(conversationMetadata.referrer_url)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* UTM params if present */}
                          {conversationMetadata.referrer_journey?.utm_source && (
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="px-2 py-0.5 bg-muted rounded">
                                source: {conversationMetadata.referrer_journey.utm_source}
                              </span>
                              {conversationMetadata.referrer_journey.utm_medium && (
                                <span className="px-2 py-0.5 bg-muted rounded">
                                  medium: {conversationMetadata.referrer_journey.utm_medium}
                                </span>
                              )}
                              {conversationMetadata.referrer_journey.utm_campaign && (
                                <span className="px-2 py-0.5 bg-muted rounded">
                                  campaign: {conversationMetadata.referrer_journey.utm_campaign}
                                </span>
                              )}
                            </div>
                          )}

                          {/* No session data fallback */}
                          {!conversationMetadata.country && 
                           !conversationMetadata.device_type && 
                           !conversationMetadata.device && 
                           !conversationMetadata.session_started_at && (
                            <p className="text-muted-foreground italic">No session details available</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}

              {/* Priority, Tags, and Internal Notes - only show if conversation exists */}
              {lead.conversation_id && (
                <>
                  <Separator />
                  
                  {/* Priority */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Priority</Label>
                      <SavedIndicator show={savedField === 'priority'} />
                    </div>
                    <Select
                      value={conversationMetadata.priority || 'none'}
                      onValueChange={handlePriorityChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Not Set">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                PRIORITY_OPTIONS.find(p => p.value === (conversationMetadata.priority || 'none'))?.color || 'bg-muted'
                              }`}
                            />
                            {PRIORITY_OPTIONS.find(p => p.value === (conversationMetadata.priority || 'none'))?.label || 'Not Set'}
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

                  {/* Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Tags</Label>
                      <SavedIndicator show={savedField === 'tags'} />
                    </div>
                    
                    {/* Current tags */}
                    {(conversationMetadata.tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {conversationMetadata.tags?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:bg-muted rounded p-0.5"
                              aria-label={`Remove ${tag} tag`}
                            >
                              <XClose className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Add new tag */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(newTag);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleAddTag(newTag)}
                        disabled={!newTag.trim()}
                        aria-label="Add tag"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Preset tags */}
                    <div className="flex flex-wrap gap-1">
                      {PRESET_TAGS.filter(t => !conversationMetadata.tags?.includes(t)).slice(0, 4).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleAddTag(tag)}
                          className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Internal Notes</Label>
                      <SavedIndicator show={savedField === 'notes'} />
                    </div>
                    <Textarea
                      placeholder="Add internal notes about this lead..."
                      value={internalNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Notes auto-save after 1 second
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex gap-2">
                {lead.conversation_id && (
                  <Button variant="outline" className="flex-1" onClick={handleViewConversation}>
                    <LinkExternal02 className="h-4 w-4 mr-2" />
                    View Conversation
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  aria-label="Delete lead"
                >
                  <Trash02 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};