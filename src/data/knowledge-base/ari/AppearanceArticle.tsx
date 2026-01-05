/**
 * Customizing Appearance Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function AppearanceArticle() {
  return (
    <>
      <p>
        Make the chat widget feel like a natural part of your website by customizing 
        its appearance to match your brand.
      </p>

      <h2 id="brand-colors">Brand Colors</h2>
      <p>
        Set your primary brand color to style the widget header, buttons, and accents. 
        The widget automatically generates complementary colors for a cohesive look.
      </p>

      <h2 id="avatar-logo">Avatar & Logo</h2>
      <p>
        Upload a custom avatar or logo to represent Ari in conversations. This appears:
      </p>
      <ul>
        <li>In the chat header</li>
        <li>Next to Ari's messages</li>
        <li>On the launcher button (optional)</li>
      </ul>

      <KBCallout variant="tip">
        Use a square image (at least 200x200px) for best results. 
        PNG with transparency works great.
      </KBCallout>

      <h2 id="welcome-messages">Welcome Messages</h2>
      <p>
        Configure what visitors see when they first open the widget:
      </p>
      <ul>
        <li><strong>Greeting</strong> – A friendly hello message</li>
        <li><strong>Subtitle</strong> – Additional context or tagline</li>
        <li><strong>Quick Actions</strong> – Preset buttons for common requests</li>
      </ul>

      <h2 id="widget-position">Widget Position</h2>
      <p>
        Choose where the chat launcher appears on your website:
      </p>
      <ul>
        <li>Bottom right (default)</li>
        <li>Bottom left</li>
      </ul>

      <h2 id="launcher-style">Launcher Style</h2>
      <p>
        Customize the floating button that opens the chat:
      </p>
      <ul>
        <li>Show/hide the launcher button</li>
        <li>Use icon only or icon with text</li>
        <li>Customize the button text</li>
      </ul>

      <h2 id="preview">Live Preview</h2>
      <p>
        As you make changes, the preview on the right side of the screen updates 
        in real-time so you can see exactly how your widget will look.
      </p>

      <KBCallout variant="info">
        Changes to appearance are saved automatically and take effect immediately 
        on your live widget.
      </KBCallout>
    </>
  );
}
