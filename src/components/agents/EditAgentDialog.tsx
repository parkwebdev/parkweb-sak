import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentConfigureTab } from './tabs/AgentConfigureTab';
import { AgentToolsTab } from './tabs/AgentToolsTab';
import { AgentKnowledgeTab } from './tabs/AgentKnowledgeTab';
import { AgentEmbedTab } from './tabs/AgentEmbedTab';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface EditAgentDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Omit<Agent, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => Promise<Agent | null>;
}

export const EditAgentDialog = ({ agent, open, onOpenChange, onUpdate }: EditAgentDialogProps) => {
  const [activeTab, setActiveTab] = useState('configure');

  useEffect(() => {
    if (open) {
      setActiveTab('configure');
    }
  }, [open]);

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Agent: {agent.name}</DialogTitle>
          <DialogDescription>
            Manage your agent's settings, tools, knowledge sources, and deployment.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="configure" className="mt-0">
              <AgentConfigureTab agent={agent} onUpdate={onUpdate} />
            </TabsContent>

            <TabsContent value="knowledge" className="mt-0">
              <AgentKnowledgeTab agentId={agent.id} userId={agent.user_id} />
            </TabsContent>

            <TabsContent value="tools" className="mt-0">
              <AgentToolsTab agentId={agent.id} agent={agent} onUpdate={onUpdate} />
            </TabsContent>

            <TabsContent value="embed" className="mt-0">
              <AgentEmbedTab agent={agent} onUpdate={onUpdate} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
