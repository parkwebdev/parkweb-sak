/**
 * Inbox Overview Article
 */

import { KBCallout, KBRelatedArticles, KBArticleLink } from '@/components/knowledge-base';

export default function InboxOverviewArticle() {
  return (
    <>
      <p>
        The Inbox is where you manage all conversations between Ari and your 
        visitors. Monitor active chats, take over when needed, and review 
        conversation history.
      </p>

      <h2 id="layout">Inbox Layout</h2>
      <p>
        The Inbox has three main areas:
      </p>
      <ul>
        <li><strong>Sidebar</strong> – Filters and navigation</li>
        <li><strong>Conversation List</strong> – All conversations matching your filters</li>
        <li><strong>Conversation Detail</strong> – The selected conversation's messages</li>
      </ul>

      <h2 id="conversation-status">Conversation Status</h2>
      <p>
        Conversations have three statuses:
      </p>
      <ul>
        <li><strong>Active</strong> – Ari is handling the conversation</li>
        <li><strong>Taken Over</strong> – A team member is responding</li>
        <li><strong>Closed</strong> – The conversation has ended</li>
      </ul>
      <p>
        Use the status tabs to filter conversations by their current state.
      </p>

      <h2 id="channels">Channel Filtering</h2>
      <p>
        Filter conversations by their source channel:
      </p>
      <ul>
        <li><strong>All</strong> – Show conversations from all channels</li>
        <li><strong>Widget</strong> – Website chat widget conversations</li>
      </ul>

      <KBCallout variant="info">
        Additional channels can be added via custom integrations using webhooks 
        and the API. Contact support to learn more about multi-channel setups.
      </KBCallout>

      <h2 id="sorting">Sorting Options</h2>
      <p>
        Sort your conversation list to find what matters most:
      </p>
      <ul>
        <li><strong>Last Activity</strong> – Most recently active first (default)</li>
        <li><strong>Newest</strong> – Most recently created first</li>
        <li><strong>Oldest</strong> – Oldest conversations first</li>
      </ul>

      <h2 id="your-inbox">Your Inbox</h2>
      <p>
        Toggle "Your Inbox" to see only conversations you've personally taken over. 
        This helps you focus on chats you're actively managing without seeing 
        everyone's takeovers.
      </p>

      <h2 id="search">Search</h2>
      <p>
        Use the search bar to find conversations by:
      </p>
      <ul>
        <li>Visitor name or email</li>
        <li>Message content</li>
        <li>Keywords or phrases</li>
      </ul>

      <h2 id="reading-conversations">Reading Conversations</h2>
      <p>
        Click any conversation to view its full message history. Messages are 
        color-coded by sender:
      </p>
      <ul>
        <li><strong>Visitor messages</strong> – Shown on the left</li>
        <li><strong>Ari's responses</strong> – Shown on the right with AI indicator</li>
        <li><strong>Team messages</strong> – Shown on the right during takeover</li>
      </ul>

      <h2 id="translation">Translation</h2>
      <p>
        For conversations in other languages:
      </p>
      <ul>
        <li><strong>Translate to English</strong> – View visitor messages in English</li>
        <li><strong>Translate Outbound</strong> – Automatically translate your messages 
        to the visitor's language during takeover</li>
      </ul>
      <p>
        Click the translate button in the conversation toolbar to toggle translation.
      </p>

      <KBCallout variant="tip">
        Translation works automatically based on detected language. You can 
        communicate with visitors in any language without leaving the inbox.
      </KBCallout>

      <h2 id="visitor-presence">Visitor Presence</h2>
      <p>
        See when visitors are online:
      </p>
      <ul>
        <li><strong>Green dot</strong> – Visitor is currently online</li>
        <li><strong>No indicator</strong> – Visitor is offline or has left</li>
      </ul>
      <p>
        Presence updates in real-time, helping you know when to respond quickly.
      </p>

      <h2 id="typing-indicators">Typing Indicators</h2>
      <p>
        See when visitors are typing their message. A typing indicator appears 
        in the conversation when the visitor is actively composing a message.
      </p>
      <p>
        During takeover, visitors can also see when you're typing a response.
      </p>

      <h2 id="file-attachments">File Attachments</h2>
      <p>
        During takeover, you can send files to visitors:
      </p>
      <ul>
        <li>Click the attachment button in the message composer</li>
        <li>Select a file from your computer</li>
        <li>The file is uploaded and sent to the visitor</li>
      </ul>
      <p>
        Supported file types include images, PDFs, and documents.
      </p>

      <h2 id="visitor-info">Visitor Information</h2>
      <p>
        The sidebar shows visitor details when available:
      </p>
      <ul>
        <li>Name and email (if captured via lead form)</li>
        <li>Location (city, country)</li>
        <li>Browser and device information</li>
        <li>Current page URL</li>
        <li>Conversation history</li>
      </ul>

      <KBCallout variant="tip">
        If a visitor hasn't submitted a contact form, encourage them to share 
        their email so you can follow up later. Add this to your{' '}
        <KBArticleLink categoryId="ari" articleSlug="knowledge-sources">
          knowledge sources
        </KBArticleLink>{' '}
        as a best practice.
      </KBCallout>

      <h2 id="unread-badges">Unread Indicators</h2>
      <p>
        Unread conversations are highlighted in the list. The Inbox icon in the 
        sidebar shows a badge with the count of unread conversations.
      </p>

      <h2 id="closing-conversations">Closing Conversations</h2>
      <p>
        Close a conversation when it's resolved:
      </p>
      <ol>
        <li>Click the <strong>Close</strong> button in the toolbar</li>
        <li>The conversation moves to the Closed tab</li>
        <li>You can reopen it later if needed</li>
      </ol>

      <KBRelatedArticles
        articles={[
          { categoryId: 'inbox', articleSlug: 'takeover', title: 'Human Takeover' },
          { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' },
          { categoryId: 'analytics', articleSlug: 'overview', title: 'Understanding Your Data' },
        ]}
      />
    </>
  );
}
