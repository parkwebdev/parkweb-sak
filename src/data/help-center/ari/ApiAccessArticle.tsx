/**
 * API Access Article
 */

import { HCCallout, HCRelatedArticles } from '@/components/help-center';

export default function ApiAccessArticle() {
  return (
    <>
      <p>The Pilot API allows developers to interact with Ari programmatically.</p>
      <HCCallout variant="warning">API Access is an advanced feature intended for developers.</HCCallout>
      <h2 id="api-keys">API Keys</h2>
      <p>API keys authenticate your requests to the Pilot API.</p>
      <h2 id="creating-key">Creating an API Key</h2>
      <ol><li>Navigate to <strong>Ari → API Access</strong></li><li>Click <strong>Generate API Key</strong></li><li>Give the key a descriptive name</li><li>Copy the key immediately</li></ol>
      <HCCallout variant="info">Store your API key securely. Never expose it in client-side code.</HCCallout>
      <HCRelatedArticles articles={[{ categoryId: 'ari', articleSlug: 'webhooks', title: 'Webhooks' }, { categoryId: 'ari', articleSlug: 'custom-tools', title: 'Custom Tools' }]} />
    </>
  );
}
