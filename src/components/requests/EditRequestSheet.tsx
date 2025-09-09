import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Request } from "@/hooks/useRequests";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatusDropdown } from "./StatusDropdown";
import { PriorityDropdown } from "./PriorityDropdown";

interface EditRequestSheetProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export const EditRequestSheet = ({ request, open, onOpenChange, onUpdate }: EditRequestSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Request['status']>('to_do');
  const [priority, setPriority] = useState<Request['priority']>('medium');
  const { toast } = useToast();

  // Update form fields when request changes
  useEffect(() => {
    if (request) {
      setTitle(request.title);
      setDescription(request.description);
      setStatus(request.status);
      setPriority(request.priority);
    }
  }, [request]);

  const handleSave = async () => {
    if (!request) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          title,
          description,
          status,
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Request Updated",
        description: "Request has been successfully updated",
      });

      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="space-y-2">
            <SheetTitle className="text-xl">Edit Request</SheetTitle>
            <SheetDescription>
              Make changes to the request details below.
            </SheetDescription>
          </div>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter request title"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter request description"
                rows={4}
                className="w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <StatusDropdown
                  status={status}
                  onStatusChange={setStatus}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <PriorityDropdown
                  priority={priority}
                  onPriorityChange={setPriority}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3 text-base">Client Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Client Name</Label>
                  <Input value={request.client_name} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Client Email</Label>
                  <Input value={request.client_email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Company</Label>
                  <Input value={request.company_name} disabled className="bg-muted" />
                </div>
                {request.website_url && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Website</Label>
                    <Input value={request.website_name || request.website_url} disabled className="bg-muted" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};