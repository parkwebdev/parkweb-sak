/**
 * Integrations Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBStepByStep } from '@/components/knowledge-base/KBStepByStep';
import { KBArticleLink, KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';

export default function IntegrationsArticle() {
  return (
    <>
      <p>
        Connect Pilot to your existing tools and services. Integrations help 
        sync data, automate workflows, and extend Ari's capabilities.
      </p>

      <h2 id="available-integrations">Available Integrations</h2>

      <h3 id="calendar-integrations">Calendar Integrations</h3>
      <p>
        Sync appointments with your calendar:
      </p>
      <ul>
        <li><strong>Google Calendar:</strong> Two-way sync for bookings with real-time availability</li>
      </ul>

      <KBCallout variant="info">
        Calendar integrations enable real-time availability checking. 
        When a visitor tries to book, Ari sees your actual schedule.
      </KBCallout>

      <h3 id="automation">Automation & Workflows</h3>
      <p>
        Connect to external systems using automation tools:
      </p>
      <ul>
        <li><strong>Webhooks:</strong> Push data to any system when events occur (leads, bookings, conversations)</li>
        <li><strong>Custom Tools:</strong> Build custom API integrations for Ari to use</li>
        <li><strong>Zapier/n8n:</strong> Use third-party automation platforms for complex workflows</li>
      </ul>

      <h3 id="notifications">Notification Channels</h3>
      <p>
        Stay informed about activity:
      </p>
      <ul>
        <li><strong>Email:</strong> Receive email notifications for important events</li>
        <li><strong>Browser:</strong> Desktop push notifications for real-time alerts</li>
      </ul>

      <h2 id="connecting-integration">Connecting an Integration</h2>
      <KBStepByStep
        steps={[
          {
            title: 'Navigate to Ari → Integrations',
            description: 'Open the Ari configurator and select the Integrations section.',
          },
          {
            title: 'Find Your Integration',
            description: 'Browse the available integrations and find the one you want to connect.',
          },
          {
            title: 'Click Connect',
            description: 'Click the Connect button for your chosen integration.',
          },
          {
            title: 'Authenticate',
            description: 'Follow the prompts to sign in and authorize the connection.',
          },
          {
            title: 'Configure Settings',
            description: 'Set up sync preferences and field mappings as needed.',
          },
        ]}
      />

      <h2 id="google-calendar">Google Calendar Setup</h2>
      <KBStepByStep
        steps={[
          {
            title: 'Click Connect Google Calendar',
            description: 'In the Integrations section, click Connect next to Google Calendar.',
          },
          {
            title: 'Sign In with Google',
            description: 'Sign in with your Google account that has the calendar you want to use.',
          },
          {
            title: 'Grant Permissions',
            description: 'Allow Pilot to access your calendar for reading and creating events.',
          },
          {
            title: 'Select Your Calendar',
            description: 'Choose which calendar to sync with Pilot (you can use a shared team calendar).',
          },
          {
            title: 'Configure Sync Settings',
            description: 'Set your availability hours and booking preferences.',
          },
        ]}
      />

      <KBCallout variant="tip">
        Use a dedicated calendar for Pilot bookings rather than your personal 
        calendar. This keeps things organized and allows for better team access.
      </KBCallout>

      <h2 id="sync-settings">Sync Settings</h2>
      <p>
        Control how data flows between systems:
      </p>
      <ul>
        <li><strong>Sync frequency:</strong> Real-time, hourly, or daily</li>
        <li><strong>Sync direction:</strong> One-way or bidirectional</li>
        <li><strong>Field mapping:</strong> Match Pilot fields to external fields</li>
        <li><strong>Conflict resolution:</strong> How to handle data conflicts</li>
      </ul>

      <h2 id="managing-integrations">Managing Integrations</h2>

      <h3 id="viewing-status">Viewing Status</h3>
      <p>
        Monitor your integration health:
      </p>
      <ul>
        <li>Connection status (connected, disconnected, error)</li>
        <li>Last sync time</li>
        <li>Sync errors and warnings</li>
      </ul>

      <h3 id="reconnecting">Reconnecting</h3>
      <p>
        If an integration disconnects:
      </p>
      <ol>
        <li>Check the error message for details</li>
        <li>Click <strong>Reconnect</strong></li>
        <li>Re-authenticate if needed</li>
        <li>Verify settings are correct</li>
      </ol>

      <h3 id="disconnecting">Disconnecting</h3>
      <p>
        To remove an integration:
      </p>
      <ol>
        <li>Navigate to the integration settings</li>
        <li>Click <strong>Disconnect</strong></li>
        <li>Confirm the disconnection</li>
      </ol>

      <KBCallout variant="warning">
        Disconnecting an integration stops data sync but doesn't delete 
        existing data. Historical records remain in both systems.
      </KBCallout>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <p>
        Common integration issues:
      </p>
      <ul>
        <li><strong>Authentication expired:</strong> Reconnect and re-authorize</li>
        <li><strong>Rate limits:</strong> Reduce sync frequency</li>
        <li><strong>Field mismatch:</strong> Review field mapping configuration</li>
        <li><strong>Permissions:</strong> Ensure the connected account has proper access</li>
      </ul>

      <h2 id="security">Security</h2>
      <p>
        Integration security measures:
      </p>
      <ul>
        <li>OAuth 2.0 for secure authentication</li>
        <li>Encrypted data in transit</li>
        <li>Minimal permission scopes requested</li>
        <li>Regular token refresh</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'planner', articleSlug: 'overview', title: 'Using the Planner' },
          { categoryId: 'ari', articleSlug: 'webhooks', title: 'Webhooks' },
          { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' },
        ]}
      />
    </>
  );
}
