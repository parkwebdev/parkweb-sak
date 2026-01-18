import { HCCallout, HCRelatedArticles } from '@/components/help-center';
export default function GeneralSettingsArticle() {
  return (<><p>General settings control your organization's basic information.</p><HCCallout variant="info">This information may appear on invoices and reports.</HCCallout><HCRelatedArticles articles={[{ categoryId: 'settings', articleSlug: 'profile', title: 'Profile Settings' }]} /></>);
}