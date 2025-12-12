# ChatPad System Architecture

> **Last Updated**: December 2024  
> **Status**: Active  
> **Related**: [AI Architecture](./AI_ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md), [Security](./SECURITY.md)

Detailed system architecture documentation for the ChatPad platform.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Access Control Model](#access-control-model)
3. [AI Integration](#ai-integration)
4. [Deployment Methods](#deployment-methods)
5. [Data Flow](#data-flow)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Integration Points](#integration-points)
8. [Scaling Considerations](#scaling-considerations)

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
4. **Embed**: Qwen3 generates vector embeddings (via OpenRouter)
5. **Store**: Vectors stored in `knowledge_chunks`

### Vector Search

```sql
CREATE FUNCTION search_knowledge_chunks(
  p_agent_id uuid,
  p_query_embedding vector(1024),
  p_match_threshold float DEFAULT 0.4,
  p_match_count int DEFAULT 5
)
RETURNS TABLE(...)
```

### Model Selection

Available models via OpenRouter:

| Model | Use Case | Cost |
|-------|----------|------|
| `google/gemini-2.5-flash` | Fast, economical (default) | $ |
| `google/gemini-2.5-flash-lite` | Simple queries | $ |
| `google/gemini-2.5-pro` | Complex reasoning | $$ |
| `openai/gpt-4o` | High quality | $$$ |
| `anthropic/claude-sonnet-4` | Nuanced responses | $$$ |

See [AI Architecture](./AI_ARCHITECTURE.md) for complete details.

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
https://app.chatpad.com/widget/[agent-id]
```

**Use Cases:**
- QR codes
- Email signatures
- Social media links

### 3. API Access

REST API for custom integrations:

```typescript
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
- **User Satisfaction**: Star ratings from conversations

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
| `/send-human-message` | POST | Send human response |
| `/mark-messages-read` | POST | Mark messages as read |

### External Services

| Service | Purpose |
|---------|---------|
| **OpenRouter** | AI model access (unified API) |
| **Resend** | Email delivery |
| **Stripe** | Billing and subscriptions (planned) |

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
- CSS-only animations where possible
- Preload on hover

### Real-time

- Channel-based subscriptions
- Presence for typing indicators
- Automatic reconnection

---

## Related Documentation

- [AI Architecture](./AI_ARCHITECTURE.md) - RAG and model details
- [Database Schema](./DATABASE_SCHEMA.md) - Table reference
- [Edge Functions](./EDGE_FUNCTIONS.md) - API documentation
- [Security](./SECURITY.md) - Security practices
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget details
