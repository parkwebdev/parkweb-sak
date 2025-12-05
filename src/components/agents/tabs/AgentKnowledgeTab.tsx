import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { Database01 } from '@untitledui/icons';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { KnowledgeSourceCard } from '@/components/agents/KnowledgeSourceCard';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';

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
    return <div className="text-center py-8 text-muted-foreground">Loading knowledge sources...</div>;
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
            <div className="text-center py-12 px-8 rounded-lg border border-dashed bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3">
                <Database01 className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                No knowledge sources configured yet
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Add documents, URLs, or custom content to enhance your agent's knowledge
              </p>
              <Button onClick={() => setAddDialogOpen(true)} size="sm">
                Add Your First Source
              </Button>
            </div>
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
