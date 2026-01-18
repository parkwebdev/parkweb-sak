/**
 * Understanding Your Data Article
 */

import { HCCallout } from '@/components/help-center/HCCallout';
import { HCArticleLink, HCRelatedArticles } from '@/components/help-center/HCArticleLink';

export default function AnalyticsOverviewArticle() {
  return (
    <>
      <p>The Analytics section gives you insights into how Ari is performing.</p>
      <h2 id="key-metrics">Key Metrics</h2>
      <ul><li><strong>Total Conversations</strong> – Number of chat sessions started</li><li><strong>Leads Captured</strong> – Visitors who shared contact info</li><li><strong>Bookings Made</strong> – Appointments scheduled through Ari</li></ul>
      <HCCallout variant="tip">Use peak time data to ensure your team is available during high-traffic periods.</HCCallout>
      <h2 id="reports">Building Reports</h2>
      <p>See the <HCArticleLink categoryId="analytics" articleSlug="report-builder">Report Builder guide</HCArticleLink> for detailed instructions.</p>
      <HCRelatedArticles articles={[{ categoryId: 'analytics', articleSlug: 'report-builder', title: 'Report Builder' }, { categoryId: 'inbox', articleSlug: 'overview', title: 'Managing Conversations' }]} />
    </>
  );
}
