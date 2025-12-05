import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Database01 } from '@untitledui/icons';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { KnowledgeSourceCard } from '@/components/agents/KnowledgeSourceCard';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { LoadingState } from '@/components/ui/loading-state';

interface AgentKnowledgeTabProps {
  agentId: string;
  userId: string;
}

type KnowledgeTab = 'knowledge-sources' | 'help-articles';

export const AgentKnowledgeTab = ({ agentId, userId }: AgentKnowledgeTabProps) => {
  const { sources, loading, deleteSource, reprocessSource } = useKnowledgeSources(agentId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('knowledge-sources');

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
          <div className="flex items-center justify-end gap-4">
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              Add Source
            </Button>
          </div>

          {sources.length === 0 ? (
            <EmptyState
              icon={<Database01 className="h-5 w-5 text-muted-foreground/50" />}
              title="No knowledge sources configured yet"
              description="Add documents, URLs, or custom content to enhance your agent's knowledge"
              action={<Button onClick={() => setAddDialogOpen(true)} size="sm">Add Your First Source</Button>}
            />
          ) : (
            <div className="grid gap-3">
              {sources.map((source) => (
                <KnowledgeSourceCard
                  key={source.id}
                  source={source}
                  onDelete={deleteSource}
                  onReprocess={reprocessSource}
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
