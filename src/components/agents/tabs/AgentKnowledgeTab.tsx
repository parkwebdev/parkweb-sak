import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Database01, RefreshCcw01 } from '@untitledui/icons';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { KnowledgeSourceCard } from '@/components/agents/KnowledgeSourceCard';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from '@/lib/toast';

interface AgentKnowledgeTabProps {
  agentId: string;
  userId: string;
}

type KnowledgeTab = 'knowledge-sources' | 'help-articles';

export const AgentKnowledgeTab = ({ agentId, userId }: AgentKnowledgeTabProps) => {
  const { sources, loading, deleteSource, reprocessSource, retrainAllSources, isSourceOutdated, getChildSources, getParentSources } = useKnowledgeSources(agentId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('knowledge-sources');
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState({ completed: 0, total: 0 });

  // Get only parent sources (hide child sources from sitemaps in main list)
  const parentSources = getParentSources();
  const outdatedCount = parentSources.filter(isSourceOutdated).length;

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
    } catch (error: any) {
      toast.error('Retraining failed', { description: error.message });
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
          <div className="flex items-center justify-end gap-2">
            {sources.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetrainAll}
                disabled={isRetraining || sources.every(s => s.status === 'processing')}
              >
                <RefreshCcw01 className={`h-4 w-4 mr-2 ${isRetraining ? 'animate-spin' : ''}`} />
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
