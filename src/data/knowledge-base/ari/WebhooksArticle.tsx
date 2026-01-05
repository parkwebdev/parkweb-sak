/**
 * Webhooks Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function WebhooksArticle() {
  return (
    <>
      <p>
        Webhooks allow Pilot to notify your external systems when events happen. 
        Get real-time updates for new conversations, leads, bookings, and more.
      </p>

      <h2 id="what-are-webhooks">What Are Webhooks?</h2>
      <p>
        A webhook is an automated message sent from Pilot to your URL when 
        something happens:
      </p>
      <ul>
        <li>A new lead is captured</li>
        <li>An appointment is booked</li>
        <li>A conversation is completed</li>
        <li>A message is received</li>
      </ul>

      <KBCallout variant="info">
        Unlike APIs where you request data, webhooks push data to you 
        automatically when events occur.
      </KBCallout>

      <h2 id="creating-webhook">Creating a Webhook</h2>
      <ol>
        <li>Navigate to <strong>Ari → Webhooks</strong></li>
        <li>Click <strong>Add Webhook</strong></li>
        <li>Configure the webhook settings</li>
        <li>Save and activate</li>
      </ol>

      <h3 id="webhook-settings">Webhook Settings</h3>
      <ul>
        <li><strong>Name:</strong> Descriptive name for the webhook</li>
        <li><strong>URL:</strong> Endpoint to receive the data</li>
        <li><strong>Events:</strong> Which events trigger the webhook</li>
        <li><strong>Method:</strong> HTTP method (usually POST)</li>
        <li><strong>Headers:</strong> Custom headers for authentication</li>
      </ul>

      <h2 id="available-events">Available Events</h2>
      <p>
        Subscribe to events that matter to your workflow:
      </p>
      <ul>
        <li><strong>lead.created:</strong> New lead captured</li>
        <li><strong>lead.updated:</strong> Lead information changed</li>
        <li><strong>booking.created:</strong> New appointment scheduled</li>
        <li><strong>booking.cancelled:</strong> Appointment cancelled</li>
        <li><strong>conversation.started:</strong> New conversation begun</li>
        <li><strong>conversation.completed:</strong> Conversation ended</li>
        <li><strong>message.received:</strong> New visitor message</li>
      </ul>

      <h2 id="payload-format">Payload Format</h2>
      <p>
        Webhooks send JSON payloads with event data:
      </p>
      <ul>
        <li><strong>event:</strong> Type of event (e.g., "lead.created")</li>
        <li><strong>timestamp:</strong> When the event occurred</li>
        <li><strong>data:</strong> Event-specific information</li>
      </ul>

      <KBCallout variant="tip">
        Use a service like webhook.site to test and inspect incoming payloads 
        before connecting to your production systems.
      </KBCallout>

      <h2 id="authentication">Authentication</h2>
      <p>
        Secure your webhook endpoints:
      </p>
      <ul>
        <li><strong>API Key:</strong> Include a secret key in headers</li>
        <li><strong>Basic Auth:</strong> Username and password</li>
        <li><strong>Bearer Token:</strong> OAuth-style tokens</li>
        <li><strong>Signature Verification:</strong> Validate request authenticity</li>
      </ul>

      <h2 id="conditions">Conditional Webhooks</h2>
      <p>
        Add conditions to filter when webhooks fire:
      </p>
      <ul>
        <li>Only for leads from specific sources</li>
        <li>Only for bookings at certain locations</li>
        <li>Only during business hours</li>
        <li>Based on custom field values</li>
      </ul>

      <h2 id="response-actions">Response Actions</h2>
      <p>
        Configure what happens based on your endpoint's response:
      </p>
      <ul>
        <li>Update lead data based on CRM response</li>
        <li>Trigger follow-up actions</li>
        <li>Log external system IDs</li>
      </ul>

      <h2 id="retry-logic">Retry Logic</h2>
      <p>
        When a webhook fails:
      </p>
      <ul>
        <li>Pilot automatically retries failed webhooks</li>
        <li>Exponential backoff between retries</li>
        <li>Maximum of 5 retry attempts</li>
        <li>Failed webhooks are logged for review</li>
      </ul>

      <h2 id="monitoring">Monitoring Webhooks</h2>
      <p>
        Track webhook health:
      </p>
      <ul>
        <li>View delivery history for each webhook</li>
        <li>See success/failure rates</li>
        <li>Inspect payloads and responses</li>
        <li>Retry failed deliveries manually</li>
      </ul>

      <KBCallout variant="warning">
        If a webhook consistently fails, it may be automatically disabled 
        to prevent system overload. Check your endpoint and re-enable when fixed.
      </KBCallout>

      <h2 id="use-cases">Common Use Cases</h2>
      <ul>
        <li><strong>CRM Integration:</strong> Sync leads to Salesforce, HubSpot</li>
        <li><strong>Notifications:</strong> Send Slack alerts for new bookings</li>
        <li><strong>Analytics:</strong> Track events in your data warehouse</li>
        <li><strong>Automation:</strong> Trigger Zapier workflows</li>
      </ul>
    </>
  );
}
