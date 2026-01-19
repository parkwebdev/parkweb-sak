-- Enhance 5 brief Help Center articles with comprehensive content
-- Articles: Custom Tools, Webhooks, Integrations, API Access, Using the Planner

-- 1. Custom Tools - Enhance from ~1,100 to ~4,000 characters
UPDATE platform_hc_articles
SET content = '<p class="lead">Custom Tools extend Ari''s capabilities by connecting to external APIs and services. When a visitor asks a question that requires real-time data, Ari can call your custom tools to fetch information and provide accurate responses.</p>

<h2 id="what-are-custom-tools">What Are Custom Tools?</h2>
<p>Custom Tools are HTTP endpoints that Ari can call during conversations. They allow Ari to:</p>
<ul>
  <li><strong>Fetch real-time data</strong> — Check inventory, order status, availability</li>
  <li><strong>Perform actions</strong> — Create records, update systems, send notifications</li>
  <li><strong>Access your systems</strong> — Connect to CRMs, databases, internal APIs</li>
</ul>

<div data-callout data-callout-type="info">
  <p><strong>When does Ari use tools?</strong> Ari intelligently decides when to call a tool based on the conversation context and the tool''s description. Write clear descriptions to help Ari understand when each tool should be used.</p>
</div>

<h2 id="creating-a-tool">Creating a Custom Tool</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Navigate to Custom Tools" data-step-description="Go to Ari → Custom Tools in the sidebar and click ''Add Tool''."></div>
  <div data-step data-step-number="2" data-step-title="Configure Basic Info" data-step-description="Enter a name (e.g., ''Check Inventory'') and a clear description of what the tool does and when Ari should use it."></div>
  <div data-step data-step-number="3" data-step-title="Set the Endpoint" data-step-description="Enter your API endpoint URL. This should be a publicly accessible HTTPS endpoint."></div>
  <div data-step data-step-number="4" data-step-title="Add Parameters" data-step-description="Define the parameters Ari will pass to your API. Set type, description, and whether each is required."></div>
  <div data-step data-step-number="5" data-step-title="Configure Headers" data-step-description="Add any authentication headers like API keys or Bearer tokens."></div>
  <div data-step data-step-number="6" data-step-title="Test and Save" data-step-description="Use the test feature to verify the tool works, then save."></div>
</div>

<h2 id="parameter-types">Parameter Configuration</h2>
<p>Each parameter you define tells Ari what information to extract from the conversation:</p>
<table>
  <thead>
    <tr><th>Type</th><th>Use Case</th><th>Example</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>String</strong></td><td>Text values</td><td>Product name, email address</td></tr>
    <tr><td><strong>Number</strong></td><td>Numeric values</td><td>Quantity, price, ID</td></tr>
    <tr><td><strong>Boolean</strong></td><td>Yes/no values</td><td>Include details, active only</td></tr>
    <tr><td><strong>Enum</strong></td><td>Fixed options</td><td>Size (S/M/L), status (open/closed)</td></tr>
  </tbody>
</table>

<div data-callout data-callout-type="tip">
  <p><strong>Write great descriptions!</strong> Parameter descriptions help Ari understand what value to extract. Instead of "product", write "The name or SKU of the product the customer is asking about".</p>
</div>

<h2 id="authentication">Authentication & Security</h2>
<p>Protect your API endpoints with proper authentication:</p>
<ul>
  <li><strong>API Keys</strong> — Add as a header: <code>X-API-Key: your-key-here</code></li>
  <li><strong>Bearer Tokens</strong> — Add as: <code>Authorization: Bearer your-token</code></li>
  <li><strong>Custom Headers</strong> — Any headers your API requires</li>
</ul>

<div data-callout data-callout-type="warning">
  <p><strong>Security note:</strong> Your API should validate requests and implement rate limiting. Never expose sensitive operations without proper authentication.</p>
</div>

<h2 id="response-format">Expected Response Format</h2>
<p>Your API should return JSON. Ari will use the response to formulate a natural reply:</p>
<pre><code>{
  "success": true,
  "data": {
    "product": "Blue Widget",
    "in_stock": true,
    "quantity": 45,
    "price": 29.99
  }
}</code></pre>

