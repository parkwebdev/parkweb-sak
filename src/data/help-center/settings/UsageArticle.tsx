import { HCCallout, HCRelatedArticles } from '@/components/help-center';
export default function UsageArticle() {
  return (<><p>The Usage page shows how your team is using Pilot.</p><HCCallout variant="tip">Rising takeover rates might indicate gaps in Ari's knowledge.</HCCallout><HCRelatedArticles articles={[{ categoryId: 'settings', articleSlug: 'billing', title: 'Billing & Subscription' }]} /></>);
}