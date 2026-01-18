/**
 * Welcome & Messages Article
 */

import { HCCallout, HCRelatedArticles } from '@/components/help-center';

export default function WelcomeMessagesArticle() {
  return (
    <>
      <p>
        First impressions matter. Configure Ari's welcome message and widget content 
        to greet visitors and guide them through your chat experience.
      </p>

      <h2 id="welcome-title">Welcome Title</h2>
      <p>
        The welcome title is the first thing visitors see when they open the chat widget. 
        It appears prominently at the top of the chat interface.
      </p>
      <ul>
        <li><strong>Title Text</strong> – A short greeting or headline (e.g., "Welcome to [Company]!")</li>
        <li><strong>Emoji</strong> – Add an optional emoji to make the greeting more friendly and eye-catching</li>
      </ul>

      <h3 id="editing-welcome-title">Editing the Welcome Title</h3>
      <ol>
        <li>Navigate to <strong>Ari</strong> from the sidebar</li>
        <li>Select <strong>Welcome & Messages</strong></li>
        <li>Edit the Title and Emoji fields</li>
        <li>Your changes save automatically</li>
      </ol>

      <HCCallout variant="tip">
        Keep your welcome title short and action-oriented. 
        Example: "Hi there! 👋" or "Welcome to Sunshine Homes!"
      </HCCallout>

      <h2 id="welcome-subtitle">Welcome Subtitle</h2>
      <p>
        The subtitle appears below the welcome title and provides additional context 
        or instructions for visitors.
      </p>
      <ul>
        <li>Introduce what Ari can help with</li>
        <li>Set expectations for the conversation</li>
        <li>Encourage visitors to ask questions</li>
      </ul>

      <HCCallout variant="info">
        Example subtitle: "I'm here to help you find your perfect home, schedule tours, 
        and answer any questions you have."
      </HCCallout>

      <h2 id="quick-reply-suggestions">Quick Reply Suggestions</h2>
      <p>
        Enable this toggle to show suggested quick replies in the chat interface. 
        These help visitors start conversations with common questions or requests.
      </p>
      <ul>
        <li><strong>Enabled</strong> – Shows contextual quick reply buttons based on the conversation</li>
        <li><strong>Disabled</strong> – Visitors type all messages manually</li>
      </ul>

      <h2 id="bottom-navigation">Bottom Navigation Tabs</h2>
      <p>
        Control which tabs appear at the bottom of your chat widget. Each tab provides 
        different functionality for your visitors:
      </p>

      <h3 id="messages-tab">Messages Tab</h3>
      <p>
        The primary chat interface where visitors converse with Ari. This tab is 
        always visible and cannot be disabled.
      </p>

      <h3 id="news-tab">News Tab</h3>
      <p>
        Display announcements, updates, and news items to visitors. Toggle this off 
        if you don't want to show news content in your widget.
      </p>
      <ul>
        <li><strong>Enabled</strong> – News tab appears in the widget navigation</li>
        <li><strong>Disabled</strong> – News tab is hidden from visitors</li>
      </ul>

      <h3 id="help-tab">Help Tab</h3>
      <p>
        Provide self-service help articles for visitors. Toggle this off if you 
        prefer visitors to only interact with Ari directly.
      </p>
      <ul>
        <li><strong>Enabled</strong> – Help tab appears with your help articles</li>
        <li><strong>Disabled</strong> – Help tab is hidden from visitors</li>
      </ul>

      <HCCallout variant="tip">
        If you have extensive help documentation, keep the Help tab enabled. 
        It helps visitors find answers quickly without waiting for a response.
      </HCCallout>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Keep the welcome title under 30 characters for best display</li>
        <li>Use friendly, conversational language</li>
        <li>Match the tone of your brand</li>
        <li>Test messages on mobile devices (shorter is better)</li>
        <li>Use emojis sparingly – one in the title is usually enough</li>
      </ul>

      <HCCallout variant="info">
        Changes to welcome messages are saved automatically and take effect 
        immediately on your live widget.
      </HCCallout>

      <HCRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'appearance', title: 'Customizing Appearance' },
          { categoryId: 'ari', articleSlug: 'lead-capture', title: 'Lead Capture' },
          { categoryId: 'ari', articleSlug: 'help-articles', title: 'Help Articles' },
        ]}
      />
    </>
  );
}