<h2 id="error-handling">Error Handling</h2>
<p>When a tool fails, Ari will gracefully handle the error:</p>
<ul>
  <li><strong>Timeout</strong> — If your API doesn''t respond in 30 seconds, Ari apologizes and offers alternatives</li>
  <li><strong>Error response</strong> — Ari acknowledges the issue without exposing technical details</li>
  <li><strong>Missing parameters</strong> — Ari asks the visitor for the required information</li>
</ul>

<h2 id="example-use-cases">Example Use Cases</h2>
<ul>
  <li><strong>Inventory lookup</strong> — "Do you have the blue widget in stock?"</li>
  <li><strong>Order tracking</strong> — "Where is my order #12345?"</li>
  <li><strong>Appointment availability</strong> — "What times are available this Friday?"</li>
  <li><strong>Pricing calculator</strong> — "How much would 100 units cost?"</li>
  <li><strong>CRM lookup</strong> — Retrieve customer history during conversations</li>
</ul>

<div data-related-articles data-articles=''[{"category_id":"ari","slug":"api-access","title":"API Access"},{"category_id":"ari","slug":"webhooks","title":"Webhooks"}]''></div>',
    updated_at = now()
WHERE slug = 'custom-tools' AND category_id = 'ari';

-- 2. Webhooks - Enhance from ~1,061 to ~4,500 characters
UPDATE platform_hc_articles
SET content = '<p class="lead">Webhooks let you receive real-time notifications when events happen in Pilot. Instead of polling for changes, your systems are notified instantly when conversations start, leads are created, appointments are booked, and more.</p>

<h2 id="what-are-webhooks">What Are Webhooks?</h2>
<p>Webhooks are HTTP POST requests sent to your server when specific events occur. They enable:</p>
<ul>
  <li><strong>Real-time updates</strong> — Know immediately when something happens</li>
  <li><strong>Automated workflows</strong> — Trigger actions in other systems</li>
  <li><strong>Data synchronization</strong> — Keep your CRM, database, or tools in sync</li>
</ul>

<h2 id="creating-webhook">Creating a Webhook</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Navigate to Webhooks" data-step-description="Go to Ari → Webhooks in the sidebar and click ''Add Webhook''."></div>
  <div data-step data-step-number="2" data-step-title="Enter Endpoint URL" data-step-description="Provide the HTTPS URL where you want to receive webhook events."></div>
  <div data-step data-step-number="3" data-step-title="Select Events" data-step-description="Choose which events should trigger this webhook."></div>
  <div data-step data-step-number="4" data-step-title="Configure Secret" data-step-description="Set a signing secret to verify webhook authenticity (recommended)."></div>
  <div data-step data-step-number="5" data-step-title="Save and Test" data-step-description="Save the webhook and use the test feature to verify it works."></div>
</div>

<h2 id="event-types">Available Event Types</h2>
<table>
  <thead>
    <tr><th>Event</th><th>Triggered When</th></tr>
  </thead>
  <tbody>
    <tr><td><code>conversation.started</code></td><td>A new conversation begins</td></tr>
    <tr><td><code>conversation.ended</code></td><td>A conversation is closed or expires</td></tr>
    <tr><td><code>conversation.takeover</code></td><td>A team member takes over from Ari</td></tr>
    <tr><td><code>lead.created</code></td><td>A new lead is captured</td></tr>
    <tr><td><code>lead.updated</code></td><td>Lead information is modified</td></tr>
    <tr><td><code>appointment.booked</code></td><td>A visitor books an appointment</td></tr>
    <tr><td><code>appointment.cancelled</code></td><td>An appointment is cancelled</td></tr>
  </tbody>
</table>

<h2 id="payload-structure">Payload Structure</h2>
<p>All webhook payloads follow a consistent structure:</p>
<pre><code>{
  "event": "lead.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "lead_abc123",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1 555-123-4567",
    "conversation_id": "conv_xyz789"
  }
}</code></pre>

<h3 id="conversation-payload">Conversation Event Payload</h3>
<pre><code>{
  "event": "conversation.ended",
  "timestamp": "2024-01-15T10:45:00Z",
  "data": {
    "id": "conv_xyz789",
    "status": "closed",
    "message_count": 12,
    "duration_seconds": 340,
    "lead_id": "lead_abc123",
    "location_id": "loc_main"
  }
}</code></pre>

<h2 id="security">Security & Verification</h2>
<p>Always verify webhook authenticity to prevent spoofing:</p>

