import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
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
  File06,
  Plus,
  XClose,
  Building07,
  Link01,
  ChevronRight,
  ChevronLeft,
  MessageChatCircle,
  MessageTextSquare01,
  Copy01,
  Hash01,
  Browser,
  ClockStopwatch,
} from '@untitledui/icons';
import { toast } from 'sonner';

// Helper to get appropriate icon for custom field based on field name
const getCustomFieldIcon = (fieldName: string) => {
  const lowerName = fieldName.toLowerCase();
  
  if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('cell') || lowerName.includes('tel')) {
    return Phone01;
  }
  if (lowerName.includes('message') || lowerName.includes('note') || lowerName.includes('comment') || lowerName.includes('question')) {
    return MessageTextSquare01;
  }
  if (lowerName.includes('email') || lowerName.includes('mail')) {
    return Mail01;
  }
  if (lowerName.includes('company') || lowerName.includes('organization') || lowerName.includes('business')) {
    return Building07;
  }
  if (lowerName.includes('website') || lowerName.includes('url') || lowerName.includes('link')) {
    return Link01;
  }
  return File06;
};
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

interface PageVisit {
  url: string;
  entered_at: string;
  duration_ms: number;
}

interface ReferrerJourney {
  referrer_url: string | null;
  landing_page: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  entry_type?: 'direct' | 'organic' | 'referral' | 'social' | 'paid' | 'email';
}

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
  device?: string;
  browser?: string;
  os?: string;
  referrer_url?: string;
  referer_url?: string; // Alternative spelling from edge function
  session_started_at?: string;
  first_message_at?: string;
  messages_count?: number;
  tags?: string[];
  priority?: 'not_set' | 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  notes?: string;
  visited_pages?: PageVisit[];
  referrer_journey?: ReferrerJourney;
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
  normal: 'bg-info/10 text-info',
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

  // Build accordion default values - always open contact and session
  const defaultOpenSections = ['contact', 'session'];

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
        <Accordion 
          type="multiple" 
          defaultValue={defaultOpenSections}
          className="bg-transparent border-0 rounded-none px-0"
        >
          {/* Contact Info */}
          <AccordionItem value="contact" className="border-b px-4">
            <AccordionTrigger 
              className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:no-underline"
              showIcon={true}
            >
              Contact Info
            </AccordionTrigger>
            <AccordionContent className="pb-4">
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
                    <a 
                      href={`mailto:${metadata.lead_email}`}
                      className="truncate text-primary hover:underline"
                    >
                      {metadata.lead_email}
                    </a>
                  </div>
                )}
                {metadata.lead_phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`tel:${metadata.lead_phone}`}
                      className="truncate text-primary hover:underline"
                    >
                      {metadata.lead_phone}
                    </a>
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

                {/* Custom Fields */}
                {metadata.custom_fields && Object.keys(metadata.custom_fields).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed space-y-2">
                    {Object.entries(metadata.custom_fields).map(([key, value]) => {
                      const IconComponent = getCustomFieldIcon(key);
                      const lowerKey = key.toLowerCase();
                      const isPhoneField = lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('cell') || lowerKey.includes('tel');
                      
                      return (
                        <div key={key} className="flex items-start gap-2.5 text-sm">
                          <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-muted-foreground">{key}:</span>{' '}
                            {isPhoneField ? (
                              <a 
                                href={`tel:${String(value)}`}
                                className="break-words text-primary hover:underline"
                              >
                                {String(value)}
                              </a>
                            ) : (
                              <span className="break-words">{String(value)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Session Info */}
          <AccordionItem value="session" className="border-b px-4">
            <AccordionTrigger 
              className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:no-underline"
              showIcon={true}
            >
              Session Info
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2.5">
                {/* Chat ID */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2.5 text-sm group">
                      <Hash01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono text-xs truncate max-w-[140px]">
                        {conversation.id}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(conversation.id);
                          toast.success('Chat ID copied to clipboard');
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
                      >
                        <Copy01 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Chat ID: {conversation.id}</TooltipContent>
                </Tooltip>
                
                {/* Chat Duration */}
                {metadata.session_started_at && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2.5 text-sm">
                        <ClockStopwatch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          Duration: {formatDistanceToNow(new Date(metadata.session_started_at))}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Time since conversation started</TooltipContent>
                  </Tooltip>
                )}
                
                {/* Channel */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2.5 text-sm">
                      <ChannelIcon channel={conversation.channel || 'widget'} />
                      <span>{getChannelLabel(conversation.channel || 'widget')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Source channel for this conversation</TooltipContent>
                </Tooltip>
                {metadata.country && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Globe01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          {metadata.city ? `${metadata.city}, ` : ''}{metadata.country}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Visitor's geographic location</TooltipContent>
                  </Tooltip>
                )}
                {metadata.ip_address && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2.5 text-sm">
                        <span className="text-muted-foreground text-xs w-4 text-center">IP</span>
                        <span className="font-mono text-xs">{metadata.ip_address}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Visitor's IP address</TooltipContent>
                  </Tooltip>
                )}
                {(metadata.device_type || metadata.device) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Monitor01 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="capitalize">
                          {getDeviceIcon()} {metadata.device_type || metadata.device}
                          {metadata.browser && ` • ${metadata.browser}`}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Device and browser information</TooltipContent>
                  </Tooltip>
                )}
                {metadata.os && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2.5 text-sm">
                        <span className="text-muted-foreground text-xs w-4 text-center">OS</span>
                        <span>{metadata.os}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Operating system</TooltipContent>
                  </Tooltip>
                )}
                {(metadata.referrer_url || metadata.referer_url) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-2.5 text-sm">
                        <Link01 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="truncate text-xs text-muted-foreground">
                          {metadata.referrer_url || metadata.referer_url}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Page where conversation started</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>
                        Started {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>When this conversation began</TooltipContent>
                </Tooltip>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* User Journey (Referrer) - Conditional */}
          {metadata.referrer_journey && (
            <AccordionItem value="journey" className="border-b px-4">
              <AccordionTrigger 
                className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:no-underline"
                showIcon={true}
              >
                User Journey
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-2.5">
                  {/* Entry Type Badge */}
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="text-muted-foreground text-xs">Source:</span>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs capitalize",
                        metadata.referrer_journey.entry_type === 'organic' && "bg-success/10 text-success",
                        metadata.referrer_journey.entry_type === 'paid' && "bg-warning/10 text-warning",
                        metadata.referrer_journey.entry_type === 'social' && "bg-info/10 text-info",
                        metadata.referrer_journey.entry_type === 'email' && "bg-primary/10 text-primary",
                        metadata.referrer_journey.entry_type === 'referral' && "bg-muted text-muted-foreground",
                        metadata.referrer_journey.entry_type === 'direct' && "bg-muted text-muted-foreground",
                      )}
                    >
                      {metadata.referrer_journey.entry_type || 'direct'}
                    </Badge>
                  </div>
                  
                  {/* Referrer URL */}
                  {metadata.referrer_journey.referrer_url && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-start gap-2.5 text-sm">
                          <Link01 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground">Referred from:</div>
                            <div className="truncate text-xs">
                              {(() => {
                                try {
                                  const url = new URL(metadata.referrer_journey.referrer_url!);
                                  return url.hostname;
                                } catch {
                                  return metadata.referrer_journey.referrer_url;
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <div className="text-xs break-all">{metadata.referrer_journey.referrer_url}</div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Landing Page */}
                  {metadata.referrer_journey.landing_page && !metadata.referrer_journey.landing_page.includes('widget.html') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-start gap-2.5 text-sm">
                          <Browser className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-muted-foreground">Landing page:</span>{' '}
                            <span className="truncate">
                              {(() => {
                                try {
                                  const url = new URL(metadata.referrer_journey.landing_page!);
                                  return url.pathname + url.search || '/';
                                } catch {
                                  return metadata.referrer_journey.landing_page;
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <div className="text-xs break-all">{metadata.referrer_journey.landing_page}</div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* UTM Parameters */}
                  {(metadata.referrer_journey.utm_source || metadata.referrer_journey.utm_campaign) && (
                    <div className="mt-2 pt-2 border-t border-dashed space-y-1.5">
                      {metadata.referrer_journey.utm_source && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-16">Source:</span>
                          <span className="font-medium">{metadata.referrer_journey.utm_source}</span>
                        </div>
                      )}
                      {metadata.referrer_journey.utm_medium && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-16">Medium:</span>
                          <span className="font-medium">{metadata.referrer_journey.utm_medium}</span>
                        </div>
                      )}
                      {metadata.referrer_journey.utm_campaign && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-16">Campaign:</span>
                          <span className="font-medium">{metadata.referrer_journey.utm_campaign}</span>
                        </div>
                      )}
                      {metadata.referrer_journey.utm_term && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-16">Term:</span>
                          <span className="font-medium">{metadata.referrer_journey.utm_term}</span>
                        </div>
                      )}
                      {metadata.referrer_journey.utm_content && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-16">Content:</span>
                          <span className="font-medium">{metadata.referrer_journey.utm_content}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Visited Pages - Conditional */}
          {metadata.visited_pages && metadata.visited_pages.filter(v => !v.url.includes('widget.html')).length > 0 && (
            <AccordionItem value="pages" className="border-b px-4">
              <AccordionTrigger 
                className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:no-underline"
                showIcon={true}
              >
                Visited Pages ({metadata.visited_pages.filter(v => !v.url.includes('widget.html')).length})
              </AccordionTrigger>
              <AccordionContent className="pb-4 overflow-visible">
                <div className="flex flex-col overflow-visible">
                  {metadata.visited_pages
                    .filter(visit => !visit.url.includes('widget.html'))
                    .map((visit, index, filteredPages) => {
                    const isLast = index === filteredPages.length - 1;
                    const isCurrentlyActive = isLast && visit.duration_ms === 0;
                    
                    const formatDuration = (ms: number) => {
                      const seconds = Math.floor(ms / 1000);
                      if (seconds === 0) return '< 1s';
                      if (seconds < 60) return `${seconds}s`;
                      const minutes = Math.floor(seconds / 60);
                      const remainingSeconds = seconds % 60;
                      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
                    };
                    
                    // Extract page name from URL
                    let pageName = 'Page';
                    let fullUrl = visit.url;
                    try {
                      const url = new URL(visit.url);
                      if (url.pathname === '/') {
                        pageName = 'Homepage';
                      } else {
                        const pathParts = url.pathname.split('/').filter(Boolean);
                        const lastPart = pathParts[pathParts.length - 1] || 'Page';
                        pageName = lastPart
                          .replace(/-/g, ' ')
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                      }
                    } catch {
                      // Keep default if parsing fails
                    }
                    
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div className="flex gap-3">
                            {/* Timeline dot and line */}
                            <div className="flex flex-col items-center">
                              <div className="relative flex items-center justify-center mt-1 flex-shrink-0">
                                {/* Solid dot with ring pulse animation */}
                                <div className={cn(
                                  "w-2.5 h-2.5 rounded-full",
                                  isCurrentlyActive 
                                    ? "bg-success animate-pulse-ring" 
                                    : "bg-muted-foreground/40"
                                )} />
                              </div>
                              {!isLast && (
                                <div className="w-px flex-1 bg-border mt-1.5 min-h-[16px]" />
                              )}
                            </div>
                            
                            {/* Page info */}
                            <div className="flex-1 pb-3 min-w-0">
                              <div className="font-medium text-sm truncate">{pageName}</div>
                              <div className="text-xs text-muted-foreground">
                                {isCurrentlyActive ? 'Currently viewing' : formatDuration(visit.duration_ms)}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="text-xs break-all">{fullUrl}</div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Priority */}
          <AccordionItem value="priority" className="border-b px-4">
            <AccordionTrigger 
              className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:no-underline"
              showIcon={true}
            >
              Priority
            </AccordionTrigger>
            <AccordionContent className="pb-4">
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
                      <span className="w-2 h-2 rounded-full bg-info" />
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
            </AccordionContent>
          </AccordionItem>

          {/* Tags */}
          <AccordionItem value="tags" className="border-b px-4">
            <AccordionTrigger 
              className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:no-underline"
              showIcon={true}
            >
              Tags {(metadata.tags?.length || 0) > 0 && `(${metadata.tags?.length})`}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
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
            </AccordionContent>
          </AccordionItem>

          {/* Notes */}
          <AccordionItem value="notes" className="border-b-0 px-4">
            <AccordionTrigger 
              className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:no-underline"
              showIcon={true}
            >
              Internal Notes
            </AccordionTrigger>
            <AccordionContent className="pb-4">
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
                <div className="space-y-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3">
                    {metadata.notes}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
