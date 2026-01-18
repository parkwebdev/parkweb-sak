/**
 * Webhooks Article
 */

import { HCCallout } from '@/components/help-center/HCCallout';
import { HCStepByStep } from '@/components/help-center/HCStepByStep';
import { HCRelatedArticles } from '@/components/help-center/HCArticleLink';

export default function WebhooksArticle() {
  return (
    <>
      <p>Webhooks allow Pilot to notify your external systems when events happen.</p>
      <HCCallout variant="info">Unlike APIs where you request data, webhooks push data to you automatically.</HCCallout>
      <h2 id="creating-webhook">Creating a Webhook</h2>
      <HCStepByStep steps={[
        { title: 'Navigate to Ari → Webhooks', description: 'Open the Ari configurator and select Webhooks.' },
        { title: 'Click Add Webhook', description: 'Click the Add Webhook button.' },
        { title: 'Enter Webhook Details', description: 'Provide name, endpoint URL, and select events.' },
        { title: 'Configure Authentication', description: 'Add required headers for your endpoint.' },
        { title: 'Save and Activate', description: 'Save the webhook and toggle it on.' },
      ]} />
      <HCRelatedArticles articles={[{ categoryId: 'ari', articleSlug: 'custom-tools', title: 'Custom Tools' }, { categoryId: 'ari', articleSlug: 'integrations', title: 'Integrations' }]} />
    </>
  );
}
