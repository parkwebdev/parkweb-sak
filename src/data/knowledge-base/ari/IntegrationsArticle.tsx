/**
 * Integrations Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

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
        <li><strong>Google Calendar:</strong> Two-way sync for bookings</li>
        <li><strong>Microsoft Outlook:</strong> Connect your Outlook calendar</li>
      </ul>

      <KBCallout variant="info">
        Calendar integrations enable real-time availability checking. 
        When a visitor tries to book, Ari sees your actual schedule.
      </KBCallout>

      <h3 id="crm-integrations">CRM Integrations</h3>
      <p>
        Sync leads with your customer relationship management system:
      </p>
      <ul>
        <li>Automatic lead creation in your CRM</li>
        <li>Bidirectional sync for updates</li>
        <li>Custom field mapping</li>
      </ul>

      <h3 id="communication">Communication Tools</h3>
      <ul>
        <li><strong>Email:</strong> Send follow-up emails from conversations</li>
        <li><strong>SMS:</strong> Text message notifications and reminders</li>
        <li><strong>Slack:</strong> Team notifications for new leads and bookings</li>
      </ul>

      <h2 id="connecting-integration">Connecting an Integration</h2>
      <ol>
        <li>Navigate to <strong>Ari → Integrations</strong></li>
        <li>Find the integration you want to connect</li>
        <li>Click <strong>Connect</strong></li>
        <li>Follow the authentication prompts</li>
        <li>Configure integration settings</li>
      </ol>

      <h2 id="google-calendar">Google Calendar Setup</h2>
      <ol>
        <li>Click <strong>Connect Google Calendar</strong></li>
        <li>Sign in with your Google account</li>
        <li>Grant permission to access your calendar</li>
        <li>Select which calendar to sync with Pilot</li>
        <li>Configure sync settings</li>
      </ol>

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
    </>
  );
}
