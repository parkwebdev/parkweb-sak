import { HCCallout, HCRelatedArticles } from '@/components/help-center';
export default function TeamManagementArticle() {
  return (<><p>Invite team members to collaborate on Pilot.</p><HCCallout variant="info">Invitations expire after 7 days.</HCCallout><HCRelatedArticles articles={[{ categoryId: 'settings', articleSlug: 'general', title: 'General Settings' }]} /></>);
}