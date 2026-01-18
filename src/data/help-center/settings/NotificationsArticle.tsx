import { HCCallout, HCRelatedArticles } from '@/components/help-center';
export default function NotificationsArticle() {
  return (<><p>Control how and when Pilot notifies you about important events.</p><HCCallout variant="tip">Enable email notifications for critical events you shouldn't miss.</HCCallout><HCRelatedArticles articles={[{ categoryId: 'settings', articleSlug: 'team', title: 'Managing Your Team' }]} /></>);
}