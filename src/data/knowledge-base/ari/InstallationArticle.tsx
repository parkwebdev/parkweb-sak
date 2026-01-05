/**
 * Installing the Widget Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function InstallationArticle() {
  return (
    <>
      <p>
        Once you've configured Ari, it's time to install the widget on your website. 
        The process is simple and takes just a few minutes.
      </p>

      <h2 id="embed-code">Getting the Embed Code</h2>
      <ol>
        <li>Navigate to <strong>Ari → Installation</strong></li>
        <li>Copy the embed code snippet</li>
        <li>Paste it into your website's HTML</li>
      </ol>

      <KBCallout variant="info">
        The embed code should be placed just before the closing <code>&lt;/body&gt;</code> tag 
        for optimal performance.
      </KBCallout>

      <h2 id="platform-guides">Platform-Specific Guides</h2>

      <h3 id="wordpress">WordPress</h3>
      <ol>
        <li>Install a plugin like "Insert Headers and Footers"</li>
        <li>Go to Settings → Insert Headers and Footers</li>
        <li>Paste the embed code in the "Scripts in Footer" section</li>
        <li>Save changes</li>
      </ol>

      <h3 id="shopify">Shopify</h3>
      <ol>
        <li>Go to Online Store → Themes → Edit code</li>
        <li>Find the <code>theme.liquid</code> file</li>
        <li>Paste the embed code before <code>&lt;/body&gt;</code></li>
        <li>Save</li>
      </ol>

      <h3 id="webflow">Webflow</h3>
      <ol>
        <li>Go to Project Settings → Custom Code</li>
        <li>Paste the embed code in the "Footer Code" section</li>
        <li>Publish your site</li>
      </ol>

      <h3 id="squarespace">Squarespace</h3>
      <ol>
        <li>Go to Settings → Advanced → Code Injection</li>
        <li>Paste the embed code in the "Footer" section</li>
        <li>Save</li>
      </ol>

      <h2 id="testing">Testing Your Installation</h2>
      <p>
        After installing the widget:
      </p>
      <ol>
        <li>Visit your website in a new browser tab</li>
        <li>Look for the chat launcher in the corner</li>
        <li>Click to open and test a conversation</li>
        <li>Check your Inbox to see the test conversation</li>
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
    </>
  );
}
