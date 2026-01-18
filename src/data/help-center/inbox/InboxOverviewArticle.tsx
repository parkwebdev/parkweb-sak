/**
 * Inbox Overview Article
 */

import { HCCallout, HCRelatedArticles, HCArticleLink } from '@/components/help-center';

export default function InboxOverviewArticle() {
  return (
    <>
      <p>The Inbox is where you manage all conversations between Ari and your visitors.</p>
      <h2 id="layout">Inbox Layout</h2>
      <ul><li><strong>Sidebar</strong> – Filters and navigation</li><li><strong>Conversation List</strong> – All conversations matching your filters</li><li><strong>Conversation Detail</strong> – The selected conversation's messages</li></ul>
      <HCCallout variant="tip">Translation works automatically based on detected language.</HCCallout>
      <HCRelatedArticles articles={[{ categoryId: 'inbox', articleSlug: 'takeover', title: 'Human Takeover' }, { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' }]} />
    </>
  );
}
