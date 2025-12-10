import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Database01, Globe01 } from '@untitledui/icons';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { KnowledgeSourceCard } from '@/components/agents/KnowledgeSourceCard';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { LoadingState } from '@/components/ui/loading-state';
import { ZapSolidIcon } from '@/components/ui/zap-solid-icon';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';

interface AgentKnowledgeTabProps {
  agentId: string;
  userId: string;
}

type KnowledgeTab = 'knowledge-sources' | 'help-articles';

export const AgentKnowledgeTab = ({ agentId, userId }: AgentKnowledgeTabProps) => {
  const { sources, loading, deleteSource, deleteChildSource, reprocessSource, resumeProcessing, retryChildSource, retrainAllSources, isSourceOutdated, getChildSources, getParentSources } = useKnowledgeSources(agentId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('knowledge-sources');
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState({ completed: 0, total: 0 });

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

  const menuItems = [
    { 
      id: 'knowledge-sources' as const, 
      label: 'Knowledge Sources',
      description: 'Add documents, URLs, or custom content to enhance your agent\'s knowledge'
    },
    { 
      id: 'help-articles' as const, 
      label: 'Help Articles',
      description: 'Create and organize help articles that your agent can reference and share'
    },
  ];

  if (loading) {
    return <LoadingState text="Loading knowledge sources..." />;
  }

  return (
    <AgentSettingsLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as KnowledgeTab)}
      menuItems={menuItems}
      title="Knowledge"
      description={menuItems.find(item => item.id === activeTab)?.description || ''}
    >
      {activeTab === 'knowledge-sources' && (
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
                <ZapSolidIcon size={16} className={`mr-1.5 ${isRetraining ? 'animate-pulse' : ''}`} />
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
              description="Add documents, URLs, sitemaps, or custom content to enhance your agent's knowledge"
              action={<Button onClick={() => setAddDialogOpen(true)} size="sm">Add Your First Source</Button>}
            />
          ) : (
            <div className="grid gap-3">
              {parentSources.map((source) => (
                <KnowledgeSourceCard
                  key={source.id}
                  source={source}
                  onDelete={deleteSource}
                  onReprocess={reprocessSource}
                  onResume={resumeProcessing}
                  onRetryChild={retryChildSource}
                  onDeleteChild={deleteChildSource}
                  isOutdated={isSourceOutdated(source)}
                  childSources={getChildSources(source.id)}
                />
              ))}
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

      {activeTab === 'help-articles' && (
        <HelpArticlesManager agentId={agentId} userId={userId} />
      )}
    </AgentSettingsLayout>
  );
};
