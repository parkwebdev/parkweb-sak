import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash02, Save01, LinkExternal02 } from '@untitledui/icons';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
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
  const [editedLead, setEditedLead] = useState<Partial<Tables<'leads'>>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!lead) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(lead.id, editedLead);
    setEditedLead({});
    setIsSaving(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this lead?')) {
      onDelete(lead.id);
      onOpenChange(false);
    }
  };

  const currentData = { ...lead, ...editedLead };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Lead Details</span>
            <div className="flex items-center gap-2">
              <LeadStatusDropdown
                status={currentData.status}
                onStatusChange={(status) => setEditedLead({ ...editedLead, status: status as any })}
              />
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            
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
              <Input
                id="phone"
                value={currentData.phone || ''}
                onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={currentData.company || ''}
                onChange={(e) => setEditedLead({ ...editedLead, company: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* Additional Data */}
          {currentData.data && Object.keys(currentData.data as object).length > 0 && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold">Additional Information</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(currentData.data as object).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata */}
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
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/conversations?id=${lead.conversation_id}`}>
                    <LinkExternal02 className="h-4 w-4 mr-2" />
                    View Conversation
                  </a>
                </Button>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || Object.keys(editedLead).length === 0}
              className="flex-1"
            >
              <Save01 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
            >
              <Trash02 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
