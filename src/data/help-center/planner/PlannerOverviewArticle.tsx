/**
 * Planner Overview Article
 */

import { HCCallout, HCRelatedArticles, HCArticleLink } from '@/components/help-center';

export default function PlannerOverviewArticle() {
  return (
    <>
      <p>The Planner helps you manage appointments, showings, and events.</p>
      <h2 id="calendar-integration">Calendar Integration</h2>
      <ul><li><strong>Google Calendar</strong> – Full two-way sync</li><li><strong>Microsoft Outlook</strong> – Full two-way sync</li></ul>
      <HCCallout variant="info">Events from connected calendars sync automatically.</HCCallout>
      <h2 id="ai-appointments">AI-Booked Appointments</h2>
      <p>Configure Ari's booking behavior in <HCArticleLink categoryId="ari" articleSlug="custom-tools">Custom Tools</HCArticleLink>.</p>
      <HCRelatedArticles articles={[{ categoryId: 'ari', articleSlug: 'custom-tools', title: 'Custom Tools' }, { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' }]} />
    </>
  );
}