<div data-callout data-callout-type="warning">
  <p><strong>Important:</strong> Never trust webhook data without verifying the signature. Attackers could send fake requests to your endpoint.</p>
</div>

<h3>Verifying Signatures</h3>
<p>Each webhook includes a <code>X-Webhook-Signature</code> header. Verify it using HMAC-SHA256:</p>
<pre><code>const crypto = require(''crypto'');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac(''sha256'', secret)
    .update(payload)
    .digest(''hex'');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}</code></pre>

<h2 id="retry-behavior">Retry Behavior</h2>
<p>If your endpoint fails to respond with a 2xx status code, we retry with exponential backoff:</p>
<ul>
  <li><strong>Attempt 1:</strong> Immediate</li>
  <li><strong>Attempt 2:</strong> After 1 minute</li>
  <li><strong>Attempt 3:</strong> After 5 minutes</li>
  <li><strong>Attempt 4:</strong> After 30 minutes</li>
  <li><strong>Attempt 5:</strong> After 2 hours</li>
</ul>
<p>After 5 failed attempts, the webhook is marked as failed and you''ll receive a notification.</p>

<h2 id="testing">Testing Webhooks</h2>
<div data-callout data-callout-type="tip">
  <p><strong>Use webhook.site</strong> — Create a free temporary endpoint at <a href="https://webhook.site" target="_blank">webhook.site</a> to test your webhooks before connecting your production systems.</p>
</div>

<h2 id="common-integrations">Common Integrations</h2>
<ul>
  <li><strong>Zapier</strong> — Connect to 5,000+ apps with no-code automation</li>
  <li><strong>Make (Integromat)</strong> — Build complex multi-step workflows</li>
  <li><strong>n8n</strong> — Self-hosted workflow automation</li>
  <li><strong>Slack</strong> — Get notified of new leads or takeover requests</li>
  <li><strong>HubSpot/Salesforce</strong> — Sync leads to your CRM automatically</li>
</ul>

<div data-related-articles data-articles=''[{"category_id":"ari","slug":"custom-tools","title":"Custom Tools"},{"category_id":"ari","slug":"integrations","title":"Integrations"}]''></div>',
    updated_at = now()
WHERE slug = 'webhooks' AND category_id = 'ari';

-- 3. Integrations - Enhance from ~1,105 to ~3,500 characters
UPDATE platform_hc_articles
SET content = '<p class="lead">Connect Pilot to your favorite tools and services. Integrations allow Ari to book appointments directly to your calendar, sync data with your CRM, and automate workflows across your tech stack.</p>

<h2 id="available-integrations">Available Integrations</h2>

<h3 id="google-calendar">Google Calendar</h3>
<p>Let Ari book appointments directly to your Google Calendar. Visitors can see your real-time availability and schedule meetings without back-and-forth emails.</p>

<h4>Features</h4>
<ul>
  <li><strong>Real-time availability</strong> — Ari checks your calendar before offering times</li>
  <li><strong>Automatic event creation</strong> — Appointments appear on your calendar instantly</li>
  <li><strong>Conflict prevention</strong> — Never double-book again</li>
  <li><strong>Calendar selection</strong> — Choose which calendar to use for bookings</li>
</ul>

<h4>Connecting Google Calendar</h4>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Go to Integrations" data-step-description="Navigate to Ari → Integrations in the sidebar."></div>
  <div data-step data-step-number="2" data-step-title="Click Connect" data-step-description="Find Google Calendar and click the ''Connect'' button."></div>
  <div data-step data-step-number="3" data-step-title="Authorize Access" data-step-description="Sign in with your Google account and grant calendar access."></div>
  <div data-step data-step-number="4" data-step-title="Select Calendar" data-step-description="Choose which calendar Ari should use for bookings."></div>
  <div data-step data-step-number="5" data-step-title="Configure Settings" data-step-description="Set buffer times, booking windows, and availability hours."></div>
</div>

<div data-callout data-callout-type="info">
  <p><strong>Multiple calendars?</strong> You can connect multiple Google accounts and assign different calendars to different locations.</p>
</div>

<h3 id="automation-platforms">Automation Platforms</h3>
<p>Connect Pilot to thousands of apps using workflow automation platforms:</p>

