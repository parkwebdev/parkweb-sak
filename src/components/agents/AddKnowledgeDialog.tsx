/**
 * AddKnowledgeDialog Component
 * 
 * Dialog for adding knowledge sources to an agent.
 * Supports file uploads (PDF, CSV, JSON, XML), URLs, sitemaps, property listings, and text input.
 * Includes plan limit checking, refresh strategy configuration, and location assignment.
 * @module components/agents/AddKnowledgeDialog
 */

import React, { useState } from 'react';
import { FormHint } from '@/components/ui/form-hint';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { useLocations } from '@/hooks/useLocations';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Upload01, Link03, File01, AlertCircle, Globe01, ChevronDown, ChevronUp, Building07 } from '@untitledui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { KnowledgeType, KnowledgeSourceType, RefreshStrategy } from '@/types/metadata';
import { REFRESH_STRATEGY_LABELS, SOURCE_TYPE_LABELS } from '@/types/metadata';

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
  const { uploadDocument, addUrlSource, addTextSource, addSitemapSource, addPropertyListingSource } = useKnowledgeSources(agentId);
  const { locations } = useLocations(agentId);
  const { canAddKnowledgeSource, showLimitWarning } = usePlanLimits();
  const limitCheck = canAddKnowledgeSource();
  
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textName, setTextName] = useState('');
  
  // Property listings state
  const [propertyUrl, setPropertyUrl] = useState('');
  const [propertyRefreshStrategy, setPropertyRefreshStrategy] = useState<RefreshStrategy>('daily');
  const [propertyLocationId, setPropertyLocationId] = useState<string>('');
  
  // URL with refresh state
  const [urlRefreshStrategy, setUrlRefreshStrategy] = useState<RefreshStrategy>('manual');
  
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
      await addUrlSource(url, agentId, userId, { refreshStrategy: urlRefreshStrategy });
      setUrl('');
      setUrlRefreshStrategy('manual');
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

  const handlePropertyListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!limitCheck.allowed) {
      showLimitWarning('knowledge sources', limitCheck, 'add');
      return;
    }
    if (!propertyUrl) return;

    setUploading(true);
    try {
      await addPropertyListingSource(propertyUrl, agentId, userId, {
        refreshStrategy: propertyRefreshStrategy,
        locationId: propertyLocationId || undefined,
      });
      
      // Reset form
      setPropertyUrl('');
      setPropertyRefreshStrategy('daily');
      setPropertyLocationId('');
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
            Upload documents, add URLs, crawl sitemaps, import property listings, or paste content to train your agent
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
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="properties">
              <Building07 className="h-4 w-4 mr-2" />
              Properties
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
              
              <div>
                <Label htmlFor="url-refresh">Auto-Refresh</Label>
                <Select value={urlRefreshStrategy} onValueChange={(v) => setUrlRefreshStrategy(v as RefreshStrategy)}>
                  <SelectTrigger id="url-refresh">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REFRESH_STRATEGY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormHint>How often should we check for content updates?</FormHint>
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
                      <FormHint>Comma-separated URL patterns to skip. Use * as wildcard.</FormHint>
                    </div>
                    
                    <div>
                      <Label htmlFor="include-patterns">Include Patterns (optional)</Label>
                      <Input
                        id="include-patterns"
                        placeholder="/blog/*, /docs/*"
                        value={includePatterns}
                        onChange={(e) => setIncludePatterns(e.target.value)}
                      />
                      <FormHint>Only process URLs matching these patterns. Leave empty to include all.</FormHint>
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
                      <FormHint>Maximum number of pages to crawl (1-500).</FormHint>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button type="submit" disabled={!sitemapUrl} loading={uploading}>
                Crawl Sitemap
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <form onSubmit={handlePropertyListingSubmit} className="space-y-4">
              <div>
                <Label htmlFor="property-url">Property Listings URL</Label>
                <Input
                  id="property-url"
                  type="url"
                  placeholder="https://example.com/available-homes"
                  value={propertyUrl}
                  onChange={(e) => setPropertyUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  For non-WordPress sites. We'll use AI to extract property listings from this page.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Tip: If you have a WordPress site with ACF, use the WordPress sync in the Locations tab instead for structured data.
                </p>
              </div>

              <div>
                <Label htmlFor="property-refresh">Refresh Frequency</Label>
                <Select value={propertyRefreshStrategy} onValueChange={(v) => setPropertyRefreshStrategy(v as RefreshStrategy)}>
                  <SelectTrigger id="property-refresh">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REFRESH_STRATEGY_LABELS).filter(([v]) => v !== 'manual').map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormHint>How often should we check for new/updated listings?</FormHint>
              </div>

              {locations.length > 0 && (
                <div>
                  <Label htmlFor="property-location">Assign to Location (optional)</Label>
                  <Select value={propertyLocationId} onValueChange={setPropertyLocationId}>
                    <SelectTrigger id="property-location">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No location</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormHint>Link these properties to a specific community/location</FormHint>
                </div>
              )}

              <Button type="submit" disabled={!propertyUrl} loading={uploading}>
                Import Property Listings
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
