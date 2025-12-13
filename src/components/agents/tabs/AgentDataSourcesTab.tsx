/**
 * AgentDataSourcesTab Component
 * 
 * Unified tab combining Knowledge Sources, Locations, and Properties.
 * Provides a single entry point for all agent data ingestion with auto-detection.
 * 
 * @module components/agents/tabs/AgentDataSourcesTab
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Database01, Globe01, MarkerPin01, Building07, Plus, ChevronDown, ChevronRight } from '@untitledui/icons';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { useProperties } from '@/hooks/useProperties';
import { useLocations } from '@/hooks/useLocations';
import { KnowledgeSourceCard } from '@/components/agents/KnowledgeSourceCard';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';
import { LocationDetails } from '@/components/agents/locations/LocationDetails';
import { CreateLocationDialog } from '@/components/agents/locations/CreateLocationDialog';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { LoadingState } from '@/components/ui/loading-state';
import { ZapSolidIcon } from '@/components/ui/zap-solid-icon';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { cn } from '@/lib/utils';

interface AgentDataSourcesTabProps {
  agentId: string;
  userId: string;
}

type DataSourcesTab = 'sources' | 'locations' | 'help-articles';

export const AgentDataSourcesTab = ({ agentId, userId }: AgentDataSourcesTabProps) => {
  const { 
    sources, 
    loading: sourcesLoading, 
    deleteSource, 
    deleteChildSource, 
    reprocessSource, 
    resumeProcessing, 
    retryChildSource, 
    retrainAllSources, 
    triggerManualRefresh, 
    isSourceOutdated, 
    getChildSources, 
    getParentSources 
  } = useKnowledgeSources(agentId);
  
  const { properties, getPropertyCount } = useProperties(agentId);
  const { locations, loading: locationsLoading, createLocation, updateLocation, deleteLocation } = useLocations(agentId);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createLocationDialogOpen, setCreateLocationDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DataSourcesTab>('sources');
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState({ completed: 0, total: 0 });
  
  // Locations state
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locationsExpanded, setLocationsExpanded] = useState(true);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  // Get only parent sources (hide child sources from sitemaps in main list)
  const parentSources = getParentSources();
  const outdatedCount = parentSources.filter(isSourceOutdated).length;

  // Calculate aggregate sitemap processing progress
  const sitemapProgress = useMemo(() => {
    const sitemapSources = parentSources.filter(s => {
      const metadata = s.metadata as Record<string, any> | null;
      return metadata?.is_sitemap;
    });

    let totalPages = 0;
    let readyPages = 0;
    let processingCount = 0;
    let pendingCount = 0;
    let errorCount = 0;

    for (const sitemap of sitemapSources) {
      const children = getChildSources(sitemap.id);
      totalPages += children.length;
      readyPages += children.filter(c => c.status === 'ready').length;
      processingCount += children.filter(c => c.status === 'processing').length;
      pendingCount += children.filter(c => c.status === 'pending').length;
      errorCount += children.filter(c => c.status === 'error').length;
    }

    const isActive = processingCount > 0 || pendingCount > 0;
    const processedPages = readyPages + errorCount;
    const percentage = totalPages > 0 ? Math.round((processedPages / totalPages) * 100) : 0;

    return {
      isActive,
      totalPages,
      processedPages,
      processingCount,
      pendingCount,
      errorCount,
      percentage,
    };
  }, [parentSources, getChildSources]);

  const handleRetrainAll = async () => {
    setIsRetraining(true);
    setRetrainProgress({ completed: 0, total: sources.filter(s => s.status !== 'processing').length });
    
    try {
      const { success, failed } = await retrainAllSources((completed, total) => {
        setRetrainProgress({ completed, total });
      });

      if (failed === 0) {
        toast.success('Retraining complete', {
          description: `Successfully retrained ${success} knowledge sources.`,
        });
      } else {
        toast.warning('Retraining completed with errors', {
          description: `${success} succeeded, ${failed} failed.`,
        });
      }
    } catch (error: unknown) {
      toast.error('Retraining failed', { description: getErrorMessage(error) });
    } finally {
      setIsRetraining(false);
      setRetrainProgress({ completed: 0, total: 0 });
    }
  };

  const handleCreateLocation = async (data: Parameters<typeof createLocation>[0]) => {
    const id = await createLocation(data, userId);
    if (id) {
      setSelectedLocationId(id);
      setCreateLocationDialogOpen(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteLocationId) return;
    const success = await deleteLocation(deleteLocationId);
    if (success && selectedLocationId === deleteLocationId) {
      setSelectedLocationId(null);
    }
    setDeleteLocationId(null);
  };

  const menuItems = [
    { 
      id: 'sources' as const, 
      label: 'Knowledge Sources',
      description: 'Add URLs, sitemaps, property feeds, or documents to train your agent'
    },
    { 
      id: 'locations' as const, 
      label: 'Locations',
      description: 'Manage communities, connect calendars, and configure business hours'
    },
    { 
      id: 'help-articles' as const, 
      label: 'Help Articles',
      description: 'Create and organize help articles that your agent can reference and share'
    },
  ];

  const loading = sourcesLoading || locationsLoading;

  if (loading) {
    return <LoadingState text="Loading data sources..." />;
  }

  return (
    <AgentSettingsLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as DataSourcesTab)}
      menuItems={menuItems}
      title="Data Sources"
      description={menuItems.find(item => item.id === activeTab)?.description || ''}
    >
      {activeTab === 'sources' && (
        <div className="space-y-4">
          {/* Sitemap Processing Progress Banner */}
          {sitemapProgress.isActive && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Globe01 className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-sm font-medium">
                    Processing sitemap: {sitemapProgress.processedPages}/{sitemapProgress.totalPages} pages
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {sitemapProgress.processingCount} active, {sitemapProgress.pendingCount} queued
                  </span>
                </div>
                <Progress value={sitemapProgress.percentage} variant="success" animated={sitemapProgress.percentage < 100} className="h-1.5" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            {sources.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetrainAll}
                disabled={isRetraining || sources.every(s => s.status === 'processing')}
              >
                <ZapSolidIcon size={16} className={`mr-1.5 text-orange-500 ${isRetraining ? 'animate-pulse' : ''}`} />
                {isRetraining 
                  ? `Retraining ${retrainProgress.completed}/${retrainProgress.total}...`
                  : outdatedCount > 0 
                    ? `Retrain AI (${outdatedCount} outdated)`
                    : 'Retrain AI'
                }
              </Button>
            )}
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              Add Source
            </Button>
          </div>

          {parentSources.length === 0 ? (
            <EmptyState
              icon={<Database01 className="h-5 w-5 text-muted-foreground/50" />}
              title="No knowledge sources configured yet"
              description="Add documents, URLs, sitemaps, or property feeds to enhance your agent's knowledge"
              action={<Button onClick={() => setAddDialogOpen(true)} size="sm">Add Your First Source</Button>}
            />
          ) : (
            <div className="grid gap-3">
              {parentSources.map((source) => {
                const locationId = (source as any).default_location_id;
                const location = locationId ? locations.find(l => l.id === locationId) : null;
                const sourceType = (source as any).source_type;
                
                return (
                  <KnowledgeSourceCard
                    key={source.id}
                    source={source}
                    onDelete={deleteSource}
                    onReprocess={reprocessSource}
                    onResume={resumeProcessing}
                    onRetryChild={retryChildSource}
                    onDeleteChild={deleteChildSource}
                    onRefreshNow={triggerManualRefresh}
                    isOutdated={isSourceOutdated(source)}
                    childSources={getChildSources(source.id)}
                    propertyCount={sourceType === 'property_listings' ? getPropertyCount(source.id) : undefined}
                    locationName={location?.name}
                  />
                );
              })}
            </div>
          )}

          <AddKnowledgeDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            agentId={agentId}
            userId={userId}
          />
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="flex gap-6 h-full min-h-0">
          {/* Left Panel - Location List */}
          <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {locations.length} Location{locations.length !== 1 ? 's' : ''}
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateLocationDialogOpen(true)}
              >
                <Plus size={14} className="mr-1.5" />
                Add
              </Button>
            </div>
            
            {locations.length === 0 ? (
              <EmptyState
                icon={<MarkerPin01 className="h-5 w-5 text-muted-foreground/50" />}
                title="No locations yet"
                description="Add locations to organize properties, connect calendars, and enable routing."
                action={
                  <Button onClick={() => setCreateLocationDialogOpen(true)} size="sm">
                    <Plus size={14} className="mr-1.5" />
                    Add Location
                  </Button>
                }
              />
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-1 pr-4">
                  {locations.map((location) => {
                    const propertyCount = properties.filter(p => p.location_id === location.id).length;
                    const isSelected = selectedLocationId === location.id;
                    
                    return (
                      <button
                        key={location.id}
                        onClick={() => setSelectedLocationId(location.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-transparent hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{location.name}</div>
                            {location.city && location.state && (
                              <div className="text-xs text-muted-foreground truncate">
                                {location.city}, {location.state}
                              </div>
                            )}
                          </div>
                          {propertyCount > 0 && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Right Panel - Location Details */}
          <div className="flex-1 min-h-0">
          {selectedLocation ? (
              <LocationDetails
                location={selectedLocation}
                agentId={agentId}
                onUpdate={updateLocation}
              />
            ) : locations.length > 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a location to view details
              </div>
            ) : null}
          </div>

          <CreateLocationDialog
            open={createLocationDialogOpen}
            onOpenChange={setCreateLocationDialogOpen}
            onCreate={handleCreateLocation}
          />

          <SimpleDeleteDialog
            open={!!deleteLocationId}
            onOpenChange={(open) => !open && setDeleteLocationId(null)}
            onConfirm={handleDeleteLocation}
            title="Delete Location"
            description="This will permanently delete this location and unlink any associated properties. This action cannot be undone."
          />
        </div>
      )}

      {activeTab === 'help-articles' && (
        <HelpArticlesManager agentId={agentId} userId={userId} />
      )}
    </AgentSettingsLayout>
  );
};
