/**
 * Human Takeover Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBArticleLink, KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';

export default function TakeoverArticle() {
  return (
    <>
      <p>
        While Ari handles most conversations automatically, some situations require 
        human attention. The takeover feature lets you seamlessly step in and take 
        control of a conversation.
      </p>

      <h2 id="when-to-takeover">When to Take Over</h2>
      <p>
        Consider taking over a conversation when:
      </p>
      <ul>
        <li>The visitor has a complex issue Ari can't resolve</li>
        <li>A high-value lead needs personal attention</li>
        <li>The visitor explicitly asks for a human</li>
        <li>Sensitive information needs to be discussed</li>
        <li>Ari seems to be misunderstanding the visitor's request</li>
      </ul>

      <h2 id="how-to-takeover">How to Take Over</h2>
      <ol>
        <li>Open the conversation in the{' '}
          <KBArticleLink categoryId="inbox" articleSlug="overview">
            Inbox
          </KBArticleLink>
        </li>
        <li>Click the <strong>Take Over</strong> button in the toolbar</li>
        <li>The visitor will see that a human has joined</li>
        <li>Start typing your response</li>
      </ol>

      <KBCallout variant="info">
        When you take over, Ari stops responding automatically. The visitor sees a 
        notification that a team member has joined the conversation.
      </KBCallout>

      <h2 id="during-takeover">During a Takeover</h2>
      <p>
        While you're in control:
      </p>
      <ul>
        <li>All your messages are sent directly to the visitor</li>
        <li>Ari will not interrupt or respond</li>
        <li>You can see the full conversation history for context</li>
        <li>Visitor information is available in the sidebar</li>
      </ul>

      <h2 id="returning-to-ai">Returning to AI</h2>
      <p>
        When you're done, you can hand the conversation back to Ari:
      </p>
      <ol>
        <li>Click <strong>Return to AI</strong></li>
        <li>Optionally add a note about what was resolved</li>
        <li>Ari resumes handling the conversation</li>
      </ol>

      <KBCallout variant="tip" title="Best Practice">
        Before returning to Ari, make sure the visitor's issue is resolved or 
        clearly explain what Ari should help with next.
      </KBCallout>

      <h2 id="notifications">Takeover Notifications</h2>
      <p>
        Configure notifications to be alerted when:
      </p>
      <ul>
        <li>A visitor requests a human</li>
        <li>Ari has difficulty answering a question</li>
        <li>High-priority conversations need attention</li>
      </ul>
      <p>
        Set up notifications in{' '}
        <KBArticleLink categoryId="settings" articleSlug="notifications">
          Settings → Notifications
        </KBArticleLink>.
      </p>

      <KBRelatedArticles
        articles={[
          { categoryId: 'inbox', articleSlug: 'overview', title: 'Managing Conversations' },
          { categoryId: 'settings', articleSlug: 'notifications', title: 'Notification Preferences' },
          { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' },
        ]}
      />
    </>
  );
}
