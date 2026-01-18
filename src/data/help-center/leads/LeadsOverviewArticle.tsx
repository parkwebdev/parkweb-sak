/**
 * Leads Overview Article
 */

import { HCCallout, HCRelatedArticles, HCArticleLink } from '@/components/help-center';

export default function LeadsOverviewArticle() {
  return (
    <>
      <p>The Leads section helps you manage and track potential customers.</p>
      <h2 id="lead-sources">How Leads Are Captured</h2>
      <ul><li>Submit a <HCArticleLink categoryId="ari" articleSlug="lead-capture">contact form</HCArticleLink> before chatting</li><li>Provide email or phone during a conversation</li><li>Book an appointment through calendar integration</li></ul>
      <HCCallout variant="tip">Customize your stages to match your sales process.</HCCallout>
      <HCRelatedArticles articles={[{ categoryId: 'ari', articleSlug: 'lead-capture', title: 'Lead Capture Settings' }, { categoryId: 'inbox', articleSlug: 'overview', title: 'Managing Conversations' }]} />
    </>
  );
}
