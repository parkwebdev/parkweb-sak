/**
 * Human Takeover Article
 */

import { HCCallout } from '@/components/help-center/HCCallout';
import { HCArticleLink, HCRelatedArticles } from '@/components/help-center/HCArticleLink';

export default function TakeoverArticle() {
  return (
    <>
      <p>The takeover feature lets you seamlessly step in and take control of a conversation.</p>
      <h2 id="how-to-takeover">How to Take Over</h2>
      <ol><li>Open the conversation in the <HCArticleLink categoryId="inbox" articleSlug="overview">Inbox</HCArticleLink></li><li>Click the <strong>Take Over</strong> button</li><li>The visitor will see that a human has joined</li><li>Start typing your response</li></ol>
      <HCCallout variant="info">When you take over, Ari stops responding automatically.</HCCallout>
      <HCRelatedArticles articles={[{ categoryId: 'inbox', articleSlug: 'overview', title: 'Managing Conversations' }, { categoryId: 'settings', articleSlug: 'notifications', title: 'Notification Preferences' }]} />
    </>
  );
}
