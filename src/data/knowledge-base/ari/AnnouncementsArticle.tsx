/**
 * Announcements Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBStepByStep } from '@/components/knowledge-base/KBStepByStep';
import { KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';

export default function AnnouncementsArticle() {
  return (
    <>
      <p>
        Announcements are eye-catching banners that appear at the top of the chat 
        widget. Use them to highlight promotions, events, or important updates.
      </p>

      <h2 id="how-they-work">How Announcements Work</h2>
      <p>
        When visitors open the chat widget, they see your active announcements:
      </p>
      <ul>
        <li>Displayed as horizontal cards at the top of the widget</li>
        <li>Can include images, text, and call-to-action buttons</li>
        <li>Visitors can scroll through multiple announcements</li>
        <li>Clicking an announcement can open a link or trigger an action</li>
      </ul>

      <h2 id="creating-announcement">Creating an Announcement</h2>
      <KBStepByStep
        steps={[
          {
            title: 'Navigate to Ari → Announcements',
            description: 'Open the Ari configurator and select the Announcements section.',
          },
          {
            title: 'Click Add Announcement',
            description: 'Click the Add Announcement button to create a new announcement.',
          },
          {
            title: 'Enter Title and Subtitle',
            description: 'Add a compelling headline (5-7 words max) and optional subtitle.',
          },
          {
            title: 'Add an Image (Optional)',
            description: 'Upload a background or featured image that matches your brand.',
          },
          {
            title: 'Set Colors',
            description: 'Choose background and text colors for high contrast and readability.',
          },
          {
            title: 'Add Action URL (Optional)',
            description: 'Enter a URL to open when visitors click the announcement.',
          },
          {
            title: 'Save and Activate',
            description: 'Save the announcement and toggle it on to make it visible.',
          },
        ]}
      />

      <h3 id="announcement-fields">Announcement Fields</h3>
      <ul>
        <li><strong>Title:</strong> Main headline (keep it short)</li>
        <li><strong>Subtitle:</strong> Optional secondary text</li>
        <li><strong>Image:</strong> Background or featured image</li>
        <li><strong>Background Color:</strong> Customize the card color</li>
        <li><strong>Action URL:</strong> Where clicking the announcement leads</li>
      </ul>

      <KBCallout variant="tip">
        Use high-contrast colors and concise text. Announcements should be 
        scannable in under 3 seconds.
      </KBCallout>

      <h2 id="use-cases">Common Use Cases</h2>
      <ul>
        <li><strong>Special offers:</strong> "Limited time: First month free!"</li>
        <li><strong>Events:</strong> "Join our open house this Saturday"</li>
        <li><strong>New features:</strong> "Now offering virtual tours"</li>
        <li><strong>Important updates:</strong> "Holiday hours: Dec 24-25 closed"</li>
        <li><strong>Promotions:</strong> "Refer a friend, get $500"</li>
      </ul>

      <h2 id="managing-announcements">Managing Announcements</h2>

      <h3 id="activation">Activating and Deactivating</h3>
      <p>
        Control which announcements are visible:
      </p>
      <ul>
        <li>Toggle announcements on or off</li>
        <li>Inactive announcements are saved but not shown</li>
        <li>Reactivate past announcements when needed</li>
      </ul>

      <h3 id="ordering">Ordering Announcements</h3>
      <p>
        When you have multiple active announcements:
      </p>
      <ul>
        <li>Drag and drop to change the order</li>
        <li>The first announcement is most prominent</li>
        <li>Visitors can swipe to see more</li>
      </ul>

      <h2 id="design-tips">Design Tips</h2>
      <ul>
        <li><strong>Short titles:</strong> 5-7 words maximum</li>
        <li><strong>Action-oriented:</strong> Include a verb ("Get", "Join", "Save")</li>
        <li><strong>Relevant images:</strong> Match your brand style</li>
        <li><strong>Clear CTAs:</strong> Make the action obvious</li>
        <li><strong>Mobile-first:</strong> Test on small screens</li>
      </ul>

      <KBCallout variant="info">
        Limit active announcements to 3-4 at most. Too many announcements 
        can overwhelm visitors and reduce engagement.
      </KBCallout>

      <h2 id="performance">Tracking Performance</h2>
      <p>
        Monitor how announcements perform:
      </p>
      <ul>
        <li>View counts: How many visitors saw it</li>
        <li>Click-through rate: How many clicked</li>
        <li>Use data to optimize future announcements</li>
      </ul>

      <h2 id="seasonal">Seasonal Announcements</h2>
      <p>
        Plan announcements around key dates:
      </p>
      <ul>
        <li>Create holiday announcements in advance</li>
        <li>Schedule seasonal promotions</li>
        <li>Update announcements as dates approach</li>
        <li>Archive past seasonal content for next year</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'appearance', title: 'Customizing Appearance' },
          { categoryId: 'ari', articleSlug: 'welcome-messages', title: 'Welcome & Messages' },
          { categoryId: 'ari', articleSlug: 'news', title: 'News' },
        ]}
      />
    </>
  );
}
