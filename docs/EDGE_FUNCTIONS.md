# ChatPad Edge Functions

> **Last Updated**: December 2024  
> **Status**: Active  
> **Related**: [Supabase Integration](./SUPABASE_INTEGRATION_GUIDE.md), [Security](./SECURITY.md), [AI Architecture](./AI_ARCHITECTURE.md)

Documentation for all Supabase Edge Functions in the ChatPad platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Widget Functions](#widget-functions)
3. [Chat Functions](#chat-functions)
4. [Lead Functions](#lead-functions)
5. [Team Functions](#team-functions)
6. [Webhook Functions](#webhook-functions)
7. [Scheduled Functions](#scheduled-functions)
8. [Utility Functions](#utility-functions)

---

## Overview

ChatPad uses Supabase Edge Functions (Deno runtime) for server-side logic. Functions are located in `supabase/functions/`.

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

---

## Widget Functions

### `serve-widget`

**Purpose:** Serves the widget JavaScript loader script.

**Auth:** Public (no JWT required)

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

**Details:**
- Creates conversation if not exists
- Retrieves relevant knowledge via vector search
- Augments system prompt with context
- Calls AI model via Lovable AI Gateway
- Stores both user and assistant messages
- Skips AI response if conversation is in `human_takeover` status

**RAG Flow:**
1. Generate embedding for user message
2. Search `knowledge_sources` for similar content
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

## Scheduled Functions

### `send-scheduled-report`

**Purpose:** Generates and emails scheduled analytics reports.

**Auth:** Service Role (called by cron)

**Method:** `POST`

**Request Body:**
```typescript
{
  reportId: string;
}
```

**Details:**
- Fetches report configuration
- Queries analytics data for period
- Generates report content
- Sends email to all recipients via Resend
- Updates `last_sent_at`

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

### `submit-rating`

**Purpose:** Submits a satisfaction rating for a conversation.

**Auth:** Public (widget)

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
- Generates vector embeddings via OpenAI
- Stores embeddings in knowledge source
- Updates status to 'ready'

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

- [Supabase Integration](./SUPABASE_INTEGRATION_GUIDE.md) - Client-side Supabase patterns
- [Security](./SECURITY.md) - Authentication and RLS policies
- [AI Architecture](./AI_ARCHITECTURE.md) - AI-related edge function details
- [Database Schema](./DATABASE_SCHEMA.md) - Table structures and relationships
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget-specific functions
