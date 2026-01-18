/**
 * Notifications Settings Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function NotificationsArticle() {
  return (
    <>
      <p>
        Control how and when Pilot notifies you about important events. 
        Customize notifications to stay informed without being overwhelmed.
      </p>

      <h2 id="accessing-notifications">Accessing Notification Settings</h2>
      <ol>
        <li>Click <strong>Settings</strong> in the sidebar</li>
        <li>Select the <strong>Notifications</strong> tab</li>
      </ol>

      <h2 id="notification-types">Notification Types</h2>

      <h3 id="in-app">In-App Notifications</h3>
      <p>
        Notifications that appear within Pilot:
      </p>
      <ul>
        <li><strong>Browser notifications:</strong> Desktop pop-ups when Pilot is open</li>
        <li><strong>Sound notifications:</strong> Audio alerts for new events</li>
      </ul>

      <h3 id="email">Email Notifications</h3>
      <p>
        Notifications sent to your email:
      </p>
      <ul>
        <li><strong>New leads:</strong> When a new lead is captured</li>
        <li><strong>New bookings:</strong> When appointments are scheduled</li>
        <li><strong>Conversation alerts:</strong> When attention is needed</li>
        <li><strong>Team updates:</strong> When team members are added/removed</li>
        <li><strong>Agent status:</strong> When Ari's status changes</li>
        <li><strong>Reports:</strong> Scheduled report deliveries</li>
        <li><strong>Product updates:</strong> New features and announcements</li>
      </ul>

      <KBCallout variant="tip">
        Enable email notifications for critical events you shouldn't miss, 
        even when you're not actively using Pilot.
      </KBCallout>

      <h2 id="configuring-preferences">Configuring Preferences</h2>
      <p>
        Toggle each notification type on or off:
      </p>
      <ul>
        <li>Enable categories you want to receive</li>
        <li>Disable categories that aren't relevant</li>
        <li>Changes save automatically</li>
      </ul>

      <h2 id="notification-categories">Notification Categories</h2>

      <h3 id="conversations">Conversation Notifications</h3>
      <ul>
        <li>New conversation started</li>
        <li>Conversation requires attention</li>
        <li>Takeover requested</li>
      </ul>

      <h3 id="leads-notifications">Lead Notifications</h3>
      <ul>
        <li>New lead captured</li>
        <li>Lead assigned to you</li>
        <li>Lead status changed</li>
      </ul>

      <h3 id="booking-notifications">Booking Notifications</h3>
      <ul>
        <li>New booking created</li>
        <li>Booking cancelled</li>
        <li>Booking reminder</li>
      </ul>

      <h3 id="team-notifications">Team Notifications</h3>
      <ul>
        <li>New team member joined</li>
        <li>Invitation accepted</li>
        <li>Role changed</li>
      </ul>

      <h3 id="agent-notifications">Agent Notifications</h3>
      <ul>
        <li>Ari status changes</li>
        <li>Knowledge source updates</li>
        <li>Error alerts</li>
      </ul>

      <KBCallout variant="info">
        Some critical notifications cannot be disabled, such as security 
        alerts and account-related communications.
      </KBCallout>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Enable browser notifications for real-time awareness</li>
        <li>Use email for events that need follow-up</li>
        <li>Review notification settings periodically</li>
        <li>Disable non-essential notifications to reduce noise</li>
      </ul>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <p>
        If notifications aren't working:
      </p>
      <ul>
        <li>Check browser permissions for notifications</li>
        <li>Verify your email is correct in Profile settings</li>
        <li>Check spam/junk folders for email notifications</li>
        <li>Ensure the notification category is enabled</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'settings', articleSlug: 'team', title: 'Managing Your Team' },
          { categoryId: 'inbox', articleSlug: 'overview', title: 'Inbox Overview' },
        ]}
      />
    </>
  );
}
