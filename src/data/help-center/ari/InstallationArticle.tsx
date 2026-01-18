/**
 * Installing the Widget Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBStepByStep } from '@/components/knowledge-base/KBStepByStep';
import { KBArticleLink, KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';

export default function InstallationArticle() {
  return (
    <>
      <p>
        Once you've configured Ari, it's time to install the widget on your website. 
        The process is simple and takes just a few minutes.
      </p>

      <h2 id="embed-code">Getting the Embed Code</h2>
      <KBStepByStep
        steps={[
          {
            title: 'Navigate to Ari → Installation',
            description: 'Open the Ari configurator from the sidebar, then click on the Installation section.',
          },
          {
            title: 'Copy the Embed Code',
            description: 'Click the copy button to copy the embed code snippet to your clipboard.',
          },
          {
            title: 'Paste into Your Website',
            description: 'Add the code to your website\'s HTML, just before the closing </body> tag.',
          },
        ]}
      />

      <KBCallout variant="info">
        The embed code should be placed just before the closing <code>&lt;/body&gt;</code> tag 
        for optimal performance.
      </KBCallout>

      <h2 id="platform-guides">Platform-Specific Guides</h2>

      <h3 id="wordpress">WordPress</h3>
      <KBStepByStep
        steps={[
          {
            title: 'Install a Plugin',
            description: 'Install and activate a plugin like "Insert Headers and Footers" or "WPCode".',
          },
          {
            title: 'Open Plugin Settings',
            description: 'Go to Settings → Insert Headers and Footers (or the plugin\'s settings page).',
          },
          {
            title: 'Paste the Code',
            description: 'Paste the embed code in the "Scripts in Footer" section.',
          },
          {
            title: 'Save Changes',
            description: 'Click Save to apply the changes to your site.',
          },
        ]}
      />

      <h3 id="shopify">Shopify</h3>
      <KBStepByStep
        steps={[
          {
            title: 'Open Theme Editor',
            description: 'Go to Online Store → Themes → Edit code.',
          },
          {
            title: 'Find theme.liquid',
            description: 'In the Layout folder, open the theme.liquid file.',
          },
          {
            title: 'Paste Before </body>',
            description: 'Scroll to the bottom and paste the embed code just before the closing </body> tag.',
          },
          {
            title: 'Save',
            description: 'Click Save to apply your changes.',
          },
        ]}
      />

      <h3 id="webflow">Webflow</h3>
      <KBStepByStep
        steps={[
          {
            title: 'Open Project Settings',
            description: 'Go to your project settings in the Webflow dashboard.',
          },
          {
            title: 'Navigate to Custom Code',
            description: 'Click on the Custom Code tab.',
          },
          {
            title: 'Paste in Footer Code',
            description: 'Paste the embed code in the "Footer Code" section.',
          },
          {
            title: 'Publish Your Site',
            description: 'Publish your site for the changes to take effect.',
          },
        ]}
      />

      <h3 id="squarespace">Squarespace</h3>
      <KBStepByStep
        steps={[
          {
            title: 'Open Settings',
            description: 'Go to Settings → Advanced → Code Injection.',
          },
          {
            title: 'Paste in Footer',
            description: 'Paste the embed code in the "Footer" section.',
          },
          {
            title: 'Save',
            description: 'Click Save to apply your changes.',
          },
        ]}
      />

      <h2 id="testing">Testing Your Installation</h2>
      <p>
        After installing the widget:
      </p>
      <ol>
        <li>Visit your website in a new browser tab</li>
        <li>Look for the chat launcher in the corner</li>
        <li>Click to open and test a conversation</li>
        <li>Check your{' '}
          <KBArticleLink categoryId="inbox" articleSlug="overview">
            Inbox
          </KBArticleLink>{' '}
          to see the test conversation
        </li>
      </ol>

      <KBCallout variant="warning" title="Troubleshooting">
        If the widget doesn't appear, try clearing your browser cache or testing in 
        an incognito window. Make sure the embed code is properly placed before the 
        closing body tag.
      </KBCallout>

      <h2 id="going-live">Going Live Checklist</h2>
      <ul>
        <li>✓ Knowledge sources are added and processed</li>
        <li>✓ Appearance matches your brand</li>
        <li>✓ Welcome messages are configured</li>
        <li>✓ Widget works correctly on desktop and mobile</li>
        <li>✓ Team is ready to monitor the Inbox</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'appearance', title: 'Customizing Appearance' },
          { categoryId: 'ari', articleSlug: 'knowledge-sources', title: 'Adding Knowledge Sources' },
          { categoryId: 'inbox', articleSlug: 'overview', title: 'Managing Conversations' },
        ]}
      />
    </>
  );
}
