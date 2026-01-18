/**
 * Integrations Article
 */

import { HCCallout } from '@/components/help-center/HCCallout';
import { HCStepByStep } from '@/components/help-center/HCStepByStep';
import { HCArticleLink, HCRelatedArticles } from '@/components/help-center/HCArticleLink';

export default function IntegrationsArticle() {
  return (
    <>
      <p>Connect Pilot to your existing tools and services.</p>
      <h2 id="calendar-integrations">Calendar Integrations</h2>
      <ul><li><strong>Google Calendar:</strong> Two-way sync for bookings</li></ul>
      <HCCallout variant="info">Calendar integrations enable real-time availability checking.</HCCallout>
      <h2 id="connecting-integration">Connecting an Integration</h2>
      <HCStepByStep steps={[
        { title: 'Navigate to Ari → Integrations', description: 'Open the Integrations section.' },
        { title: 'Find Your Integration', description: 'Browse available integrations.' },
        { title: 'Click Connect', description: 'Click the Connect button.' },
        { title: 'Authenticate', description: 'Follow prompts to authorize.' },
        { title: 'Configure Settings', description: 'Set up sync preferences.' },
      ]} />
      <HCRelatedArticles articles={[{ categoryId: 'planner', articleSlug: 'overview', title: 'Using the Planner' }, { categoryId: 'ari', articleSlug: 'webhooks', title: 'Webhooks' }]} />
    </>
  );
}
