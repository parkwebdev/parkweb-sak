import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { AgentSettingsTab } from '@/components/agents/tabs/AgentSettingsTab';
import { AgentKnowledgeTab } from '@/components/agents/tabs/AgentKnowledgeTab';
import { AgentToolsTab } from '@/components/agents/tabs/AgentToolsTab';
import { AgentDeploymentTab } from '@/components/agents/tabs/AgentDeploymentTab';
import { AgentConfigLayout, type AgentConfigTab } from '@/components/agents/AgentConfigLayout';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

const AgentConfig: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { agents, updateAgent } = useAgents();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<AgentConfigTab>('settings');

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
      <div className="px-4 lg:px-8 pb-8">
        <AgentConfigLayout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          agentName={agent.name}
        >
          {activeTab === 'settings' && (
            <AgentSettingsTab agent={agent} onUpdate={handleUpdate} />
          )}
          {activeTab === 'knowledge' && (
            <AgentKnowledgeTab agentId={agent.id} orgId={agent.org_id} />
          )}
          {activeTab === 'tools' && (
            <AgentToolsTab agentId={agent.id} />
          )}
          {activeTab === 'deployment' && (
            <AgentDeploymentTab agent={agent} onUpdate={handleUpdate} />
          )}
        </AgentConfigLayout>
      </div>
    </main>
  );
};

export default AgentConfig;
