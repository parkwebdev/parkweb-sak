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

export function AriHelpArticlesSection({ agentId, userId }: AriHelpArticlesSectionProps) {
  return (
    <div className="min-w-0 w-full">
      <AriSectionHeader
        title="Help Articles"
        description="Create and organize help articles that Ari can reference and share"
      />
      <HelpArticlesManager agentId={agentId} userId={userId} />
    </div>
  );
};
