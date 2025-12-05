# ChatPad System Architecture

Detailed system architecture documentation for the ChatPad platform.

## Table of Contents

1. [System Overview](#system-overview)
2. [Access Control Model](#access-control-model)
3. [AI Integration](#ai-integration)
4. [Deployment Methods](#deployment-methods)
5. [Data Flow](#data-flow)
6. [Plan Tiers](#plan-tiers)
7. [Monitoring & Analytics](#monitoring--analytics)

---

## System Overview

ChatPad is a multi-tenant AI agent platform built on a user-based ownership model with team sharing capabilities.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Admin App     │   Widget        │   External API              │
│   (React SPA)   │   (Embedded)    │   (REST)                    │
└────────┬────────┴────────┬────────┴──────────┬──────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Auth          │   Edge Functions │   Realtime                 │
│   (JWT)         │   (Deno)         │   (WebSocket)              │
└────────┬────────┴────────┬────────┴──────────┬──────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   PostgreSQL    │   Row Level     │   Storage                   │
│   (Tables)      │   Security      │   (Buckets)                 │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Core Entities

| Entity | Description |
|--------|-------------|
| **User** | Account owner with subscription |
| **Team Member** | User with access to another user's resources |
| **Agent** | AI chatbot configuration |
| **Conversation** | Chat session with a widget visitor |
| **Lead** | Contact information captured from widget |
| **Knowledge Source** | RAG data for agent responses |

---

## Access Control Model

### Ownership Pattern

Resources are owned by users via `user_id` column:

```sql
-- Example: agents table
CREATE TABLE agents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,  -- Owner
  name text NOT NULL,
  -- ...
);
```

### Team Sharing

Team members gain access through `team_members` table:

```sql
CREATE TABLE team_members (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,   -- Resource owner
  member_id uuid NOT NULL,  -- Team member
  role text DEFAULT 'member'
);
```

### Access Function

The `has_account_access()` function checks ownership OR team membership:

```sql
CREATE FUNCTION has_account_access(account_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = account_owner_id 
     OR EXISTS (
       SELECT 1 FROM team_members 
       WHERE owner_id = account_owner_id 
         AND member_id = auth.uid()
     )
$$;
```

### RLS Implementation

```sql
-- Typical policy pattern
CREATE POLICY "Users can view accessible agents"
ON agents FOR SELECT
USING (has_account_access(user_id));

CREATE POLICY "Users can create their own agents"
ON agents FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Role Hierarchy

```
super_admin
    │
    ▼
  admin ─────────┐
    │            │
    ▼            ▼
 manager      (all permissions)
    │
    ▼
 member
    │
    ▼
 client
```

**Role Capabilities:**

| Role | Capabilities |
|------|-------------|
| `super_admin` | Full platform access, manage plans |
| `admin` | Manage team, all resource access |
| `manager` | Manage agents, conversations, leads |
| `member` | View and respond to conversations |
| `client` | Limited view access |

---

## AI Integration

### RAG Pipeline

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Query   │────▶│   Embed      │────▶│   Vector     │
│          │     │   Query      │     │   Search     │
└──────────┘     └──────────────┘     └──────────────┘
                                            │
                                            ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ Response │◀────│   Generate   │◀────│   Augment    │
│          │     │   Response   │     │   Prompt     │
└──────────┘     └──────────────┘     └──────────────┘
```

### Knowledge Processing

1. **Upload**: User uploads PDF, URL, CSV, etc.
2. **Extract**: Content extracted from source
3. **Chunk**: Content split into chunks
4. **Embed**: OpenAI generates vector embeddings
5. **Store**: Vectors stored in `knowledge_sources`

### Vector Search

```sql
CREATE FUNCTION search_knowledge_sources(
  p_agent_id uuid,
  p_query_embedding vector,
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 5
)
RETURNS TABLE(id uuid, source text, content text, type text, similarity float)
AS $$
  SELECT
    ks.id, ks.source, ks.content, ks.type::text,
    1 - (ks.embedding <=> p_query_embedding) as similarity
  FROM knowledge_sources ks
  WHERE ks.agent_id = p_agent_id
    AND ks.status = 'ready'
    AND 1 - (ks.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY ks.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
```

### Model Selection

Available models via Lovable AI Gateway:

| Model | Use Case | Cost |
|-------|----------|------|
| `google/gemini-2.5-flash` | Fast, economical (default) | $ |
| `google/gemini-2.5-pro` | Complex reasoning | $$ |
| `openai/gpt-4o` | High quality | $$$ |
| `openai/gpt-4o-mini` | Fast OpenAI option | $$ |
| `anthropic/claude-3.5-sonnet` | Nuanced responses | $$$ |

---

## Deployment Methods

### 1. Embeddable Widget

Primary deployment method - JavaScript snippet for websites:

```html
<script 
  src="https://project.supabase.co/functions/v1/serve-widget"
  data-agent-id="uuid"
  async
></script>
```

**Features:**
- Floating chat button
- Customizable appearance
- Help center integration
- Contact form capture
- Voice messages
- File attachments

### 2. Hosted Chat Page

Direct link to full-page chat interface:

```
https://app.chatpad.com/chat/[agent-id]
```

**Use Cases:**
- QR codes
- Email signatures
- Social media links

### 3. API Access

REST API for custom integrations:

```typescript
// Example: Send message
const response = await fetch(`${SUPABASE_URL}/functions/v1/widget-chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    agentId: 'uuid',
    conversationId: 'uuid',
    message: 'Hello!'
  })
});
```

---

## Data Flow

### Widget Conversation Flow

```
┌─────────┐     ┌──────────┐     ┌─────────────┐
│ Visitor │────▶│  Widget  │────▶│ get-widget- │
│         │     │  Opens   │     │   config    │
└─────────┘     └──────────┘     └─────────────┘
                                       │
                                       ▼
┌─────────┐     ┌──────────┐     ┌─────────────┐
│ Message │────▶│  Widget  │────▶│ widget-chat │
│  Sent   │     │          │     │ (with RAG)  │
└─────────┘     └──────────┘     └─────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
              ┌─────────────┐                    ┌─────────────┐
              │   Message   │                    │  AI Model   │
              │   Stored    │                    │  Response   │
              └─────────────┘                    └─────────────┘
```

### Human Takeover Flow

```
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│   Admin   │────▶│   Takeover   │────▶│  Status:      │
│  Clicks   │     │   Button     │     │  human_       │
│ "Takeover"│     │              │     │  takeover     │
└───────────┘     └──────────────┘     └───────────────┘
                                              │
                                              ▼
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│  Widget   │◀────│   Realtime   │◀────│   Takeover    │
│  Updates  │     │ Subscription │     │   Record      │
└───────────┘     └──────────────┘     └───────────────┘
                                              │
                                              ▼
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│  Human    │────▶│ send-human-  │────▶│   Message     │
│ Response  │     │   message    │     │  (realtime)   │
└───────────┘     └──────────────┘     └───────────────┘
```

### Lead Capture Flow

```
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│  Visitor  │────▶│   Contact    │────▶│ create-widget │
│  Fills    │     │    Form      │     │     -lead     │
│   Form    │     │              │     │               │
└───────────┘     └──────────────┘     └───────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         ▼                                        ▼
                  ┌─────────────┐                         ┌─────────────┐
                  │    Lead     │                         │ Conversation│
                  │   Created   │◀────────────────────────│   Created   │
                  └─────────────┘      (linked)           └─────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   Webhook   │
                  │  Triggered  │
                  └─────────────┘
```

---

## Plan Tiers

### Basic Plan

| Feature | Limit |
|---------|-------|
| Agents | 1 |
| Conversations/month | 100 |
| Knowledge sources | 5 |
| Team members | 1 |
| File storage | 100MB |

### Advanced Plan

| Feature | Limit |
|---------|-------|
| Agents | 5 |
| Conversations/month | 1,000 |
| Knowledge sources | 25 |
| Team members | 5 |
| File storage | 1GB |
| Custom branding | ✓ |
| Webhooks | ✓ |
| API access | ✓ |

### Pro Plan

| Feature | Limit |
|---------|-------|
| Agents | Unlimited |
| Conversations/month | 10,000 |
| Knowledge sources | 100 |
| Team members | Unlimited |
| File storage | 10GB |
| Custom branding | ✓ |
| Webhooks | ✓ |
| API access | ✓ |
| Custom domains | ✓ |
| Priority support | ✓ |
| White-label | ✓ |

---

## Monitoring & Analytics

### Platform Metrics

Tracked in `usage_metrics` table:

- Conversations count
- Messages count
- API calls count
- Tokens used

### Agent Analytics

Available in Analytics dashboard:

- **Conversations**: Volume, duration, resolution
- **Messages**: Total, per conversation average
- **Leads**: Capture rate, conversion rate
- **Response Time**: AI response latency
- **User Satisfaction**: Based on conversation outcomes

### Scheduled Reports

Automated reports via `scheduled_reports`:

- Daily/weekly/monthly summaries
- Custom metrics selection
- Email delivery to multiple recipients
- PDF export capability

### Security Monitoring

Logged to `security_logs`:

- Authentication events
- API key usage
- Team member changes
- Resource modifications

---

## Integration Points

### Webhooks

Subscribe to events:

| Event | Payload |
|-------|---------|
| `conversation.created` | Conversation data |
| `conversation.closed` | Conversation + summary |
| `message.received` | Message data |
| `lead.created` | Lead data |
| `takeover.started` | Takeover data |
| `takeover.ended` | Takeover data |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/widget-chat` | POST | Send/receive messages |
| `/get-widget-config` | POST | Fetch agent config |
| `/create-widget-lead` | POST | Create lead |
| `/validate-api-key` | POST | Validate API key |

### External Services

| Service | Purpose |
|---------|---------|
| **Lovable AI Gateway** | AI model access |
| **OpenAI** | Embeddings generation |
| **Resend** | Email delivery |
| **Stripe** | Billing and subscriptions |

---

## Scaling Considerations

### Database

- Connection pooling via Supabase
- Vector indexes for knowledge search
- Partitioning for large tables (planned)

### Edge Functions

- Cold start optimization
- Response caching where appropriate
- Parallel database queries

### Widget

- Separate build (~50KB gzipped)
- Lazy-loaded components
- CSS-only animations
- Preload on hover

### Real-time

- Channel-based subscriptions
- Presence for typing indicators
- Automatic reconnection

---

## Multi-Account Integration Architecture

ChatPad supports multi-account integrations, enabling users to connect multiple accounts per integration type (e.g., multiple Facebook pages, Gmail accounts, Google Calendars) per agent.

### Use Case Example

A Mobile Home Park Operator with 20 communities can:
- Connect 20 Facebook pages (one per community)
- Connect 20 email accounts
- Connect 20 calendar accounts
- AI agent routes messages/bookings to the correct account based on context

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Connected Accounts                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Social        │   Email         │   Calendar                   │
│   - Facebook    │   - Gmail       │   - Google Calendar          │
│   - Instagram   │   - Outlook     │   - Outlook Calendar         │
│   - X (Twitter) │   - SMTP        │   - Calendly                 │
└────────┬────────┴────────┬────────┴──────────┬──────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Routing Intelligence                           │
│   • Location-based routing                                       │
│   • Context-aware routing                                        │
│   • Pre-chat location selection                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Planned Database Tables

```sql
-- Locations for multi-site businesses
CREATE TABLE locations (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  metadata jsonb DEFAULT '{}'
);

-- Connected integration accounts
CREATE TABLE connected_accounts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid,
  location_id uuid,
  integration_type text NOT NULL, -- 'facebook', 'gmail', etc.
  account_identifier text NOT NULL,
  credentials jsonb, -- Encrypted OAuth tokens
  metadata jsonb DEFAULT '{}'
);
```

For detailed implementation plans, see [Multi-Account Integrations](./MULTI_ACCOUNT_INTEGRATIONS.md).

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Complete table reference
- [Edge Functions](./EDGE_FUNCTIONS.md) - API documentation
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget details
- [Security](./SECURITY.md) - Security implementation
- [Application Overview](./APPLICATION_OVERVIEW.md) - Development guide
- [Multi-Account Integrations](./MULTI_ACCOUNT_INTEGRATIONS.md) - Integration architecture
