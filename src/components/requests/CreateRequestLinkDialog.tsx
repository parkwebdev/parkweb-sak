import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy01 as Copy, LinkExternal01 as ExternalLink } from "@untitledui/icons";
import { useToast } from "@/hooks/use-toast";

interface CreateRequestLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRequestLinkDialog = ({ open, onOpenChange }: CreateRequestLinkDialogProps) => {
  const [clientName, setClientName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const { toast } = useToast();

  const handleGenerateLink = () => {
    // Generate a unique link - in real app this would call an API
    const linkId = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/client-request/${linkId}`;
    setGeneratedLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
      title: "Link copied",
      description: "The request link has been copied to your clipboard."
    });
  };

  const openInNewTab = () => {
    window.open(generatedLink, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Client Request Link</DialogTitle>
          <DialogDescription>
            Generate a unique link for your client to submit website change requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client/Company Name</Label>
            <Input
              id="clientName"
              placeholder="e.g., Acme Corporation"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              placeholder="e.g., https://acmecorp.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional notes about this client or project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {generatedLink && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>Generated Link</Label>
              <div className="flex items-center gap-2">
                <Input value={generatedLink} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={openInNewTab}>
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateLink} disabled={!clientName.trim()}>
              Generate Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};