<h4>Zapier</h4>
<p>Use our Zapier integration to:</p>
<ul>
  <li>Add new leads to your CRM (HubSpot, Salesforce, Pipedrive)</li>
  <li>Send Slack notifications for new conversations</li>
  <li>Create tasks in Asana, Monday, or Notion</li>
  <li>Add contacts to email marketing tools (Mailchimp, ConvertKit)</li>
</ul>

<h4>Make (Integromat)</h4>
<p>Build complex multi-step workflows with conditional logic, data transformation, and connections to 1,000+ apps.</p>

<div data-callout data-callout-type="tip">
  <p><strong>Getting started with automation?</strong> Use our <a data-article-link data-category-id="ari" data-slug="webhooks">webhooks</a> to send real-time events to Zapier or Make.</p>
</div>

<h2 id="managing-connections">Managing Connected Accounts</h2>
<p>View and manage all your connected integrations:</p>
<ul>
  <li><strong>Connection status</strong> — See if integrations are active and working</li>
  <li><strong>Last synced</strong> — Check when data was last synchronized</li>
  <li><strong>Refresh token</strong> — Re-authorize if a connection expires</li>
  <li><strong>Disconnect</strong> — Remove an integration when no longer needed</li>
</ul>

<h2 id="troubleshooting">Troubleshooting</h2>

<h3>Calendar not syncing?</h3>
<ul>
  <li>Check that the connection is still active in Integrations</li>
  <li>Try disconnecting and reconnecting the calendar</li>
  <li>Ensure the calendar isn''t read-only</li>
</ul>

<h3>Authorization expired?</h3>
<p>Google tokens expire after extended periods. Simply click "Reconnect" to re-authorize.</p>

<h3>Wrong calendar showing?</h3>
<p>Go to Integrations → Google Calendar → Settings and select the correct calendar.</p>

<h2 id="coming-soon">Coming Soon</h2>
<ul>
  <li><strong>Microsoft Outlook</strong> — Calendar and email integration</li>
  <li><strong>HubSpot</strong> — Direct CRM sync without webhooks</li>
  <li><strong>Calendly</strong> — Use your existing Calendly scheduling</li>
</ul>

<div data-related-articles data-articles=''[{"category_id":"ari","slug":"webhooks","title":"Webhooks"},{"category_id":"planner","slug":"overview","title":"Using the Planner"}]''></div>',
    updated_at = now()
WHERE slug = 'integrations' AND category_id = 'ari';

-- 4. API Access - Enhance from ~810 to ~4,000 characters
UPDATE platform_hc_articles
SET content = '<p class="lead">The Pilot API gives you programmatic access to your data and conversations. Build custom integrations, create dashboards, or connect Pilot to your internal systems.</p>

<h2 id="api-overview">API Overview</h2>
<ul>
  <li><strong>Base URL:</strong> <code>https://api.getpilot.com/v1</code></li>
  <li><strong>Format:</strong> RESTful JSON API</li>
  <li><strong>Authentication:</strong> API key in header</li>
</ul>

<h2 id="creating-api-key">Creating an API Key</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Navigate to API Access" data-step-description="Go to Ari → API Access in the sidebar."></div>
  <div data-step data-step-number="2" data-step-title="Click Create Key" data-step-description="Click ''Create API Key'' to generate a new key."></div>
  <div data-step data-step-number="3" data-step-title="Name Your Key" data-step-description="Give the key a descriptive name (e.g., ''Production Server'', ''Analytics Dashboard'')."></div>
  <div data-step data-step-number="4" data-step-title="Copy and Store Securely" data-step-description="Copy the key immediately — it won''t be shown again. Store it securely."></div>
</div>

<div data-callout data-callout-type="warning">
  <p><strong>Keep your API key secret!</strong> Never expose it in client-side code or public repositories. Treat it like a password.</p>
</div>

<h2 id="authentication">Authentication</h2>
<p>Include your API key in the <code>Authorization</code> header:</p>
<pre><code>Authorization: Bearer YOUR_API_KEY</code></pre>

<h3>Example Request (cURL)</h3>
<pre><code>curl -X GET "https://api.getpilot.com/v1/leads" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"</code></pre>

<h3>Example Request (JavaScript)</h3>
<pre><code>const response = await fetch(''https://api.getpilot.com/v1/leads'', {
  headers: {
    ''Authorization'': ''Bearer YOUR_API_KEY'',
    ''Content-Type'': ''application/json''
  }
});
const leads = await response.json();</code></pre>

