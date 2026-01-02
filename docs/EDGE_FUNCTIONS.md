# Pilot Edge Functions

> **Last Updated**: January 2026  
> **Status**: Active  
> **Calendar Webhook Integration**: ✅ Phases 1-5, 7 Complete (December 2025)
> **Analytics Phase 6**: ✅ Complete (December 2025) - BookingTrendChart, RecentBookingsTable, ChartCardHeader integration
> **Related**: [Database Schema](./DATABASE_SCHEMA.md), [Security](./SECURITY.md), [AI Architecture](./AI_ARCHITECTURE.md)

Documentation for all Supabase Edge Functions in the Pilot platform.

---

## Table of Contents

1. [Overview](#overview)
   - [Error Handling](#error-handling)
2. [Widget Functions](#widget-functions)
3. [Chat Functions](#chat-functions)
4. [Lead Functions](#lead-functions)
5. [Team Functions](#team-functions)
6. [Webhook Functions](#webhook-functions)
7. [Scheduled Functions](#scheduled-functions)
8. [Utility Functions](#utility-functions)

---

## Overview

Pilot uses Supabase Edge Functions (Deno runtime) for server-side logic. Functions are located in `supabase/functions/`.

### Authentication Types

| Type | Description | Usage |
|------|-------------|-------|
| **Public** | No authentication required | Widget endpoints |
| **Authenticated** | Requires valid JWT | Admin endpoints |
| **Service Role** | Uses service role key | Internal/scheduled |

### Standard Headers

All functions that can be called from browsers include CORS headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### Error Handling

All edge functions use type-safe error handling with `catch (error: unknown)`. Use the same pattern as client-side code:

```typescript
import { getErrorMessage } from '../_shared/errors.ts';

try {
  // Edge function logic
} catch (error: unknown) {
  console.error('Operation failed:', getErrorMessage(error));
  return new Response(
    JSON.stringify({ error: getErrorMessage(error) }),
    { status: 500, headers: corsHeaders }
  );
}
```

**See**: [DESIGN_SYSTEM.md#error-handling-pattern](./DESIGN_SYSTEM.md#error-handling-pattern) for the complete pattern.

---

## Widget Functions

### `serve-widget`

**Purpose:** Serves the widget JavaScript loader script.

**Auth:** Public (no JWT required)

**Rate Limit:** 30 requests/minute per IP

**Method:** `GET`

**Response:** JavaScript file with CORS headers

**Details:**
- Dynamically determines app URL from environment/referer
- Generates self-executing loader script
- Script reads agent config from data attributes
- Creates floating button and iframe

```typescript
// Usage (embed in website)
<script 
  src="https://project.supabase.co/functions/v1/serve-widget"
  data-agent-id="uuid"
  async
></script>
```

---

### `get-widget-config`

**Purpose:** Fetches complete widget configuration for an agent.

**Auth:** Public (no JWT required)

**Rate Limit:** 20 requests/minute per IP

**Method:** `POST`

**Request Body:**
```typescript
{
  agentId: string;
}
```

**Response:**
```typescript
{
  agentId: string;
  agentName: string;
  systemPrompt: string;
  model: string;
  // All deployment_config fields
  primaryColor: string;
  gradientStartColor: string;
  gradientEndColor: string;
  heroTitle: string;
  heroSubtitle: string;
  // Related data
  announcements: Announcement[];
  helpCategories: HelpCategory[];
  helpArticles: HelpArticle[];
}
```

**Details:**
- Parallelized database queries for performance
- Only returns active/published content
- Caches config for 5 minutes

---

## Chat Functions

### `widget-chat`

**Purpose:** Processes chat messages with RAG and returns AI responses.

**Auth:** Public (no JWT required)

**Method:** `POST`

**Request Body:**
```typescript
{
  agentId: string;
  conversationId: string;
  message: string;
  sessionId?: string;
}
```

**Response:**
```typescript
{
  response: string;
  conversationId: string;
}
```

**Modular Architecture (Phase 4 Complete):**

The widget-chat function has been refactored into modular components:

| Directory | Purpose |
|-----------|---------|
| `_shared/handlers/` | High-level orchestration handlers |
| `_shared/ai/` | AI, embeddings, RAG, summarization |
| `_shared/tools/` | Tool definitions and execution |
| `_shared/memory/` | Conversation history, semantic memory |
| `_shared/security/` | Content moderation, sanitization |
| `_shared/utils/` | Utility functions |

**Handler Modules (`_shared/handlers/`):**
- `conversation.ts` - Conversation lifecycle management
- `context.ts` - RAG search & system prompt building
- `tool-executor.ts` - Tool execution orchestration
- `response-builder.ts` - Post-processing & response construction

**Details:**
- Creates conversation if not exists
- Retrieves relevant knowledge via vector search
- Augments system prompt with context
- Calls AI model via OpenRouter
- Stores both user and assistant messages
- Skips AI response if conversation is in `human_takeover` status

**RAG Flow:**
1. Generate embedding for user message
2. Search `knowledge_chunks` and `help_articles` for similar content
3. Inject top matches into system prompt
4. Generate response with augmented context

---

### `send-human-message`

**Purpose:** Sends a message from a team member during human takeover.

**Auth:** Authenticated (requires JWT)

**Method:** `POST`

**Request Body:**
```typescript
{
  conversationId: string;
  content: string;
}
```

**Response:**
```typescript
{
  success: true;
  message: Message;
}
```

**Details:**
- Validates user has access to conversation
- Creates message with `role: 'assistant'` and metadata:
  ```typescript
  {
    sender_type: 'human',
    sender_name: 'John D.',  // Masked last name
    sender_avatar: 'https://...'
  }
  ```
- Updates conversation `updated_at`
- Triggers real-time subscription for widget

---

### `get-takeover-agent`

**Purpose:** Gets the profile of the team member handling a conversation.

**Auth:** Public (used by widget)

**Rate Limit:** 20 requests/minute per IP

**Method:** `POST`

**Request Body:**
```typescript
{
  conversationId: string;
}
```

**Response:**
```typescript
{
  name: string;      // "John D." (masked)
  avatarUrl: string | null;
}
```

**Details:**
- Finds most recent active takeover
- Looks up profile for `taken_over_by` user
- Masks last name for privacy (shows first letter only)
- Returns "Team Member" if no profile found

---

### `update-message-reaction`

**Purpose:** Adds or removes an emoji reaction from a message.

**Auth:** Public (used by widget)

**Method:** `POST`

**Request Body:**
```typescript
{
  messageId: string;
  emoji: string;
  userId: string;  // Session ID for widget users
  action: 'add' | 'remove';
}
```

**Response:**
```typescript
{
  success: true;
  reactions: Array<{ emoji: string; user: string }>;
}
```

**Details:**
- Retrieves current reactions from message metadata
- Adds/removes reaction
- Updates message metadata
- Returns updated reactions array

---

### `mark-messages-read`

**Purpose:** Marks messages as read for a conversation.

**Auth:** Authenticated (admin) or Public (widget user)

**Rate Limit:** 30 requests/minute per IP

**Method:** `POST`

**Request Body:**
```typescript
{
  conversationId: string;
  readerId?: string;      // For widget users
  readerType: 'admin' | 'user';
}
```

**Response:**
```typescript
{
  success: true;
}
```

**Details:**
- Admin readers: Updates `admin_last_read_at` in conversation metadata
- Widget users: Validates conversation ownership
- Used for unread badge clearing

---

### `fetch-link-preview`

**Purpose:** Fetches Open Graph metadata for URL previews.

**Auth:** Public

**Rate Limit:** 10 requests/minute per IP

**SSRF Protection:** Blocks localhost, private IPs, cloud metadata endpoints

**Method:** `POST`

**Request Body:**
```typescript
{
  url: string;
}
```

**Response:**
```typescript
{
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}
```

**Details:**
- Validates URL against SSRF blocklist before fetching
- Fetches HTML from URL
- Parses Open Graph and Twitter Card meta tags
- Caches results for performance
- Used for rich link previews in chat messages

---

### `proxy-image`

**Purpose:** Proxies external images through the server for security and CORS handling.

**Auth:** Public

**Rate Limit:** 30 requests/minute per IP

**SSRF Protection:** Blocks localhost, private IPs, cloud metadata endpoints

**Method:** `GET`

**Query Parameters:**
```typescript
{
  url: string;  // The image URL to proxy
}
```

**Response:** Binary image data with appropriate Content-Type header

**Details:**
- Validates URL against SSRF blocklist before fetching
- Fetches image from external URL
- Streams image data to client
- Sets appropriate Content-Type based on response
- Used for displaying external images in chat (link previews)
- Prevents mixed content warnings on HTTPS pages

---

## Lead Functions

### `create-widget-lead`

**Purpose:** Creates a lead from widget contact form submission.

**Auth:** Public (no JWT required)

**Method:** `POST`

**Request Body:**
```typescript
{
  agentId: string;
  name: string;
  email: string;
  phone?: string;
  customFields?: Record<string, string>;
  sessionId: string;
  formLoadTime: number;  // Timestamp when form loaded
  honeypot?: string;     // Should be empty
}
```

**Response:**
```typescript
{
  success: true;
  leadId: string;
  conversationId: string;
}
```

**Spam Protection:**
1. Honeypot check - reject if filled
2. Timing check - reject if < 2 seconds since form load
3. Rate limit - reject if same email submitted in last minute

**Details:**
- Creates lead in `leads` table
- Creates linked conversation
- Stores custom fields in `data` JSONB column with human-readable labels
- Captures session metadata (IP, country, device, etc.)

---

## Team Functions

### `send-team-invitation`

**Purpose:** Sends email invitation to join a team.

**Auth:** Authenticated

**Method:** `POST`

**Request Body:**
```typescript
{
  email: string;
  inviterName: string;
  companyName?: string;
}
```

**Response:**
```typescript
{
  success: true;
  invitationId: string;
}
```

**Details:**
- Creates pending invitation record
- Sends email via Resend API
- Invitation expires in 7 days
- Logs security event

---

### `handle-signup`

**Purpose:** Processes new user signups and handles pending invitations.

**Auth:** Service Role (called by auth trigger)

**Method:** `POST`

**Request Body:**
```typescript
{
  email: string;
  user_id: string;
}
```

**Details:**
- Checks for pending invitation matching email
- If found:
  - Updates invitation status to 'accepted'
  - Creates `team_members` record
  - Logs security event
- Creates initial user profile

---

## Webhook Functions

### `trigger-webhook`

**Purpose:** Triggers webhook events for specific actions.

**Auth:** Service Role (internal use)

**Method:** `POST`

**Request Body:**
```typescript
{
  eventType: string;
  agentId?: string;
  payload: Record<string, any>;
}
```

**Details:**
- Finds active webhooks subscribed to event type
- Filters by agent_id if specified
- Evaluates webhook conditions
- Queues delivery via `dispatch-webhook-event`

**Event Types:**
- `conversation.created`
- `conversation.closed`
- `message.received`
- `lead.created`
- `takeover.started`
- `takeover.ended`

---

### `dispatch-webhook-event`

**Purpose:** Delivers webhook payloads with retry logic.

**Auth:** Service Role (internal use)

**Method:** `POST`

**Request Body:**
```typescript
{
  webhookId: string;
  eventType: string;
  payload: Record<string, any>;
}
```

**Details:**
- Fetches webhook configuration
- Applies authentication (none, basic, bearer, api_key)
- Makes HTTP request to webhook URL
- Logs result in `webhook_logs`
- Retries on failure (up to 3 times with exponential backoff)

---

## Calendar Functions

### `book-appointment`

**Purpose:** Books an appointment via widget or API.

**Auth:** Public (widget) or API key

**Rate Limit:** 5 requests/minute per IP (stricter limit for booking creation)

**Method:** `POST`

**Request Body:**
```typescript
{
  agentId: string;
  locationId?: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  startTime: string;      // ISO timestamp
  endTime: string;        // ISO timestamp
  eventType?: string;     // e.g., 'showing', 'tour', 'consultation'
  notes?: string;
  conversationId?: string;
}
```

**Response:**
```typescript
{
  success: true;
  eventId: string;
  calendarEventId?: string;
}
```

**Details:**
- Validates time slot availability
- Creates calendar event in connected calendar
- Links to conversation if provided
- Sends confirmation notification

---

### `check-calendar-availability`

**Purpose:** Checks available time slots for booking.

**Auth:** Public (widget)

**Rate Limit:** 20 requests/minute per IP

**Method:** `POST`

**Request Body:**
```typescript
{
  agentId: string;
  locationId?: string;
  dateRange: {
    start: string;  // ISO date
    end: string;    // ISO date
  };
  duration?: number;  // Minutes, default 30
}
```

**Response:**
```typescript
{
  availableSlots: Array<{
    start: string;
    end: string;
  }>;
}
```

**Details:**
- Queries connected calendar for busy times
- Respects business hours from location settings
- Returns available slots within date range

---

### `google-calendar-auth`

**Purpose:** Handles Google Calendar OAuth flow with webhook subscription.

**Auth:** Authenticated

**Method:** `POST`

**Actions:**
- `initiate`: Generates OAuth URL for user authorization
- `callback`: Exchanges code for tokens, creates webhook subscription
- `refresh`: Refreshes expired access token
- `disconnect`: Revokes tokens and stops webhook subscription
- `sync`: Manual sync of calendar events (Phase 6)
- `refresh-webhook`: Renews webhook subscription manually (Phase 6)

**Request Body (callback):**
```typescript
{
  action: 'callback';
  code: string;    // OAuth authorization code
  state: string;   // Base64-encoded state with agentId, locationId, userId
}
```

**Response (callback):**
```typescript
{
  success: true;
  accountId: string;
  webhookEnabled: boolean;  // Whether push notifications were set up
}
```

**Webhook Integration (December 2025):**
- On successful OAuth callback, creates a Google Calendar push notification subscription
- Webhooks notify `google-calendar-webhook` of event changes in real-time
- Enables accurate booking analytics (show rate, cancellations, reschedules)
- Webhooks expire after 7 days and are renewed by `renew-calendar-webhooks`

**Required Secrets:**
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL
- `CALENDAR_WEBHOOK_SECRET` - Token for webhook validation (optional but recommended)

---

### `google-calendar-webhook`

**Purpose:** Receives push notifications from Google Calendar when events change.

**Auth:** Public (validated via channel token)

**Method:** `POST` (called by Google)

**Google Notification Headers:**
```
X-Goog-Channel-ID: our channel UUID
X-Goog-Resource-ID: Google's resource identifier
X-Goog-Resource-State: 'sync' | 'exists' | 'not_exists'
X-Goog-Message-Number: incremental number
X-Goog-Channel-Token: our webhook secret
```

**Details:**
- Validates webhook token if `CALENDAR_WEBHOOK_SECRET` is configured
- Handles `sync` notifications (subscription confirmation)
- On `exists`/`not_exists` notifications, syncs recent calendar changes
- Updates `calendar_events` status based on external changes:
  - Google event cancelled → status = `cancelled`
  - Past events still confirmed → status = `completed`
  - Time changes → updates `start_time`/`end_time`
- Updates `last_synced_at` on connected account
- Always returns 200 to prevent Google retries on errors

**Required Secrets:**
- `GOOGLE_CLIENT_ID` - For token refresh
- `GOOGLE_CLIENT_SECRET` - For token refresh
- `CALENDAR_WEBHOOK_SECRET` - For request validation

---

### `renew-calendar-webhooks`

**Purpose:** Scheduled function to renew expiring webhook subscriptions.

**Auth:** Service Role (scheduled function)

**Schedule:** Daily at 2:00 AM UTC

**Details:**
- Finds connected accounts with webhooks expiring within 2 days
- Stops existing webhook subscription
- Refreshes OAuth token if expired
- Creates new webhook subscription with 7-day expiration
- Updates account with new webhook details

**Response:**
```typescript
{
  success: true;
  total: number;      // Accounts processed
  renewed: number;    // Successfully renewed
  failed: number;     // Failed to renew
  errors: string[];   // Error messages
}
```

**Required Secrets:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CALENDAR_WEBHOOK_SECRET`

---

### `outlook-calendar-auth`

**Purpose:** Handles Outlook/Microsoft Calendar OAuth flow with webhook subscription.

**Auth:** Authenticated

**Method:** `POST`

**Actions:**
- `initiate`: Generates OAuth URL for Microsoft authorization
- `callback`: Exchanges code for tokens, creates Graph subscription
- `refresh`: Refreshes expired access token
- `disconnect`: Deletes subscription and removes account

**Response (callback):**
```typescript
{
  success: true;
  accountId: string;
  webhookEnabled: boolean;
}
```

**Webhook Integration (Phase 3 - December 2025):**
- On successful OAuth callback, creates a Microsoft Graph subscription
- Subscriptions expire after 3 days max (Microsoft limit)
- Notifications sent to `outlook-calendar-webhook` for real-time sync

**Required Secrets:**
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_REDIRECT_URI`
- `CALENDAR_WEBHOOK_SECRET`

---

### `outlook-calendar-webhook`

**Purpose:** Receives change notifications from Microsoft Graph when calendar events change.

**Auth:** Public (validated via clientState)

**Method:** `GET` (validation) / `POST` (notifications)

**Validation Flow:**
Microsoft sends GET with `?validationToken=...` - must echo back as plain text.

**Notification Body:**
```typescript
{
  value: [{
    subscriptionId: string;
    clientState: string;
    changeType: 'created' | 'updated' | 'deleted';
    resource: string;
    resourceData: { id: string };
  }]
}
```

**Details:**
- Validates clientState if `CALENDAR_WEBHOOK_SECRET` is configured
- Fetches event details from Graph API for updates
- Updates `calendar_events` status based on changes
- Returns 202 Accepted (Microsoft requirement)

---

## Shared Calendar Sync (Phase 4)

### `_shared/calendar-sync.ts`

**Purpose:** Shared utilities for calendar event synchronization.

**Functions:**
- `shouldAutoComplete(endTime, currentStatus)` - Determines if past event should auto-complete
- `mapExternalStatus(status, provider)` - Maps provider status to internal status
- `syncEventStatus(supabase, eventId, ...)` - Updates event with external data
- `findEventByExternalId(supabase, accountId, externalId)` - Finds event by external ID
- `autoCompletePastEvents(supabase, cutoffTime, limit)` - Batch auto-complete past events

**Auto-Complete Logic:**
- Events with `end_time` in the past and status `confirmed` → `completed`
- Skips events already in terminal states (`cancelled`, `no_show`, `completed`)

---

## WordPress Integration Functions

### `sync-wordpress-communities`

**Purpose:** Syncs WordPress communities/locations.

**Auth:** Service Role

**Method:** `POST`

**Request Body:**
```typescript
{
  agentId: string;
  apiUrl: string;
}
```

**Details:**
- Fetches communities from WordPress REST API
- Creates/updates location records
- Sets `wordpress_community_id` and `wordpress_slug`

---

### `sync-wordpress-homes`

**Purpose:** Syncs home listings from WordPress.

**Auth:** Service Role

**Method:** `POST`

**Request Body:**
```typescript
{
  agentId: string;
  locationId?: string;
}
```

**Details:**
- Fetches home listings from WordPress REST API
- Creates/updates property records
- Extracts images, pricing, features
- Links to knowledge source for RAG

---

## Scheduled Functions

### `send-scheduled-report`

**Purpose:** Generates and emails scheduled analytics reports with full visual parity to the Report Builder.

**Auth:** Service Role (called by cron or manually via POST)

**Method:** `POST`

**Request Body (Optional - for manual trigger):**
```typescript
{
  forceReportId?: string;  // Force send a specific report immediately
}
```

**Architecture:**

Uses `@react-pdf/renderer` with ported PDF components for visual parity:

```
supabase/functions/_shared/
├── build-pdf-data.ts        # Server-side data builder (24 data sections)
└── pdf/
    ├── AnalyticsReportPDF.tsx   # Main document (matches frontend)
    ├── PDFHeader.tsx
    ├── PDFFooter.tsx
    ├── PDFSection.tsx
    ├── PDFTable.tsx
    ├── PDFExecutiveSummary.tsx
    ├── PDFLogo.tsx
    ├── charts.tsx               # All chart components
    ├── chart-utils.ts           # Scaling, colors, formatting
    ├── pdf-utils.ts             # sanitizePDFData, normalizePDFConfig
    ├── styles.ts                # Design tokens
    ├── fonts.ts                 # Inter font registration
    ├── types.ts                 # PDFData, PDFConfig types
    └── index.ts                 # Exports
```

**Data Builder (`build-pdf-data.ts`):**

Fetches all 24 data sections matching the frontend builder:
- KPI metrics (conversations, leads, conversion rate)
- Conversation stats, funnel, peak activity
- Lead stats, lead by source, lead conversion trend
- Booking stats, booking trend
- Satisfaction stats, recent feedback
- AI performance stats, AI performance trend
- Traffic sources, traffic source trend
- Top pages, page engagement, page depth distribution
- Visitor locations, visitor cities
- Usage metrics, agent performance

**PDF Generation Flow:**

1. Fetch scheduled report config from `scheduled_reports` table
2. Build `PDFData` using `buildPDFDataFromSupabase()`
3. Normalize config with `normalizePDFConfig()` (same defaults as frontend)
4. Sanitize data with `sanitizePDFData()` (same limits as frontend)
5. Render PDF using `AnalyticsReportPDF` component
6. Upload to `report-exports` storage bucket
7. Generate signed URL (7 days expiry)
8. Send email via Resend with download link
9. Create record in `report_exports` table
10. Update `last_sent_at` on scheduled report

**Config Parity:**

The edge function reads all 24 configuration flags from `report_config`:
- `includeKPIs`, `includeCharts`, `includeTables`
- `includeConversations`, `includeConversationFunnel`, `includePeakActivity`
- `includeLeads`, `includeLeadSourceBreakdown`, `includeLeadConversionTrend`
- `includeBookings`, `includeBookingTrend`
- `includeSatisfaction`, `includeCustomerFeedback`
- `includeAIPerformance`, `includeAIPerformanceTrend`
- `includeTrafficSources`, `includeTrafficSourceTrend`
- `includeTopPages`, `includePageEngagement`, `includePageDepth`
- `includeVisitorLocations`, `includeVisitorCities`
- `includeUsageMetrics`, `includeAgentPerformance`

**Manual Testing:**

```bash
# Trigger a specific report immediately
curl -X POST \
  'https://[project].supabase.co/functions/v1/send-scheduled-report' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer [anon-key]' \
  -d '{"forceReportId": "uuid-here"}'
```

**Related:** [PDF Generator - Server-Side Generation](./PDF_GENERATOR.md#server-side-generation-scheduled-reports)

---

### `cleanup-expired-conversations`

**Purpose:** Removes expired conversations and related data.

**Auth:** Service Role (called by cron)

**Method:** `POST`

**Details:**
- Finds conversations where `expires_at < now()`
- Deletes related messages
- Deletes related takeovers
- Deletes conversations
- Returns count of deleted records

---

### `cleanup-orphaned-sources`

**Purpose:** Deletes orphaned knowledge sources (where parent no longer exists).

**Auth:** Service Role (called by cron)

**Method:** `POST`

**Details:**
- Finds knowledge_sources where `parent_source_id` references a non-existent source
- Deletes associated knowledge_chunks via CASCADE
- Prevents accumulation of stale data from failed batch processing
- Runs daily via scheduled cron

---

### `send-booking-confirmation`

**Purpose:** Sends booking confirmation emails with .ics calendar attachments.

**Auth:** Service Role (internal only - requires `x-internal-secret` header)

**Method:** `POST`

**Request Body:**
```typescript
{
  eventId: string;
  visitorEmail: string;
  visitorName: string;
  eventDetails: {
    title: string;
    startTime: string;
    endTime: string;
    locationName?: string;
    locationAddress?: string;
    locationPhone?: string;
  };
}
```

**Response:**
```typescript
{
  success: true;
  emailId: string;
}
```

**Details:**
- Generates .ics calendar file attachment
- Sends confirmation email via Resend
- Includes location details and contact information
- Called internally by `book-appointment` function

---

### `scheduled-wordpress-sync`

**Purpose:** Hourly cron job for automatic WordPress community/home synchronization.

**Auth:** Service Role (cron trigger)

**Method:** `POST`

**Request Body:** None (triggered by cron)

**Details:**
- Runs hourly via Supabase cron
- Fetches all agents with WordPress connections configured
- Reads endpoint configuration from each agent's `deployment_config`
- Invokes `sync-wordpress-communities` and `sync-wordpress-homes` for each
- Logs sync results and errors
- Respects stored endpoint URLs (custom post type slugs)

---

### `submit-rating`

**Purpose:** Submits a satisfaction rating for a conversation.

**Auth:** Public (widget)

**Rate Limit:** 10 requests/minute per IP

**Method:** `POST`

**Request Body:**
```typescript
{
  conversationId: string;
  rating: number;          // 1-5
  feedback?: string;       // Optional text feedback
  triggerType: 'team_closed' | 'ai_marked_complete';
}
```

**Response:**
```typescript
{
  success: true;
  ratingId: string;
}
```

**Details:**
- Validates conversation exists
- Validates rating is between 1-5
- Creates record in `conversation_ratings` table
- Rate limited: 1 rating per conversation

---

### `update-page-visits`

**Purpose:** Tracks visitor page visits for analytics.

**Auth:** Public (widget)

**Rate Limit:** 30 requests/minute per IP

**Method:** `POST`

**Request Body:**
```typescript
{
  conversationId: string;
  visitorId: string;
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
}
```

**Response:**
```typescript
{
  success: true;
}
```

**Details:**
- Validates conversation ownership
- Validates visitorId matches conversation
- Filters out internal widget URLs (widget.html, widget-entry)
- Updates conversation metadata with visited pages array
- Tracks landing page for first visit

---

## Utility Functions

### `validate_api_key` (Database Function)

**Purpose:** Validates agent-level API keys with rate limiting.

**Note:** This is now a PostgreSQL function, not an Edge Function.

**Function Signature:**
```sql
validate_api_key(p_key_hash text, p_agent_id uuid)
RETURNS TABLE(valid boolean, key_id uuid, rate_limited boolean, error_message text)
```

**Usage in Edge Functions:**
```typescript
const { data, error } = await supabaseAdmin
  .rpc('validate_api_key', {
    p_key_hash: hashedKey,
    p_agent_id: agentId
  });

if (!data?.[0]?.valid) {
  return new Response(JSON.stringify({ 
    error: data?.[0]?.error_message || 'Invalid API key' 
  }), { status: 401 });
}

if (data?.[0]?.rate_limited) {
  return new Response(JSON.stringify({ 
    error: data[0].error_message 
  }), { status: 429 });
}
```

**Details:**
- Validates key hash against stored hashes
- Checks if key is revoked
- Enforces per-minute rate limiting (sliding window)
- Enforces per-day rate limiting (sliding window)
- Updates usage counters automatically
- Returns detailed error messages for debugging
```

**Details:**
- Hashes provided key
- Looks up in `api_keys` table
- Updates `last_used_at` if found
- Returns associated permissions

---

### `verify-custom-domain`

**Purpose:** Verifies custom domain DNS configuration.

**Auth:** Authenticated

**Method:** `POST`

**Request Body:**
```typescript
{
  domainId: string;
}
```

**Response:**
```typescript
{
  verified: boolean;
  dnsConfigured: boolean;
  sslStatus: string;
}
```

**Details:**
- Fetches domain record
- Performs DNS lookup for verification TXT record
- Checks CNAME/A record configuration
- Updates domain status

---

### `get-invoices`

**Purpose:** Fetches Stripe invoices for a user.

**Auth:** Authenticated

**Method:** `GET`

**Response:**
```typescript
{
  invoices: Array<{
    id: string;
    number: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    invoicePdf: string;
  }>;
}
```

**Details:**
- Gets user from JWT
- Finds Stripe customer by email
- Fetches invoices from Stripe
- Formats and returns invoice data

---

### `send-notification-email`

**Purpose:** Sends notification emails for various events.

**Auth:** Service Role

**Method:** `POST`

**Request Body:**
```typescript
{
  templateName: string;
  recipientEmail: string;
  variables: Record<string, string>;
}
```

**Details:**
- Fetches email template by name
- Replaces template variables
- Sends via Resend API

---

### `submit-article-feedback`

**Purpose:** Records user feedback on help articles.

**Auth:** Public (widget)

**Method:** `POST`

**Request Body:**
```typescript
{
  articleId: string;
  sessionId: string;
  isHelpful: boolean;
  comment?: string;
}
```

**Response:**
```typescript
{
  success: true;
}
```

**Details:**
- Rate limited: 1 feedback per article per session per minute
- Comment sanitized (HTML stripped)
- Comment max length: 1000 characters

---

### `process-knowledge-source`

**Purpose:** Processes uploaded knowledge sources for RAG.

**Auth:** Service Role (background job)

**Method:** `POST`

**Request Body:**
```typescript
{
  knowledgeSourceId: string;
}
```

**Details:**
- Fetches source configuration
- Downloads/extracts content based on type:
  - PDF: Extract text
  - URL: Scrape page content
  - CSV/JSON/XML: Parse and convert
- Chunks content for embedding
- Generates vector embeddings via Qwen3 (OpenRouter)
- Stores embeddings in knowledge_chunks
- Updates status to 'ready'

---

### `refresh-knowledge-sources`

**Purpose:** Refreshes knowledge sources based on their refresh strategy.

**Auth:** Service Role (cron)

**Method:** `POST`

**Details:**
- Finds sources where `next_refresh_at < now()`
- Re-fetches and re-processes each source
- Updates `last_fetched_at` and `next_refresh_at`
- Handles sitemap child pages

---

### `embed-help-article`

**Purpose:** Generates embeddings for help articles.

**Auth:** Service Role

**Method:** `POST`

**Request Body:**
```typescript
{
  articleId: string;
}
```

**Details:**
- Called after article creation/update
- Generates vector embedding for article content
- Stores embedding in `help_articles.embedding` column
- Enables semantic search in widget help center

---

### `translate-messages`

**Purpose:** Translates message content between languages using AI.

**Auth:** Authenticated (requires JWT)

**Method:** `POST`

**Request Body:**
```typescript
{
  messages: Array<{
    id: string;
    content: string;
  }>;
  targetLanguage: string;  // e.g., "Spanish", "French", "German"
}
```

**Response:**
```typescript
{
  translations: Array<{
    id: string;
    original: string;
    translated: string;
  }>;
  targetLanguage: string;
}
```

**Details:**
- Uses Lovable AI Gateway for translation
- Preserves message IDs for mapping
- Handles batch translations efficiently
- Returns original content alongside translations
- Rate limited: 10 requests/minute

---

### `test-tool-endpoint`

**Purpose:** Tests a custom tool endpoint configuration.

**Auth:** Authenticated

**Method:** `POST`

**Request Body:**
```typescript
{
  agentId: string;
  endpointUrl: string;
  headers?: Record<string, string>;
  parameters?: Record<string, any>;
  timeoutMs?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  statusCode: number;
  responseBody: any;
  responseTime: number;
  error?: string;
}
```

**Details:**
- Validates agent ownership
- SSRF protection (blocks localhost, private IPs, cloud metadata)
- Makes test request to endpoint
- Returns response for debugging

---

## Environment Variables

All edge functions have access to these secrets:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key (embeddings) |
| `LOVABLE_API_KEY` | Lovable AI Gateway key |
| `RESEND_API_KEY` | Resend email API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `APP_URL` | Application URL |
| `INTERNAL_WEBHOOK_SECRET` | Internal webhook auth |

---

## Error Handling

Standard error response format:

```typescript
{
  error: string;
  details?: string;
  code?: string;
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `429` - Rate limited
- `500` - Internal server error

---

## Logging

All functions use structured logging:

```typescript
function logStep(step: string, details?: any) {
  console.log(`[${functionName}] ${step}`, details ? JSON.stringify(details) : '');
}

logStep('Processing request', { agentId, conversationId });
logStep('RAG search complete', { matchCount: results.length });
logStep('Response generated', { tokenCount: response.length });
```

View logs at: `https://supabase.com/dashboard/project/{project_id}/functions/{function_name}/logs`

---

## Related Documentation

- [Hooks Reference](./HOOKS_REFERENCE.md) - Client-side Supabase patterns
- [Security](./SECURITY.md) - Authentication and RLS policies
- [AI Architecture](./AI_ARCHITECTURE.md) - AI-related edge function details
- [Database Schema](./DATABASE_SCHEMA.md) - Table structures and relationships
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget-specific functions
