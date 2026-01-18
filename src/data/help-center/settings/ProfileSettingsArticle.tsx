import { HCCallout, HCRelatedArticles } from '@/components/help-center';
export default function ProfileSettingsArticle() {
  return (<><p>Your profile contains your personal information and preferences.</p><HCCallout variant="tip">Use a clear, professional photo.</HCCallout><HCRelatedArticles articles={[{ categoryId: 'settings', articleSlug: 'general', title: 'General Settings' }]} /></>);
}