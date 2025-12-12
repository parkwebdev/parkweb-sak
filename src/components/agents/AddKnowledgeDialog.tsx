/**
 * AddKnowledgeDialog Component
 * 
 * Dialog for adding knowledge sources to an agent.
 * Supports file uploads (PDF, CSV, JSON, XML), URLs, sitemaps, and text input.
 * Includes plan limit checking and sitemap advanced options.
 * @module components/agents/AddKnowledgeDialog
 */

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
import { Upload01, Link03, File01, AlertCircle, Globe01, ChevronDown, ChevronUp } from '@untitledui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { KnowledgeType } from '@/types/metadata';

interface AddKnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  userId: string;
}

export const AddKnowledgeDialog: React.FC<AddKnowledgeDialogProps> = ({
  open,
  onOpenChange,
  agentId,
  userId,
}) => {
  const { uploadDocument, addUrlSource, addTextSource, addSitemapSource } = useKnowledgeSources(agentId);
  const { canAddKnowledgeSource, showLimitWarning } = usePlanLimits();
  const limitCheck = canAddKnowledgeSource();
  
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textName, setTextName] = useState('');
  
  // Sitemap advanced options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [excludePatterns, setExcludePatterns] = useState('');
  const [includePatterns, setIncludePatterns] = useState('');
  const [pageLimit, setPageLimit] = useState(200);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!limitCheck.allowed) {
      showLimitWarning('knowledge sources', limitCheck, 'add');
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file, agentId, userId);
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
      await addUrlSource(url, agentId, userId);
      setUrl('');
      onOpenChange(false);
    } finally {
      setUploading(false);
    }
  };

  const handleSitemapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!limitCheck.allowed) {
      showLimitWarning('knowledge sources', limitCheck, 'add');
      return;
    }
    if (!sitemapUrl) return;

    setUploading(true);
    try {
      // Parse patterns into arrays
      const excludeArray = excludePatterns
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      const includeArray = includePatterns
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      await addSitemapSource(sitemapUrl, agentId, userId, {
        excludePatterns: excludeArray,
        includePatterns: includeArray,
        pageLimit: pageLimit,
      });
      
      // Reset form
      setSitemapUrl('');
      setExcludePatterns('');
      setIncludePatterns('');
      setPageLimit(200);
      setShowAdvancedOptions(false);
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
      await addTextSource(textContent, agentId, userId, 'json' as KnowledgeType, {
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
            Upload documents, add URLs, crawl sitemaps, or paste content to train your agent
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">
              <Upload01 className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link03 className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="sitemap">
              <Globe01 className="h-4 w-4 mr-2" />
              Sitemap
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
              <Button type="submit" disabled={!url} loading={uploading}>
                Add URL
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="sitemap" className="space-y-4">
            <form onSubmit={handleSitemapSubmit} className="space-y-4">
              <div>
                <Label htmlFor="sitemap-url">Sitemap URL</Label>
                <Input
                  id="sitemap-url"
                  type="url"
                  placeholder="https://example.com/sitemap.xml"
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  We'll crawl all pages in your sitemap automatically. Supports sitemap index files with nested sitemaps.
                </p>
              </div>

              <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" type="button" className="flex items-center gap-1 px-0 text-muted-foreground hover:text-foreground">
                    {showAdvancedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Advanced Options
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                    <div>
                      <Label htmlFor="exclude-patterns">Exclude Patterns</Label>
                      <Input
                        id="exclude-patterns"
                        placeholder="/tag/*, /author/*, /category/*"
                        value={excludePatterns}
                        onChange={(e) => setExcludePatterns(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Comma-separated URL patterns to skip. Use * as wildcard.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="include-patterns">Include Patterns (optional)</Label>
                      <Input
                        id="include-patterns"
                        placeholder="/blog/*, /docs/*"
                        value={includePatterns}
                        onChange={(e) => setIncludePatterns(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Only process URLs matching these patterns. Leave empty to include all.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="page-limit">Page Limit</Label>
                      <Input
                        id="page-limit"
                        type="number"
                        min={1}
                        max={500}
                        value={pageLimit}
                        onChange={(e) => setPageLimit(Math.min(500, Math.max(1, parseInt(e.target.value) || 200)))}
                        className="w-32"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum number of pages to crawl (1-500).
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button type="submit" disabled={!sitemapUrl} loading={uploading}>
                Crawl Sitemap
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
              <Button type="submit" disabled={!textContent} loading={uploading}>
                Add Content
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
