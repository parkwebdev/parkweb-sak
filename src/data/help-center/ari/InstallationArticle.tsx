/**
 * Installing the Widget Article
 */

import { HCCallout } from '@/components/help-center/HCCallout';
import { HCStepByStep } from '@/components/help-center/HCStepByStep';
import { HCArticleLink, HCRelatedArticles } from '@/components/help-center/HCArticleLink';

export default function InstallationArticle() {
  return (
    <>
      <p>Once you've configured Ari, it's time to install the widget on your website.</p>
      <h2 id="embed-code">Getting the Embed Code</h2>
      <HCStepByStep steps={[
        { title: 'Navigate to Ari → Installation', description: 'Open the Ari configurator, then click Installation.' },
        { title: 'Copy the Embed Code', description: 'Click the copy button to copy the embed code snippet.' },
        { title: 'Paste into Your Website', description: 'Add the code before the closing </body> tag.' },
      ]} />
      <HCCallout variant="info">The embed code should be placed just before the closing &lt;/body&gt; tag.</HCCallout>
      <h2 id="testing">Testing Your Installation</h2>
      <ol><li>Visit your website</li><li>Look for the chat launcher</li><li>Click to open and test</li><li>Check your <HCArticleLink categoryId="inbox" articleSlug="overview">Inbox</HCArticleLink></li></ol>
      <HCRelatedArticles articles={[{ categoryId: 'ari', articleSlug: 'appearance', title: 'Customizing Appearance' }, { categoryId: 'ari', articleSlug: 'knowledge-sources', title: 'Adding Knowledge Sources' }]} />
    </>
  );
}