<h2 id="endpoints">Available Endpoints</h2>

<h3>Leads</h3>
<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/leads</code></td><td>List all leads</td></tr>
    <tr><td><code>GET</code></td><td><code>/leads/:id</code></td><td>Get a specific lead</td></tr>
    <tr><td><code>POST</code></td><td><code>/leads</code></td><td>Create a new lead</td></tr>
    <tr><td><code>PATCH</code></td><td><code>/leads/:id</code></td><td>Update a lead</td></tr>
    <tr><td><code>DELETE</code></td><td><code>/leads/:id</code></td><td>Delete a lead</td></tr>
  </tbody>
</table>

<h3>Conversations</h3>
<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/conversations</code></td><td>List conversations</td></tr>
    <tr><td><code>GET</code></td><td><code>/conversations/:id</code></td><td>Get conversation with messages</td></tr>
    <tr><td><code>POST</code></td><td><code>/conversations/:id/close</code></td><td>Close a conversation</td></tr>
  </tbody>
</table>

<h3>Analytics</h3>
<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/analytics/overview</code></td><td>Get conversation & lead metrics</td></tr>
    <tr><td><code>GET</code></td><td><code>/analytics/conversations</code></td><td>Conversation statistics</td></tr>
  </tbody>
</table>

<h2 id="rate-limits">Rate Limits</h2>
<p>API requests are rate limited to ensure fair usage:</p>
<ul>
  <li><strong>Standard:</strong> 100 requests per minute</li>
  <li><strong>Burst:</strong> Up to 20 requests per second</li>
</ul>

<p>When you exceed the limit, you''ll receive a <code>429 Too Many Requests</code> response. Check the <code>Retry-After</code> header for when to retry.</p>

<h2 id="error-handling">Error Handling</h2>
<p>The API returns standard HTTP status codes:</p>
<table>
  <thead>
    <tr><th>Status</th><th>Meaning</th></tr>
  </thead>
  <tbody>
    <tr><td><code>200</code></td><td>Success</td></tr>
    <tr><td><code>201</code></td><td>Created successfully</td></tr>
    <tr><td><code>400</code></td><td>Bad request — check your parameters</td></tr>
    <tr><td><code>401</code></td><td>Unauthorized — invalid API key</td></tr>
    <tr><td><code>404</code></td><td>Resource not found</td></tr>
    <tr><td><code>429</code></td><td>Rate limit exceeded</td></tr>
    <tr><td><code>500</code></td><td>Server error — contact support</td></tr>
  </tbody>
</table>

<h3>Error Response Format</h3>
<pre><code>{
  "error": {
    "code": "invalid_parameter",
    "message": "The ''email'' field must be a valid email address"
  }
}</code></pre>

<h2 id="webhooks-vs-api">Webhooks vs. API</h2>
<table>
  <thead>
    <tr><th>Use Case</th><th>Best Option</th></tr>
  </thead>
  <tbody>
    <tr><td>React to events in real-time</td><td>Webhooks</td></tr>
    <tr><td>Fetch data on demand</td><td>API</td></tr>
    <tr><td>Build a dashboard</td><td>API</td></tr>
    <tr><td>Sync to CRM when leads are created</td><td>Webhooks</td></tr>
    <tr><td>Bulk export data</td><td>API</td></tr>
  </tbody>
</table>

<div data-related-articles data-articles=''[{"category_id":"ari","slug":"webhooks","title":"Webhooks"},{"category_id":"ari","slug":"custom-tools","title":"Custom Tools"}]''></div>',
    updated_at = now()
WHERE slug = 'api-access' AND category_id = 'ari';

-- 5. Using the Planner - Enhance from ~741 to ~3,500 characters
UPDATE platform_hc_articles
SET content = '<p class="lead">The Planner is your central hub for managing appointments, tours, and events. View your schedule at a glance, add events manually, and keep track of all bookings made by Ari.</p>

<h2 id="planner-overview">Planner Overview</h2>
<p>The Planner displays all your scheduled events in an intuitive calendar interface:</p>
<ul>
  <li><strong>Day view</strong> — Detailed hour-by-hour schedule</li>
  <li><strong>Week view</strong> — See your entire week at a glance</li>
  <li><strong>Month view</strong> — Overview of busy and available days</li>
