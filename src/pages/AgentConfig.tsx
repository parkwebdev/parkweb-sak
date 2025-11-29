import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Menu01 as Menu } from '@untitledui/icons';
import { useAgents } from '@/hooks/useAgents';
import { AgentSettingsTab } from '@/components/agents/tabs/AgentSettingsTab';
import { AgentKnowledgeTab } from '@/components/agents/tabs/AgentKnowledgeTab';
import { AgentToolsTab } from '@/components/agents/tabs/AgentToolsTab';
import { AgentDeploymentTab } from '@/components/agents/tabs/AgentDeploymentTab';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface AgentConfigProps {
  onMenuClick?: () => void;
}

const AgentConfig: React.FC<AgentConfigProps> = ({ onMenuClick }) => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents, updateAgent } = useAgents();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    if (agentId) {
      const foundAgent = agents.find(a => a.id === agentId);
      setAgent(foundAgent || null);
    }
  }, [agentId, agents]);

  const handleUpdate = async (id: string, updates: Partial<Agent>) => {
    if (!agent) return;
    await updateAgent(id, updates);
  };

  if (!agent) {
    return (
      <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading agent...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
      <header className="w-full font-medium mb-6">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/agents')}
            >
              <ChevronLeft size={16} />
              Back to Agents
            </Button>
          </div>
          
          <div>
            <h1 className="text-sm font-semibold text-foreground">Configure Agent</h1>
            <p className="text-xs text-muted-foreground mt-1">{agent.name}</p>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <AgentSettingsTab agent={agent} onUpdate={handleUpdate} />
          </TabsContent>

          <TabsContent value="knowledge">
            <AgentKnowledgeTab agentId={agent.id} orgId={agent.org_id} />
          </TabsContent>

          <TabsContent value="tools">
            <AgentToolsTab agentId={agent.id} />
          </TabsContent>

          <TabsContent value="deployment">
            <AgentDeploymentTab agent={agent} onUpdate={handleUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default AgentConfig;
