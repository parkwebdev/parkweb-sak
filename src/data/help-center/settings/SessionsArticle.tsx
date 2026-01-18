import { HCCallout, HCRelatedArticles } from '@/components/help-center';
export default function SessionsArticle() {
  return (<><p>Sessions show you where your account is currently logged in.</p><HCCallout variant="warning">If you see a session you don't recognize, sign it out immediately and change your password.</HCCallout><HCRelatedArticles articles={[{ categoryId: 'settings', articleSlug: 'profile', title: 'Profile Settings' }]} /></>);
}