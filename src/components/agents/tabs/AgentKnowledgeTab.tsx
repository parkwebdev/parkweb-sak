import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Database01, BookOpen01 } from '@untitledui/icons';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { KnowledgeSourceCard } from '@/components/agents/KnowledgeSourceCard';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';

interface AgentKnowledgeTabProps {
  agentId: string;
  userId: string;
}

export const AgentKnowledgeTab = ({ agentId, userId }: AgentKnowledgeTabProps) => {
  const { sources, loading, deleteSource, reprocessSource } = useKnowledgeSources(agentId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading knowledge sources...</div>;
  }

  return (
    <div className="space-y-8 min-h-full pb-8">
      {/* Section 1: Knowledge Sources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Database01 className="h-5 w-5" />
              Knowledge Sources
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add documents, URLs, or custom content to enhance your agent's knowledge
            </p>
          </div>
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

      {/* Visual Separator */}
      <Separator />

      {/* Section 2: Help Articles */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <BookOpen01 className="h-5 w-5" />
            Help Articles
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create articles to display in the chat widget's help tab
          </p>
        </div>
        
        <HelpArticlesManager agentId={agentId} />
      </div>
    </div>
  );
};