</ul>

<div data-callout data-callout-type="info">
  <p><strong>Events from all sources:</strong> The Planner shows appointments booked by Ari, events from connected calendars, and manually created events — all in one place.</p>
</div>

<h2 id="viewing-events">Viewing Events</h2>
<p>Click any event to view its details:</p>
<ul>
  <li><strong>Visitor information</strong> — Name, email, phone number</li>
  <li><strong>Event type</strong> — Tour, consultation, appointment</li>
  <li><strong>Location</strong> — Which location the event is for</li>
  <li><strong>Notes</strong> — Any additional information or context</li>
  <li><strong>Conversation link</strong> — Jump to the original conversation</li>
</ul>

<h2 id="creating-events">Creating Events Manually</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Open the Planner" data-step-description="Navigate to Planner in the sidebar."></div>
  <div data-step data-step-number="2" data-step-title="Click to Add" data-step-description="Click on a time slot or use the ''Add Event'' button."></div>
  <div data-step data-step-number="3" data-step-title="Fill in Details" data-step-description="Enter the event title, time, visitor info, and location."></div>
  <div data-step data-step-number="4" data-step-title="Select Event Type" data-step-description="Choose the appropriate event type (tour, appointment, etc.)."></div>
  <div data-step data-step-number="5" data-step-title="Save the Event" data-step-description="Click Save to add the event to your calendar."></div>
</div>

<h2 id="event-types">Event Types</h2>
<p>Organize your schedule with different event types:</p>
<table>
  <thead>
    <tr><th>Type</th><th>Description</th><th>Typical Duration</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Tour</strong></td><td>Property or facility tours</td><td>30-60 minutes</td></tr>
    <tr><td><strong>Appointment</strong></td><td>General appointments</td><td>30 minutes</td></tr>
    <tr><td><strong>Consultation</strong></td><td>In-depth meetings</td><td>45-60 minutes</td></tr>
    <tr><td><strong>Follow-up</strong></td><td>Check-in calls or visits</td><td>15-30 minutes</td></tr>
  </tbody>
</table>

<h2 id="editing-events">Editing & Cancelling Events</h2>

<h3>Editing an Event</h3>
<ol>
  <li>Click on the event in the calendar</li>
  <li>Click the "Edit" button</li>
  <li>Make your changes</li>
  <li>Save the updated event</li>
</ol>

<h3>Cancelling an Event</h3>
<ol>
  <li>Click on the event</li>
  <li>Click "Cancel Event"</li>
  <li>Optionally send a cancellation notification to the visitor</li>
  <li>Confirm the cancellation</li>
</ol>

<div data-callout data-callout-type="tip">
  <p><strong>Cancellation notifications:</strong> When you cancel an event booked by a visitor, they can automatically receive an email notification with the cancellation details.</p>
</div>

<h2 id="filtering">Filtering by Location</h2>
<p>If you have multiple locations, use the location filter to:</p>
<ul>
  <li>View events for a specific location only</li>
  <li>See all events across all locations</li>
  <li>Quickly switch between location views</li>
</ul>

<h2 id="calendar-sync">Calendar Sync</h2>
<p>Events sync automatically with connected calendars:</p>
<ul>
  <li><strong>Google Calendar</strong> — Two-way sync keeps everything updated</li>
  <li><strong>Blocking times</strong> — Personal events block availability for Ari</li>
</ul>

<p>To connect a calendar, go to <a data-article-link data-category-id="ari" data-slug="integrations">Ari → Integrations</a>.</p>

<h2 id="availability">Availability & Business Hours</h2>
<p>Configure when visitors can book appointments:</p>
<ul>
  <li><strong>Business hours</strong> — Set your working hours per day</li>
  <li><strong>Buffer time</strong> — Add padding between appointments</li>
  <li><strong>Minimum notice</strong> — Prevent last-minute bookings</li>
  <li><strong>Booking window</strong> — How far in advance visitors can book</li>
</ul>

<div data-related-articles data-articles=''[{"category_id":"ari","slug":"integrations","title":"Integrations"},{"category_id":"leads","slug":"overview","title":"Managing Leads"}]''></div>',
    updated_at = now()
WHERE slug = 'overview' AND category_id = 'planner';