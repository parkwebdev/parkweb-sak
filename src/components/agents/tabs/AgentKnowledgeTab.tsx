import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Database01 } from '@untitledui/icons';
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
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>

          {sources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Database01 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No knowledge sources configured yet
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add documents, URLs, or custom content to enhance your agent's knowledge
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Source
                </Button>
              </CardContent>
            </Card>
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
        <HelpArticlesManager agentId={agentId} />
      )}
    </AgentSettingsLayout>
  );
};
