import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Upload01, Link03, File01, AlertCircle } from '@untitledui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddKnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  orgId: string;
}

export const AddKnowledgeDialog: React.FC<AddKnowledgeDialogProps> = ({
  open,
  onOpenChange,
  agentId,
  orgId,
}) => {
  const { uploadDocument, addUrlSource, addTextSource } = useKnowledgeSources(agentId);
  const { canAddKnowledgeSource, showLimitWarning } = usePlanLimits();
  const limitCheck = canAddKnowledgeSource();
  
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textName, setTextName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!limitCheck.allowed) {
      showLimitWarning('knowledge sources', limitCheck, 'add');
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file, agentId, orgId);
      onOpenChange(false);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!limitCheck.allowed) {
      showLimitWarning('knowledge sources', limitCheck, 'add');
      return;
    }
    if (!url) return;

    setUploading(true);
    try {
      await addUrlSource(url, agentId, orgId);
      setUrl('');
      onOpenChange(false);
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent) return;

    if (!limitCheck.allowed) {
      showLimitWarning('knowledge sources', limitCheck, 'add');
      return;
    }

    setUploading(true);
    try {
      await addTextSource(textContent, 'json', agentId, orgId, {
        name: textName || 'Custom Text',
      });
      setTextContent('');
      setTextName('');
      onOpenChange(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Knowledge Source</DialogTitle>
          <DialogDescription>
            Upload documents, add URLs, or paste content to train your agent
          </DialogDescription>
        </DialogHeader>

        {limitCheck.isAtLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached your plan limit of {limitCheck.limit} knowledge sources. Upgrade to add more.
            </AlertDescription>
          </Alert>
        )}

        {limitCheck.isNearLimit && !limitCheck.isAtLimit && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're using {limitCheck.current} of {limitCheck.limit} knowledge sources ({Math.round(limitCheck.percentage)}%).
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">
              <Upload01 className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link03 className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="text">
              <File01 className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload01 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload PDF, CSV, JSON, or XML files
              </p>
              <Input
                type="file"
                accept=".pdf,.csv,.json,.xml"
                onChange={handleFileUpload}
                disabled={uploading}
                className="max-w-xs mx-auto"
              />
              {uploading && (
                <p className="text-sm text-muted-foreground mt-4">
                  Uploading and processing...
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/docs"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  We'll fetch and process the content from this URL
                </p>
              </div>
              <Button type="submit" disabled={uploading || !url}>
                {uploading ? 'Adding...' : 'Add URL'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <Label htmlFor="text-name">Name (Optional)</Label>
                <Input
                  id="text-name"
                  placeholder="Product Documentation"
                  value={textName}
                  onChange={(e) => setTextName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="text-content">Content</Label>
                <Textarea
                  id="text-content"
                  placeholder="Paste your content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={10}
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Add custom text, FAQs, product information, or any content you want your agent to learn
                </p>
              </div>
              <Button type="submit" disabled={uploading || !textContent}>
                {uploading ? 'Adding...' : 'Add Content'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
