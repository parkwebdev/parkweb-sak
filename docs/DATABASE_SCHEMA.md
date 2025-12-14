# ChatPad Database Schema

> **Last Updated**: December 2024  
> **Status**: Active  
> **Related**: [Security](./SECURITY.md), [Supabase Integration](./SUPABASE_INTEGRATION_GUIDE.md), [Edge Functions](./EDGE_FUNCTIONS.md)

Complete database schema documentation for the ChatPad platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Enums](#enums)
3. [Tables](#tables)
4. [Database Functions](#database-functions)
5. [RLS Patterns](#rls-patterns)

---

## Overview

ChatPad uses a **user-based ownership model** with team member access sharing. The primary access pattern uses `user_id` columns to identify resource ownership, with the `team_members` table enabling shared access between team members.

### Key Concepts

- **Owner**: The user who owns the resource (identified by `user_id`)
- **Team Member**: Users who have been granted access to an owner's resources via `team_members`
- **Account Access**: Determined by `has_account_access(user_id)` function - returns true if current user is the owner OR is a team member of the owner

---

## Enums

### `agent_status`
Status of an AI agent.
```sql
'draft' | 'active' | 'paused'
```

### `conversation_status`
Status of a conversation.
```sql
'active' | 'human_takeover' | 'closed'
```

### `lead_status`
Status of a lead in the pipeline.
```sql
'new' | 'contacted' | 'qualified' | 'converted'
```

### `knowledge_type`
Type of knowledge source for RAG.
```sql
'pdf' | 'url' | 'api' | 'json' | 'xml' | 'csv'
```

### `app_role`
Application-level user roles.
```sql
'super_admin' | 'admin' | 'manager' | 'member' | 'client'
```

### `app_permission`
Granular permissions for role-based access control.
```sql
'manage_team' | 'view_team' | 'manage_projects' | 'view_projects' |
'manage_onboarding' | 'view_onboarding' | 'manage_scope_works' |
'view_scope_works' | 'manage_settings' | 'view_settings'
```

### `org_role`
Legacy organization role (deprecated - use `app_role`).
```sql
'owner' | 'admin' | 'member'
```

### `calendar_provider`
Supported calendar integration providers.
```sql
'google_calendar' | 'outlook_calendar'
```

### `calendar_event_status`
Status of calendar events.
```sql
'confirmed' | 'cancelled' | 'completed' | 'no_show'
```

### `property_status`
Status of property listings.
```sql
'available' | 'pending' | 'sold' | 'rented' | 'coming_soon'
```

### `property_price_type`
Pricing type for properties.
```sql
'sale' | 'rent_monthly' | 'rent_weekly'
```

### `knowledge_source_type`
Specific type of knowledge source.
```sql
'url' | 'sitemap' | 'property_listings' | 'property_feed' | 'wordpress_home'
```

### `refresh_strategy`
Auto-refresh interval for knowledge sources.
```sql
'manual' | 'hourly_1' | 'hourly_2' | 'hourly_3' | 'hourly_4' | 'hourly_6' | 'hourly_12' | 'daily'
```

---

## Tables

### AI Agent System

#### `agents`
Core AI agent configuration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Owner's user ID |
| `name` | text | No | - | Agent display name |
| `description` | text | Yes | - | Agent description |
| `system_prompt` | text | No | - | AI system prompt |
| `model` | text | No | `'google/gemini-2.5-flash'` | AI model identifier |
| `temperature` | double precision | Yes | `0.7` | Response creativity (0-2) |
| `max_tokens` | integer | Yes | `2000` | Max response tokens |
| `status` | agent_status | No | `'draft'` | Agent status |
| `deployment_config` | jsonb | Yes | `{...}` | Widget/API deployment settings |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Users can create their own agents (`auth.uid() = user_id`)
- Users can view/update/delete accessible agents (`has_account_access(user_id)`)

---

#### `agent_tools`
Custom tools/functions available to agents.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `name` | text | No | - | Tool name |
| `description` | text | No | - | Tool description |
| `parameters` | jsonb | No | - | Tool parameter schema |
| `endpoint_url` | text | Yes | - | HTTP endpoint URL |
| `headers` | jsonb | Yes | `'{}'` | Custom HTTP headers |
| `timeout_ms` | integer | Yes | `30000` | Request timeout |
| `enabled` | boolean | Yes | `true` | Whether tool is active |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

**RLS Policies:**
- Access controlled via parent agent ownership

---

### Location System

#### `locations`
Business locations for multi-location deployments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `user_id` | uuid | No | - | Owner's user ID |
| `name` | text | No | - | Location name |
| `address` | text | Yes | - | Street address |
| `city` | text | Yes | - | City |
| `state` | text | Yes | - | State/Province |
| `zip` | text | Yes | - | ZIP/Postal code |
| `country` | text | Yes | - | Country |
| `phone` | text | Yes | - | Phone number |
| `email` | text | Yes | - | Email address |
| `timezone` | text | Yes | `'America/New_York'` | IANA timezone |
| `business_hours` | jsonb | Yes | `'{}'` | Business hours config |
| `url_patterns` | text[] | Yes | `'{}'` | URL matching patterns |
| `wordpress_community_id` | integer | Yes | - | WordPress community ID |
| `wordpress_slug` | text | Yes | - | WordPress URL slug |
| `is_active` | boolean | Yes | `true` | Active status |
| `metadata` | jsonb | Yes | `'{}'` | Additional metadata |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**Business Hours Structure:**
```typescript
{
  monday: { open: "09:00", close: "17:00", closed: false },
  tuesday: { open: "09:00", close: "17:00", closed: false },
  // ... other days
}
```

**RLS Policies:**
- Users can create for accessible agents
- Users can view/update/delete accessible locations

---

### Calendar System

#### `connected_accounts`
OAuth connected calendar accounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `user_id` | uuid | No | - | Owner's user ID |
| `location_id` | uuid | Yes | - | FK to locations |
| `provider` | calendar_provider | No | - | `'google_calendar'` \| `'outlook_calendar'` |
| `account_email` | text | No | - | Connected account email |
| `access_token` | text | No | - | OAuth access token |
| `refresh_token` | text | Yes | - | OAuth refresh token |
| `token_expires_at` | timestamptz | Yes | - | Token expiration |
| `calendar_id` | text | Yes | - | Selected calendar ID |
| `calendar_name` | text | Yes | - | Calendar display name |
| `is_active` | boolean | Yes | `true` | Connection active |
| `last_synced_at` | timestamptz | Yes | - | Last sync timestamp |
| `sync_error` | text | Yes | - | Last sync error |
| `metadata` | jsonb | Yes | `'{}'` | Additional data |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Users can manage accounts for accessible agents

---

#### `calendar_events`
Scheduled events and appointments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `connected_account_id` | uuid | No | - | FK to connected_accounts |
| `location_id` | uuid | Yes | - | FK to locations |
| `conversation_id` | uuid | Yes | - | FK to conversations |
| `lead_id` | uuid | Yes | - | FK to leads |
| `external_event_id` | text | Yes | - | External calendar event ID |
| `title` | text | No | - | Event title |
| `description` | text | Yes | - | Event description |
| `start_time` | timestamptz | No | - | Start time |
| `end_time` | timestamptz | No | - | End time |
| `all_day` | boolean | Yes | `false` | All-day event |
| `timezone` | text | Yes | - | Event timezone |
| `event_type` | text | Yes | - | e.g., 'showing', 'tour' |
| `status` | calendar_event_status | Yes | `'confirmed'` | Event status |
| `visitor_name` | text | Yes | - | Visitor name |
| `visitor_email` | text | Yes | - | Visitor email |
| `visitor_phone` | text | Yes | - | Visitor phone |
| `notes` | text | Yes | - | Internal notes |
| `metadata` | jsonb | Yes | `'{}'` | Additional data |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Users can manage events for accessible accounts

---

### Property System

#### `properties`
Property listings from knowledge sources.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `knowledge_source_id` | uuid | No | - | FK to knowledge_sources |
| `location_id` | uuid | Yes | - | FK to locations |
| `external_id` | text | Yes | - | External listing ID |
| `lot_number` | text | Yes | - | Lot/unit number |
| `address` | text | Yes | - | Street address |
| `city` | text | Yes | - | City |
| `state` | text | Yes | - | State |
| `zip` | text | Yes | - | ZIP code |
| `price` | numeric | Yes | - | Listing price |
| `price_type` | property_price_type | Yes | - | `'sale'` \| `'rent_monthly'` \| `'rent_weekly'` |
| `beds` | integer | Yes | - | Bedrooms |
| `baths` | numeric | Yes | - | Bathrooms |
| `sqft` | integer | Yes | - | Square footage |
| `year_built` | integer | Yes | - | Year built |
| `description` | text | Yes | - | Listing description |
| `features` | text[] | Yes | `'{}'` | Feature list |
| `images` | jsonb | Yes | `'[]'` | Image URLs |
| `listing_url` | text | Yes | - | External listing URL |
| `status` | property_status | Yes | `'available'` | Listing status |
| `first_seen_at` | timestamptz | No | `now()` | First import date |
| `last_seen_at` | timestamptz | No | `now()` | Last import date |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Users can view properties for accessible agents

---

#### `knowledge_sources`
RAG knowledge base sources for agents.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `user_id` | uuid | No | - | Owner's user ID |
| `type` | knowledge_type | No | - | Source type |
| `source` | text | No | - | Source URL/path |
| `content` | text | Yes | - | Extracted content |
| `embedding` | vector(1024) | Yes | - | Vector embedding (Qwen3) |
| `metadata` | jsonb | Yes | `'{}'` | Additional metadata |
| `status` | text | No | `'processing'` | Processing status |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Users can create for accessible agents
- Users can view/update/delete accessible sources (`has_account_access(user_id)`)

---

#### `knowledge_chunks`
Chunked knowledge content with embeddings for RAG vector search.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `source_id` | uuid | No | - | FK to knowledge_sources |
| `agent_id` | uuid | No | - | FK to agents |
| `content` | text | No | - | Chunk text content |
| `chunk_index` | integer | No | - | Order within source |
| `token_count` | integer | Yes | - | Token count estimate |
| `embedding` | vector(1024) | Yes | - | Qwen3 vector embedding |
| `metadata` | jsonb | Yes | `'{}'` | Additional metadata |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

**RLS Policies:**
- Service role can insert chunks (via edge function)
- Access controlled via parent knowledge_source ownership

---

### Caching System

#### `response_cache`
Cached AI responses for cost optimization.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `query_hash` | text | No | - | SHA-256 of normalized query |
| `response_content` | text | No | - | Cached response text |
| `similarity_score` | double precision | No | - | Original similarity score |
| `hit_count` | integer | Yes | `1` | Number of cache hits |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `last_used_at` | timestamptz | Yes | `now()` | Last access timestamp |
| `expires_at` | timestamptz | Yes | `now() + '30 days'` | Expiration date |

**Cache Settings:**
- Storage threshold: 0.60 similarity
- Hit threshold: 0.70 similarity
- TTL: 30 days

**RLS Policies:**
- Service role can manage response cache

---

#### `query_embedding_cache`
Cached query embeddings to avoid re-embedding identical queries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | Yes | - | FK to agents |
| `query_normalized` | text | No | - | Normalized query text |
| `query_hash` | text | No | - | SHA-256 of normalized query |
| `embedding` | vector(1024) | Yes | - | Qwen3 vector embedding |
| `hit_count` | integer | Yes | `1` | Number of cache hits |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `last_used_at` | timestamptz | Yes | `now()` | Last access timestamp |
| `expires_at` | timestamptz | Yes | `now() + '7 days'` | Expiration date |

**RLS Policies:**
- Service role can manage query cache

---

### Feedback System

#### `conversation_ratings`
Post-conversation satisfaction ratings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `conversation_id` | uuid | No | - | FK to conversations |
| `rating` | integer | No | - | 1-5 star rating |
| `feedback` | text | Yes | - | Optional text feedback |
| `trigger_type` | text | No | - | `'team_closed'` \| `'ai_marked_complete'` |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

**Trigger Types:**
- `team_closed`: Team member closed conversation
- `ai_marked_complete`: AI detected completion via tool

**RLS Policies:**
- Anyone can submit ratings for active conversations
- Users can view ratings for accessible conversations

---

### Conversation System

#### `conversations`
Chat conversations with widget users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `user_id` | uuid | No | - | Agent owner's user ID |
| `status` | conversation_status | No | `'active'` | Conversation status |
| `metadata` | jsonb | Yes | `'{}'` | Session/contact data |
| `expires_at` | timestamptz | No | `now() + '6 months'` | Expiration date |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**Metadata Structure:**
```typescript
{
  lead_id?: string;           // Linked lead
  session_id?: string;        // Widget session
  ip_address?: string;        // Visitor IP
  country?: string;           // Geolocation
  city?: string;
  device_type?: string;       // desktop/mobile/tablet
  browser?: string;
  os?: string;
  referrer?: string;          // Referring URL
  tags?: string[];            // Team-assigned tags
  priority?: string;          // Priority level
  assigned_to?: string;       // Assigned team member
  internal_notes?: string;    // Team notes
}
```

**RLS Policies:**
- Public can create conversations (widget)
- Public can view conversation status (for realtime)
- Users can view/update/delete accessible conversations

---

#### `messages`
Individual messages within conversations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `conversation_id` | uuid | No | - | FK to conversations |
| `role` | text | No | - | `'user'` \| `'assistant'` |
| `content` | text | No | - | Message content |
| `metadata` | jsonb | Yes | `'{}'` | Reactions, sender info |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

**Metadata Structure:**
```typescript
{
  sender_type?: 'ai' | 'human';     // For assistant messages
  sender_name?: string;              // Human agent name
  sender_avatar?: string;            // Human agent avatar
  reactions?: Array<{emoji: string, user: string}>;
  attachments?: Array<{type: string, url: string}>;
}
```

**RLS Policies:**
- Public can create messages (widget)
- Public can view messages for active/human_takeover conversations
- Users can view messages in accessible conversations

---

#### `conversation_takeovers`
Records of human takeover events.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `conversation_id` | uuid | No | - | FK to conversations |
| `taken_over_by` | uuid | No | - | Team member user ID |
| `taken_over_at` | timestamptz | No | `now()` | Takeover timestamp |
| `returned_to_ai_at` | timestamptz | Yes | - | Return timestamp |
| `reason` | text | Yes | - | Takeover reason |

**RLS Policies:**
- Users can create takeovers for accessible conversations
- Takeover owner can update their takeover
- Users can view takeovers for accessible conversations

---

### Lead Management

#### `leads`
Captured leads from widget contact forms.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Agent owner's user ID |
| `conversation_id` | uuid | Yes | - | FK to conversations |
| `name` | text | Yes | - | Lead name |
| `email` | text | Yes | - | Lead email |
| `phone` | text | Yes | - | Lead phone |
| `company` | text | Yes | - | Lead company |
| `status` | lead_status | No | `'new'` | Pipeline status |
| `data` | jsonb | Yes | `'{}'` | Custom field data |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Public can create leads via widget
- Users can view/update/delete accessible leads

---

### Help Center System

#### `help_categories`
Help article categories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `user_id` | uuid | No | - | Owner's user ID |
| `name` | text | No | - | Category name |
| `description` | text | Yes | - | Category description |
| `icon` | text | Yes | `'book'` | UntitledUI icon name |
| `order_index` | integer | Yes | `0` | Display order |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

**Available Icons:**
`BookOpen01`, `HelpCircle`, `User01`, `CreditCard01`, `FileText01`, `Settings01`, `Bell01`, `Lock01`, `Target01`, `Zap01`, `Briefcase01`, `BarChart01`, `MessageCircle01`, `CheckCircle01`, `AlertCircle01`, `Calendar`, `Globe01`, `DownloadCloud01`, `Link01`, `PlayCircle`, `Gift01`, `Truck01`, `Clock`, `MessageChatCircle`, `Building07`

---

#### `help_articles`
Help center articles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `category_id` | uuid | No | - | FK to help_categories |
| `user_id` | uuid | No | - | Owner's user ID |
| `title` | text | No | - | Article title |
| `content` | text | No | - | Rich text HTML content |
| `featured_image` | text | Yes | - | Hero image URL |
| `icon` | text | Yes | - | (Deprecated) |
| `order_index` | integer | Yes | `0` | Display order |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

---

#### `article_feedback`
User feedback on help articles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `article_id` | uuid | No | - | FK to help_articles |
| `session_id` | text | No | - | Widget session ID |
| `is_helpful` | boolean | No | - | Helpful vote |
| `comment` | text | Yes | - | Feedback comment |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

**RLS Policies:**
- Anyone can submit feedback (rate-limited server-side)

---

### Widget Content

#### `announcements`
Widget announcement banners.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `user_id` | uuid | No | - | Owner's user ID |
| `title` | text | No | - | Announcement title |
| `subtitle` | text | Yes | - | Announcement subtitle |
| `image_url` | text | Yes | - | Banner image |
| `action_type` | text | Yes | `'open_url'` | Action type |
| `action_url` | text | Yes | - | Action URL |
| `title_color` | text | Yes | `'#2563eb'` | Title color |
| `background_color` | text | Yes | `'#f8fafc'` | Background color |
| `is_active` | boolean | Yes | `true` | Active status |
| `order_index` | integer | Yes | `0` | Display order |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

---

#### `news_items`
Widget news/updates feed.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `user_id` | uuid | No | - | Owner's user ID |
| `title` | text | No | - | News title |
| `body` | text | No | - | News body |
| `featured_image_url` | text | Yes | - | Featured image |
| `author_name` | text | Yes | - | Author name |
| `is_published` | boolean | Yes | `false` | Published status |
| `published_at` | timestamptz | Yes | - | Publish date |
| `order_index` | integer | Yes | `0` | Display order |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

---

### Integration System

#### `webhooks`
Webhook configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Owner's user ID |
| `agent_id` | uuid | Yes | - | Optional FK to agents |
| `name` | text | No | - | Webhook name |
| `url` | text | No | - | Endpoint URL |
| `method` | text | No | `'POST'` | HTTP method |
| `events` | text[] | Yes | `'{}'` | Subscribed events |
| `headers` | jsonb | Yes | `'{}'` | Custom headers |
| `auth_type` | text | No | `'none'` | Auth type |
| `auth_config` | jsonb | Yes | `'{}'` | Auth configuration |
| `conditions` | jsonb | Yes | `'{}'` | Trigger conditions |
| `response_actions` | jsonb | Yes | `'{}'` | Response handling |
| `active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

---

#### `webhook_logs`
Webhook delivery logs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `webhook_id` | uuid | No | - | FK to webhooks |
| `event_type` | text | No | - | Event type |
| `payload` | jsonb | No | - | Request payload |
| `response_status` | integer | Yes | - | HTTP status |
| `response_body` | text | Yes | - | Response body |
| `error_message` | text | Yes | - | Error message |
| `retry_count` | integer | Yes | `0` | Retry attempts |
| `delivered` | boolean | Yes | `false` | Delivery status |
| `delivered_at` | timestamptz | Yes | - | Delivery timestamp |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

---

#### `agent_api_keys`
Agent-level API key management with rate limiting.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents |
| `name` | text | No | `'Default'` | Key name |
| `key_hash` | text | No | - | SHA-256 hashed key |
| `key_prefix` | text | No | - | Key prefix for identification |
| `requests_per_minute` | integer | No | `60` | Rate limit per minute |
| `requests_per_day` | integer | No | `10000` | Rate limit per day |
| `current_minute_requests` | integer | No | `0` | Current minute request count |
| `current_day_requests` | integer | No | `0` | Current day request count |
| `minute_window_start` | timestamptz | Yes | - | Minute window start time |
| `day_window_start` | timestamptz | Yes | - | Day window start time |
| `last_used_at` | timestamptz | Yes | - | Last usage timestamp |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `revoked_at` | timestamptz | Yes | - | Revocation timestamp |

**RLS Policies:**
- Users can create/view/update/delete API keys for agents they have access to

**Validation:**
- Keys are validated via `validate_api_key(p_key_hash, p_agent_id)` database function
- Rate limiting is enforced at validation time with sliding windows

---

### User Management

#### `profiles`
User profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | FK to auth.users |
| `display_name` | text | Yes | - | Display name |
| `email` | text | Yes | - | Email address |
| `avatar_url` | text | Yes | - | Avatar image URL |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Users can view/update their own profile
- Admins can view all profiles
- Super admins can update any profile

---

#### `user_roles`
User role assignments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | FK to auth.users |
| `role` | app_role | No | `'member'` | Assigned role |
| `permissions` | app_permission[] | Yes | `'{}'` | Additional permissions |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

**RLS Policies:**
- Users can view their own roles
- Users can insert their own role on signup
- Only admins can update user roles

---

#### `user_preferences`
User UI preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | FK to auth.users |
| `default_project_view` | text | Yes | `'dashboard'` | Default view |
| `auto_save` | boolean | Yes | `true` | Auto-save enabled |
| `compact_mode` | boolean | Yes | `false` | Compact UI mode |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

---

#### `notification_preferences`
User notification settings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | FK to auth.users |
| `email_notifications` | boolean | Yes | `true` | Email enabled |
| `browser_notifications` | boolean | Yes | `true` | Browser enabled |
| `conversation_notifications` | boolean | Yes | `true` | Conversation alerts |
| `lead_notifications` | boolean | Yes | `true` | Lead alerts |
| `agent_notifications` | boolean | Yes | `true` | Agent alerts |
| `team_notifications` | boolean | Yes | `true` | Team alerts |
| `report_notifications` | boolean | Yes | `true` | Report alerts |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

---

### Team System

#### `team_members`
Team membership relationships.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `owner_id` | uuid | No | - | Account owner's user ID |
| `member_id` | uuid | No | - | Team member's user ID |
| `role` | text | No | `'member'` | Team role |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

**RLS Policies:**
- Owners can manage their team
- Members can view their membership

---

#### `pending_invitations`
Pending team invitations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `email` | text | No | - | Invitee email |
| `invited_by` | uuid | No | - | Inviter's user ID |
| `invited_by_name` | text | No | - | Inviter's name |
| `company_name` | text | Yes | - | Company name |
| `status` | text | No | `'pending'` | Invitation status |
| `expires_at` | timestamptz | Yes | `now() + '7 days'` | Expiration |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

---

### Billing System

#### `plans`
Subscription plan definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | - | Plan name |
| `price_monthly` | integer | No | - | Monthly price (cents) |
| `price_yearly` | integer | No | - | Yearly price (cents) |
| `features` | jsonb | Yes | `'{}'` | Feature flags |
| `limits` | jsonb | Yes | `'{}'` | Usage limits |
| `active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Anyone can view active plans
- Super admins can manage plans

---

#### `subscriptions`
User subscriptions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Subscriber's user ID |
| `plan_id` | uuid | No | - | FK to plans |
| `status` | text | No | `'active'` | Subscription status |
| `stripe_subscription_id` | text | Yes | - | Stripe subscription ID |
| `stripe_customer_id` | text | Yes | - | Stripe customer ID |
| `current_period_start` | timestamptz | Yes | - | Period start |
| `current_period_end` | timestamptz | Yes | - | Period end |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies:**
- Super admins can view all subscriptions

---

#### `usage_metrics`
Usage tracking for billing.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | User's ID |
| `period_start` | timestamptz | No | - | Period start |
| `period_end` | timestamptz | No | - | Period end |
| `conversations_count` | integer | Yes | `0` | Conversations |
| `messages_count` | integer | Yes | `0` | Messages |
| `api_calls_count` | integer | Yes | `0` | API calls |
| `tokens_used` | integer | Yes | `0` | AI tokens |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

---

### System Tables

#### `notifications`
In-app notifications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Recipient's user ID |
| `type` | text | No | - | Notification type |
| `title` | text | No | - | Notification title |
| `message` | text | No | - | Notification message |
| `data` | jsonb | Yes | - | Additional data |
| `read` | boolean | No | `false` | Read status |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

---

#### `scheduled_reports`
Automated report scheduling.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Owner's user ID |
| `created_by` | uuid | No | - | Creator's user ID |
| `name` | text | No | - | Report name |
| `frequency` | text | No | - | `'daily'` \| `'weekly'` \| `'monthly'` |
| `recipients` | jsonb | No | `'[]'` | Email recipients |
| `day_of_week` | integer | Yes | - | For weekly (0-6) |
| `day_of_month` | integer | Yes | - | For monthly (1-31) |
| `time_of_day` | time | No | `'09:00:00'` | Send time |
| `report_config` | jsonb | No | `'{}'` | Report configuration |
| `active` | boolean | No | `true` | Active status |
| `last_sent_at` | timestamptz | Yes | - | Last sent timestamp |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

---

#### `custom_domains`
Custom domain configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Owner's user ID |
| `domain` | text | No | - | Domain name |
| `verification_token` | text | No | - | DNS verification token |
| `verified` | boolean | Yes | `false` | Verification status |
| `verified_at` | timestamptz | Yes | - | Verification timestamp |
| `dns_configured` | boolean | Yes | `false` | DNS configured |
| `ssl_status` | text | Yes | `'pending'` | SSL status |
| `is_primary` | boolean | Yes | `false` | Primary domain |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

---

#### `security_logs`
Security audit trail.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | Yes | - | Actor's user ID |
| `action` | text | No | - | Action performed |
| `resource_type` | text | No | - | Resource type |
| `resource_id` | text | Yes | - | Resource ID |
| `success` | boolean | Yes | `true` | Success status |
| `details` | jsonb | Yes | `'{}'` | Action details |
| `ip_address` | text | Yes | - | Client IP |
| `user_agent` | text | Yes | - | User agent |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

**RLS Policies:**
- Users can view their own logs
- Admins can view all logs

---

#### `email_templates`
System email templates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | - | Template name |
| `subject` | text | No | - | Email subject |
| `html_content` | text | No | - | HTML content |
| `text_content` | text | No | - | Plain text content |
| `active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last update timestamp |

**RLS Policies:**
- Anyone can read active templates
- Super admins can manage templates

---

## Database Functions

### Access Control Functions

#### `has_account_access(account_owner_id uuid)`
**Returns:** `boolean`

Checks if the current user has access to resources owned by `account_owner_id`. Returns `true` if the current user IS the owner OR is a team member of the owner.

```sql
SELECT auth.uid() = account_owner_id 
   OR EXISTS (
     SELECT 1 FROM team_members 
     WHERE owner_id = account_owner_id 
       AND member_id = auth.uid()
   )
```

---

#### `get_account_owner_id()`
**Returns:** `uuid`

Returns the account owner ID for the current user. If the user has their own subscription, returns their ID. Otherwise, returns the owner_id from team_members.

---

#### `is_account_admin(account_owner_id uuid)`
**Returns:** `boolean`

Checks if the current user is an admin for the specified account (owner OR team member with admin role).

---

#### `is_admin(target_user_id uuid)`
**Returns:** `boolean`

Checks if the specified user has `admin` or `super_admin` role.

---

#### `is_super_admin(user_id uuid)`
**Returns:** `boolean`

Checks if the specified user has `super_admin` role.

---

#### `has_permission(target_user_id uuid, permission_name app_permission)`
**Returns:** `boolean`

Checks if the specified user has a specific permission (either via admin role or explicit permission grant).

---

#### `get_current_user_role()`
**Returns:** `app_role`

Returns the role of the currently authenticated user.

---

#### `get_user_role(target_user_id uuid)`
**Returns:** `app_role`

Returns the role of the specified user.

---

### RAG Functions

#### `search_knowledge_sources(p_agent_id uuid, p_query_embedding vector, p_match_threshold float, p_match_count int)`
**Returns:** `TABLE(id uuid, source text, content text, type text, similarity float)`

Performs vector similarity search on knowledge sources for RAG retrieval.

---

### Utility Functions

#### `log_security_event(p_user_id uuid, p_action text, p_resource_type text, p_resource_id text, p_success boolean, p_details jsonb)`
**Returns:** `void`

Logs a security event to the security_logs table.

---

#### `update_updated_at()`
**Returns:** `trigger`

Trigger function to automatically update `updated_at` column on row updates.

---

#### `ensure_single_primary_domain()`
**Returns:** `trigger`

Trigger function to ensure only one primary domain per user.

---

#### `handle_new_user_profile()`
**Returns:** `trigger`

Trigger on `auth.users` table INSERT. Creates a profile record for new users with display name extracted from metadata or email.

---

#### `handle_new_user_notification_preferences()`
**Returns:** `trigger`

Trigger on `auth.users` table INSERT. Creates default notification preferences for new users.

---

#### `handle_new_user_role()`
**Returns:** `trigger`

Trigger on `auth.users` table INSERT. Assigns the default `member` role to new users.

---

#### `cleanup_expired_caches()`
**Returns:** `void`

Deletes expired entries from `response_cache` and `query_embedding_cache` tables. Called via scheduled cron job.

---

## RLS Patterns

### Pattern 1: Owner-Only Access
```sql
CREATE POLICY "Users can manage their own resources"
ON public.table_name
FOR ALL
USING (auth.uid() = user_id);
```

### Pattern 2: Team Access via has_account_access()
```sql
-- View accessible resources
CREATE POLICY "Users can view accessible resources"
ON public.table_name
FOR SELECT
USING (has_account_access(user_id));

-- Create owned resources
CREATE POLICY "Users can create their own resources"
ON public.table_name
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update/Delete accessible resources
CREATE POLICY "Users can modify accessible resources"
ON public.table_name
FOR UPDATE
USING (has_account_access(user_id));
```

### Pattern 3: Public Widget Access
```sql
-- Public can create (widget submissions)
CREATE POLICY "Public can create"
ON public.table_name
FOR INSERT
WITH CHECK (true);

-- Public can view active records
CREATE POLICY "Public can view"
ON public.table_name
FOR SELECT
USING (status = 'active');
```

### Pattern 4: Admin-Only Access
```sql
CREATE POLICY "Only admins can access"
ON public.table_name
FOR ALL
USING (is_admin(auth.uid()));
```

---

## Storage Buckets

### `avatars`
- **Public:** Yes
- **Purpose:** User profile avatars
- **Optimization:** 256x256px, WebP, 65% quality

### `article-images`
- **Public:** Yes
- **Purpose:** Help article images, news featured images, announcement banners
- **Optimization:** 
  - Inline images: 800x600px max
  - Featured images: 1200x600px max
  - WebP format, 60% quality

### `conversation-files`
- **Public:** Yes
- **Purpose:** File attachments in chat conversations
- **Details:**
  - Uploaded via widget message input
  - Supports images, documents, audio recordings
  - Voice messages stored as WebM/MP4 audio

## React Hooks Reference

All hooks are documented with JSDoc comments. Key data hooks:

| Hook | Purpose |
|------|---------|
| `useAgents` | AI agent CRUD operations |
| `useConversations` | Conversation management, human takeover |
| `useLeads` | Lead management with conversation linkage |
| `useTeam` | Team member and role management |
| `useWebhooks` | Webhook CRUD and delivery logs |
| `useNotifications` | In-app notification creation |
| `useHelpArticles` | Help center article/category management |
| `useKnowledgeSources` | RAG knowledge source processing |
| `useAnnouncements` | Widget announcement banners |
| `useNewsItems` | Widget news feed items |
| `useAnalytics` | Analytics data fetching with filters |
| `useScheduledReports` | Scheduled report management |
| `useAgentApiKeys` | Agent API key management with rate limiting |
| `usePlanLimits` | Subscription plan limit checking |
| `useRoleAuthorization` | Role-based permission checking |
| `useAuth` | Authentication with input validation |
| `useLocations` | Location CRUD operations |
| `useCalendarEvents` | Calendar event management |
| `useConnectedAccounts` | OAuth calendar connections |
| `useWordPressConnection` | WordPress API integration |
| `useWordPressHomes` | WordPress home listings sync |
| `useProperties` | Property listing data |
| `useEmbeddedChatConfig` | Widget embed configuration |

See individual hook files in `src/hooks/` for detailed JSDoc documentation.

---

## TypeScript Type Definitions

All shared types are exported from `src/types/`:

| Module | Types | Purpose |
|--------|-------|---------|
| `metadata.ts` | `ConversationMetadata`, `MessageMetadata`, `KnowledgeSourceMetadata`, `AgentDeploymentConfig`, `LeadData`, `PlanLimits` | JSONB field type safety |
| `team.ts` | `TeamMember`, `UserRole`, `AppPermission` | Team management types |
| `webhooks.ts` | `WebhookConfig`, `WebhookConditions`, `ResponseAction`, `MessageReaction` | Webhook configuration types |
| `report.ts` | `ReportData`, `ConversationStat`, `LeadStat`, `AgentPerformance`, `UsageMetric`, `VisitorPresenceState`, `TeamProfile`, `ScheduledReport` | Analytics and reporting types |
| `errors.ts` | `getErrorMessage()`, `hasErrorMessage()`, `hasErrorCode()` | Error handling utilities |

Import types via the barrel export:
```typescript
import { ConversationMetadata, ReportData, getErrorMessage } from '@/types';
```

---

## Related Documentation

- [Security](./SECURITY.md) - RLS policies and authentication patterns
- [Edge Functions](./EDGE_FUNCTIONS.md) - Server-side database operations
- [Supabase Integration](./SUPABASE_INTEGRATION_GUIDE.md) - React Query hooks and patterns
- [AI Architecture](./AI_ARCHITECTURE.md) - Vector embeddings and RAG tables
