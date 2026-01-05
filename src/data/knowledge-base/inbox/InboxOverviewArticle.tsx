/**
 * Managing Conversations Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function InboxOverviewArticle() {
  return (
    <>
      <p>
        The Inbox is your central hub for managing all conversations between Ari and 
        your website visitors. Here you can monitor, review, and take over conversations 
        when needed.
      </p>

      <h2 id="inbox-layout">Inbox Layout</h2>
      <p>
        The Inbox is divided into two main areas:
      </p>
      <ul>
        <li><strong>Conversation List</strong> – All active and recent conversations on the left</li>
        <li><strong>Conversation View</strong> – The selected conversation's full history on the right</li>
      </ul>

      <h2 id="conversation-status">Conversation Status</h2>
      <p>
        Each conversation has a status indicator:
      </p>
      <ul>
        <li><strong>Active</strong> – Ongoing conversation with recent activity</li>
        <li><strong>Taken Over</strong> – A team member is handling this conversation</li>
        <li><strong>Closed</strong> – Conversation has ended</li>
      </ul>

      <h2 id="filtering">Filtering & Search</h2>
      <p>
        Find specific conversations quickly:
      </p>
      <ul>
        <li>Search by visitor name, email, or message content</li>
        <li>Filter by status (active, taken over, closed)</li>
        <li>Filter by date range</li>
        <li>Filter by location (if using multiple locations)</li>
      </ul>

      <h2 id="reading-conversations">Reading Conversations</h2>
      <p>
        Click on any conversation to see the full message history. You'll see:
      </p>
      <ul>
        <li>All messages between Ari and the visitor</li>
        <li>Timestamps for each message</li>
        <li>Any actions taken (lead capture, booking, etc.)</li>
        <li>Visitor information in the sidebar</li>
      </ul>

      <KBCallout variant="tip">
        Use the Inbox to identify common questions that might need better coverage 
        in your knowledge base.
      </KBCallout>

      <h2 id="unread-badge">Unread Conversations</h2>
      <p>
        The sidebar shows a badge with the number of unread conversations. A conversation 
        is marked as unread when there's new visitor activity since you last viewed it.
      </p>

      <h2 id="visitor-info">Visitor Information</h2>
      <p>
        For each conversation, you can see:
      </p>
      <ul>
        <li>Name and contact information (if captured)</li>
        <li>Location and device information</li>
        <li>Page they started the conversation on</li>
        <li>Previous conversations with the same visitor</li>
      </ul>
    </>
  );
}
