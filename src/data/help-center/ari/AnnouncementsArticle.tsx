/**
 * Announcements Article
 */

import { HCCallout } from '@/components/help-center/HCCallout';
import { HCStepByStep } from '@/components/help-center/HCStepByStep';
import { HCRelatedArticles } from '@/components/help-center/HCArticleLink';

export default function AnnouncementsArticle() {
  return (
    <>
      <p>
        Announcements are eye-catching banners that appear at the top of the chat 
        widget. Use them to highlight promotions, events, or important updates.
      </p>

      <h2 id="how-they-work">How Announcements Work</h2>
      <p>When visitors open the chat widget, they see your active announcements:</p>
      <ul>
        <li>Displayed as horizontal cards at the top of the widget</li>
        <li>Can include images, text, and call-to-action buttons</li>
        <li>Visitors can scroll through multiple announcements</li>
        <li>Clicking an announcement can open a link or trigger an action</li>
      </ul>

      <h2 id="creating-announcement">Creating an Announcement</h2>
      <HCStepByStep
        steps={[
          { title: 'Navigate to Ari → Announcements', description: 'Open the Ari configurator and select the Announcements section.' },
          { title: 'Click Add Announcement', description: 'Click the Add Announcement button to create a new announcement.' },
          { title: 'Enter Title and Subtitle', description: 'Add a compelling headline (5-7 words max) and optional subtitle.' },
          { title: 'Add an Image (Optional)', description: 'Upload a background or featured image that matches your brand.' },
          { title: 'Set Colors', description: 'Choose background and text colors for high contrast and readability.' },
          { title: 'Add Action URL (Optional)', description: 'Enter a URL to open when visitors click the announcement.' },
          { title: 'Save and Activate', description: 'Save the announcement and toggle it on to make it visible.' },
        ]}
      />

      <HCCallout variant="tip">
        Use high-contrast colors and concise text. Announcements should be scannable in under 3 seconds.
      </HCCallout>

      <HCRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'appearance', title: 'Customizing Appearance' },
          { categoryId: 'ari', articleSlug: 'welcome-messages', title: 'Welcome & Messages' },
          { categoryId: 'ari', articleSlug: 'news', title: 'News' },
        ]}
      />
    </>
  );
}
