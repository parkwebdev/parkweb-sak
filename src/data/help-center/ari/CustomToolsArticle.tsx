/**
 * Custom Tools Article
 */

import { HCCallout } from '@/components/help-center/HCCallout';
import { HCStepByStep } from '@/components/help-center/HCStepByStep';
import { HCRelatedArticles } from '@/components/help-center/HCArticleLink';

export default function CustomToolsArticle() {
  return (
    <>
      <p>Custom Tools extend Ari's capabilities by connecting to external services and APIs.</p>
      <HCCallout variant="warning">Custom Tools require technical knowledge.</HCCallout>
      <h2 id="creating-tool">Creating a Custom Tool</h2>
      <HCStepByStep steps={[
        { title: 'Navigate to Ari → Custom Tools', description: 'Open the Ari configurator and select Custom Tools.' },
        { title: 'Click Add Tool', description: 'Click the Add Tool button.' },
        { title: 'Enter Tool Details', description: 'Provide a name and description.' },
        { title: 'Set the Endpoint URL', description: 'Enter your API endpoint URL.' },
        { title: 'Define Parameters', description: 'Add input parameters Ari should collect.' },
        { title: 'Test and Enable', description: 'Test, then enable the tool.' },
      ]} />
      <HCRelatedArticles articles={[{ categoryId: 'ari', articleSlug: 'webhooks', title: 'Webhooks' }, { categoryId: 'ari', articleSlug: 'api-access', title: 'API Access' }]} />
    </>
  );
}
