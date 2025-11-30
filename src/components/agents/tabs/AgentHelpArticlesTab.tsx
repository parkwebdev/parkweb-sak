import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';

interface AgentHelpArticlesTabProps {
  agentId: string;
}

export const AgentHelpArticlesTab = ({ agentId }: AgentHelpArticlesTabProps) => {
  return (
    <div className="max-w-5xl space-y-6">
      <HelpArticlesManager agentId={agentId} />
    </div>
  );
};
