import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { AgentConfigHeader } from '@/components/agents/AgentConfigHeader';
import { AgentConfigureTab } from '@/components/agents/tabs/AgentConfigureTab';
import { AgentKnowledgeTab } from '@/components/agents/tabs/AgentKnowledgeTab';
import { AgentToolsTab } from '@/components/agents/tabs/AgentToolsTab';
import { AgentIntegrationsTab } from '@/components/agents/tabs/AgentIntegrationsTab';
import { AgentEmbedTab } from '@/components/agents/tabs/AgentEmbedTab';
import { AgentContentTab } from '@/components/agents/tabs/AgentContentTab';
import { AgentConfigLayout, type AgentConfigTab } from '@/components/agents/AgentConfigLayout';
import { TabContentTransition } from '@/components/ui/tab-content-transition';
import { LoadingState } from '@/components/ui/loading-state';
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

  const handleUpdate = async (id: string, updates: Partial<Agent>): Promise<Agent | null> => {
    if (!agent) return null;
    return await updateAgent(id, updates);
  };

  const handleSave = async () => {
    if (!agent || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      // Tabs auto-save, so this just updates the indicator
      // The save operation is handled by individual tab components
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
      <main className="flex-1 bg-muted/30">
        <LoadingState text="Loading agent..." />
      </main>
    );
  }

  return (
    <div className="flex-1 h-full bg-muted/30 flex flex-col min-h-0">
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
        {activeTab === 'embed' ? (
          <div className="flex-1 h-full min-h-0 flex flex-col">
            <AgentEmbedTab
              agent={agent}
              onUpdate={handleUpdate}
              onFormChange={setHasUnsavedChanges}
            />
          </div>
        ) : (
          <TabContentTransition activeKey={activeTab}>
            {activeTab === 'configure' && (
              <AgentConfigureTab
                agent={agent}
                onUpdate={handleUpdate}
                onFormChange={setHasUnsavedChanges}
              />
            )}
            {activeTab === 'knowledge' && (
              <AgentKnowledgeTab agentId={agent.id} userId={agent.user_id} />
            )}
            {activeTab === 'tools' && (
              <AgentToolsTab agentId={agent.id} agent={agent} onUpdate={handleUpdate} />
            )}
            {activeTab === 'integrations' && (
              <AgentIntegrationsTab agentId={agent.id} />
            )}
            {activeTab === 'content' && (
              <AgentContentTab />
            )}
          </TabContentTransition>
        )}
      </AgentConfigLayout>
    </div>
  );
};

export default AgentConfig;
