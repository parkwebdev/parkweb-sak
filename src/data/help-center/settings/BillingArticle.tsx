import { HCCallout, HCRelatedArticles } from '@/components/help-center';
export default function BillingArticle() {
  return (<><p>Manage your Pilot subscription, update payment methods, and view invoices.</p><HCCallout variant="info">When you upgrade, you're immediately charged a prorated amount.</HCCallout><HCRelatedArticles articles={[{ categoryId: 'settings', articleSlug: 'usage', title: 'Usage' }]} /></>);
}