/**
 * @fileoverview Lead details sheet with editable fields and actions.
 * Displays contact info, custom data, timeline, and related conversation link.
 * Sheet is always mounted to ensure proper open/close animations.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { PhoneInputField } from '@/components/ui/phone-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash02, Save01, LinkExternal02, InfoCircle } from '@untitledui/icons';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { SkeletonLeadDetails } from '@/components/ui/page-skeleton';
import type { Tables, Enums, Json } from '@/integrations/supabase/types';
import { LeadStatusDropdown } from './LeadStatusDropdown';

interface LeadDetailsSheetProps {
  lead: Tables<'leads'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Tables<'leads'>>) => void;
  onDelete: (id: string) => void;
}

export const LeadDetailsSheet = ({
  lead,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: LeadDetailsSheetProps) => {
  const navigate = useNavigate();
  const [editedLead, setEditedLead] = useState<Partial<Tables<'leads'>>>({});
  const [editedCustomData, setEditedCustomData] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset edited state when lead changes
  useEffect(() => {
    setEditedLead({});
    setEditedCustomData({});
  }, [lead?.id]);

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

  const handleSave = async () => {
    if (!lead) return;
    setIsSaving(true);
    
    const currentData = (lead.data || {}) as Record<string, unknown>;
    const mergedData = { ...currentData, ...editedCustomData };
    
    const updates: Partial<Tables<'leads'>> = {
      ...editedLead,
      ...(Object.keys(editedCustomData).length > 0 ? { data: mergedData as Json } : {}),
    };
    
    await onUpdate(lead.id, updates);
    setEditedLead({});
    setEditedCustomData({});
    setIsSaving(false);
  };

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

  // Render input based on value type
  const renderCustomFieldInput = (key: string, value: unknown, currentCustomData: Record<string, unknown>) => {
    const currentValue = currentCustomData[key] ?? value;
    
    // Message fields are read-only
    if (isMessageField(key)) {
      const strValue = String(currentValue || '');
      return (
        <div className="space-y-2">
          <Label>{formatLabel(key)}</Label>
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
            <Label>{formatLabel(key)}</Label>
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
          <Label htmlFor={key}>{formatLabel(key)}</Label>
          <Textarea
            id={key}
            value={strValue}
            onChange={(e) => setEditedCustomData({ ...editedCustomData, [key]: e.target.value })}
            rows={3}
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor={key}>{formatLabel(key)}</Label>
        <Input
          id={key}
          value={strValue}
          onChange={(e) => setEditedCustomData({ ...editedCustomData, [key]: e.target.value })}
        />
      </div>
    );
  };

  // Parse name into first and last
  const currentName = { ...lead, ...editedLead }.name || '';
  const nameParts = currentName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const handleNameChange = (first: string, last: string) => {
    const fullName = [first, last].filter(Boolean).join(' ');
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
              <SheetTitle className="flex items-center justify-between">
                <span>Lead Details</span>
                <div className="flex items-center gap-2">
                  <LeadStatusDropdown
                    status={{ ...lead, ...editedLead }.status}
                    onStatusChange={(status) => setEditedLead({ ...editedLead, status: status as Enums<'lead_status'> })}
                  />
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => handleNameChange(e.target.value, lastName)}
                      className="bg-muted/50 border-transparent focus:border-input focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => handleNameChange(firstName, e.target.value)}
                      className="bg-muted/50 border-transparent focus:border-input focus:bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={{ ...lead, ...editedLead }.email || ''}
                      onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                      className="bg-muted/50 border-transparent focus:border-input focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
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

              {lead.conversation_id && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Related Conversation</h3>
                    <Button variant="outline" className="w-full" onClick={handleViewConversation}>
                      <LinkExternal02 className="h-4 w-4 mr-2" />
                      View Conversation
                    </Button>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || (Object.keys(editedLead).length === 0 && Object.keys(editedCustomData).length === 0)}
                  className="flex-1"
                >
                  <Save01 className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
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
