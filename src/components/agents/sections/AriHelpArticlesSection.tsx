/**
 * AriHelpArticlesSection
 * 
 * Help articles management.
 */

import { HelpArticlesManager } from '@/components/agents/HelpArticlesManager';
import { AriSectionHeader } from './AriSectionHeader';

interface AriHelpArticlesSectionProps {
  agentId: string;
  userId: string;
}

export const AriHelpArticlesSection: React.FC<AriHelpArticlesSectionProps> = ({ agentId, userId }) => {
  return (
    <div>
      <AriSectionHeader
        title="Help Articles"
        description="Create and organize help articles that Ari can reference and share"
      />
      <HelpArticlesManager agentId={agentId} userId={userId} />
    </div>
  );
};
