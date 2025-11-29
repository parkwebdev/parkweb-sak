import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Database01 } from '@untitledui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { KnowledgeSourceCard } from '@/components/agents/KnowledgeSourceCard';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';

interface AgentKnowledgeTabProps {
  agentId: string;
  orgId: string;
}

export const AgentKnowledgeTab = ({ agentId, orgId }: AgentKnowledgeTabProps) => {
  const { sources, loading, deleteSource, reprocessSource } = useKnowledgeSources(agentId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading knowledge sources...</div>;
  }

  return (
    <Tabs defaultValue="sources" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sources">Knowledge Sources</TabsTrigger>
        <TabsTrigger value="articles">Help Articles</TabsTrigger>
      </TabsList>

      <TabsContent value="sources" className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Add knowledge sources to give your agent access to specific information through vector search.
          </p>
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
          <div className="grid gap-4">
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
          orgId={orgId}
        />
      </TabsContent>

      <TabsContent value="articles" className="mt-4">
        <HelpArticlesManager agentId={agentId} />
      </TabsContent>
    </Tabs>
  );
};
