/**
 * Customizing Appearance Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function AppearanceArticle() {
  return (
    <>
      <p>
        Make the chat widget feel like a natural part of your website by customizing 
        its appearance to match your brand.
      </p>

      <h2 id="gradient-header">Gradient Header</h2>
      <p>
        Enable the gradient header to give your widget a more dynamic, modern look. 
        When enabled, the widget header displays a smooth gradient using your brand colors.
      </p>
      <ul>
        <li><strong>Enabled</strong> – Header shows a gradient from primary to secondary color</li>
        <li><strong>Disabled</strong> – Header uses a solid primary color</li>
      </ul>

      <h2 id="brand-colors">Brand Colors</h2>
      <p>
        Set your brand colors to style the widget header, buttons, and accents:
      </p>
      <ul>
        <li><strong>Primary Brand Color</strong> – The main color used for headers and buttons. 
        When gradient is enabled, this is the starting color.</li>
        <li><strong>Secondary Brand Color</strong> – Used as the ending color when gradient 
        header is enabled.</li>
      </ul>

      <KBCallout variant="tip">
        Choose colors with good contrast. The widget automatically adjusts text colors 
        to ensure readability against your chosen background.
      </KBCallout>

      <h2 id="widget-preview">Live Preview</h2>
      <p>
        As you make changes, the preview on the right side of the screen updates 
        in real-time so you can see exactly how your widget will look.
      </p>

      <KBCallout variant="info">
        Changes to appearance are saved automatically and take effect immediately 
        on your live widget.
      </KBCallout>

      <h2 id="additional-styling">Additional Styling Options</h2>
      <p>
        For more customization options, check the Welcome & Messages section where 
        you can configure:
      </p>
      <ul>
        <li>Welcome title with optional emoji</li>
        <li>Welcome subtitle text</li>
        <li>Quick Reply Suggestions toggle</li>
        <li>Bottom navigation tabs (Messages, News, Help)</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'welcome-messages', title: 'Welcome & Messages' },
          { categoryId: 'ari', articleSlug: 'installation', title: 'Installing the Widget' },
          { categoryId: 'ari', articleSlug: 'knowledge-sources', title: 'Knowledge Sources' },
        ]}
      />
    </>
  );
}
