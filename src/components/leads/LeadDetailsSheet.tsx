/**
 * @fileoverview Lead details sheet with editable fields and actions.
 * Displays contact info, custom data, timeline, and related conversation link.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { PhoneInputField } from '@/components/ui/phone-input';
import { Trash02, Save01, LinkExternal02 } from '@untitledui/icons';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
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

  if (!lead) return null;

  const handleSave = async () => {
    setIsSaving(true);
    
    // Merge custom data edits into the lead.data JSONB
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
    onDelete(lead.id);
  };

  const handleViewConversation = () => {
    if (lead.conversation_id) {
      onOpenChange(false);
      navigate(`/conversations?id=${lead.conversation_id}`);
    }
  };

  // Get custom fields from lead.data (excluding internal tracking fields)
  const customFields = useMemo(() => {
    const data = (lead.data || {}) as Record<string, unknown>;
    // Filter out any internal fields we don't want to show
    const internalFields = ['source', 'referrer', 'page_url', 'visitor_id'];
    return Object.entries(data).filter(([key]) => !internalFields.includes(key));
  }, [lead.data]);

  const currentData = { ...lead, ...editedLead };
  const currentCustomData = { ...((lead.data || {}) as Record<string, unknown>), ...editedCustomData };

  const hasChanges = Object.keys(editedLead).length > 0 || Object.keys(editedCustomData).length > 0;

  // Helper to format field label from key
  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Render input based on value type
  const renderCustomFieldInput = (key: string, value: unknown) => {
    const currentValue = currentCustomData[key] ?? value;
    
    if (typeof value === 'boolean' || typeof currentValue === 'boolean') {
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={key}>{formatLabel(key)}</Label>
          <Switch
            id={key}
            checked={Boolean(currentValue)}
            onCheckedChange={(checked) => setEditedCustomData({ ...editedCustomData, [key]: checked })}
          />
        </div>
      );
    }
    
    // Check if it's a long text (textarea)
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Lead Details</span>
            <div className="flex items-center gap-2">
              <LeadStatusDropdown
                status={currentData.status}
                onStatusChange={(status) => setEditedLead({ ...editedLead, status: status as Enums<'lead_status'> })}
              />
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Contact Information - Core fields always shown */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={currentData.name || ''}
                onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={currentData.email || ''}
                onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInputField
                name="phone"
                value={currentData.phone || ''}
                onChange={(phone) => setEditedLead({ ...editedLead, phone })}
              />
            </div>
          </div>

          {/* Dynamic Custom Fields - Only show if there are custom fields */}
          {customFields.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Additional Information</h3>
                {customFields.map(([key, value]) => (
                  <div key={key}>
                    {renderCustomFieldInput(key, value)}
                  </div>
                ))}
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
              disabled={isSaving || !hasChanges}
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
      </SheetContent>
    </Sheet>
  );
};