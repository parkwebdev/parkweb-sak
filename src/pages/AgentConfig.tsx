import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { AgentConfigHeader } from '@/components/agents/AgentConfigHeader';
import { AgentConfigureTab } from '@/components/agents/tabs/AgentConfigureTab';
import { AgentBehaviorTab } from '@/components/agents/tabs/AgentBehaviorTab';
import { AgentKnowledgeTab } from '@/components/agents/tabs/AgentKnowledgeTab';
import { AgentToolsTab } from '@/components/agents/tabs/AgentToolsTab';
import { AgentDeployTab } from '@/components/agents/tabs/AgentDeployTab';
import { AgentConfigLayout, type AgentConfigTab } from '@/components/agents/AgentConfigLayout';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface AgentConfigProps {
  onMenuClick?: () => void;
}

const AgentConfig: React.FC<AgentConfigProps> = ({ onMenuClick }) => {
  const { agentId } = useParams<{ agentId: string }>();
  const { agents, updateAgent } = useAgents();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<AgentConfigTab>('configure');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

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

  const handleSave = async () => {
    if (!agent || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      // Call the appropriate tab's save function
      if (activeTab === 'configure') {
        await (AgentConfigureTab as any).handleSave?.();
      } else if (activeTab === 'behavior') {
        await (AgentBehaviorTab as any).handleSave?.();
      } else if (activeTab === 'deploy') {
        await (AgentDeployTab as any).handleSave?.();
      }
      
      setHasUnsavedChanges(false);
      setShowSaved(true);
      
      // Hide saved indicator after 2 seconds
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!agent) {
    return (
      <main className="flex-1 bg-muted/30 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading agent...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-muted/30 min-h-screen p-1">
      <div className="h-full">
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <AgentConfigHeader
            agent={agent}
            hasUnsavedChanges={hasUnsavedChanges}
            showSaved={showSaved}
            onSave={handleSave}
            isSaving={isSaving}
          />
          
          <AgentConfigLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'configure' && (
              <AgentConfigureTab
                agent={agent}
                onUpdate={handleUpdate}
                onFormChange={setHasUnsavedChanges}
              />
            )}
            {activeTab === 'behavior' && (
              <AgentBehaviorTab
                agent={agent}
                onUpdate={handleUpdate}
                onFormChange={setHasUnsavedChanges}
              />
            )}
            {activeTab === 'knowledge' && (
              <AgentKnowledgeTab agentId={agent.id} orgId={agent.org_id} />
            )}
            {activeTab === 'tools' && (
              <AgentToolsTab agentId={agent.id} />
            )}
            {activeTab === 'deploy' && (
              <AgentDeployTab
                agent={agent}
                onUpdate={handleUpdate}
                onFormChange={setHasUnsavedChanges}
              />
            )}
          </AgentConfigLayout>
        </div>
      </div>
    </main>
  );
};

export default AgentConfig;
