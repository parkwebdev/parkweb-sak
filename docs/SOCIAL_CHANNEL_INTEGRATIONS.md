# Social Channel Integrations Architecture

> **Last Updated**: December 2025  
> **Status**: Planned  
> **Related**: [Architecture](./ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md), [Native Booking System](./NATIVE_BOOKING_SYSTEM.md)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Supported Channels](#supported-channels)
4. [Core Architecture](#core-architecture)
5. [Multi-Account Support](#multi-account-support)
6. [Message Routing](#message-routing)
7. [Admin UI Design](#admin-ui-design)
8. [Implementation Phases](#implementation-phases)

---

## Executive Summary

This document outlines the architecture for integrating social messaging channels (Facebook Messenger, Instagram DM, Email) with ChatPad agents. The key innovation is **multi-account support per agent**, enabling businesses with multiple locations to connect all their social accounts to a single AI agent with intelligent routing.

---

## Problem Statement

### Current Limitation
ChatPad currently supports only web widget conversations. Businesses also receive customer inquiries via:
- Facebook Messenger (often multiple pages per business)
- Instagram DMs (multiple accounts)
- Email (multiple inboxes)

### Real-World Requirements
Multi-location businesses need:
- **20+ Facebook Pages** (one per location)
- **20+ Instagram Accounts** (one per location)
- **20+ Email Inboxes** (one per location)
- **Unified Inbox** for all messages across channels
- **Intelligent Routing** to respond from the correct account

### Example Scenario
```
Client: Mobile Home Park Operator
Communities: 20 locations across 5 states
Need: AI agent that can:
  - Receive Facebook messages from any of 20 pages
  - Respond from the correct community's Facebook page
  - Handle Instagram DMs from 20 community accounts
  - Route emails to/from correct community inbox
  - Maintain conversation context across channels
```

---

## Supported Channels

| Channel | Status | OAuth Provider | Features |
|---------|--------|----------------|----------|
| Web Widget | ✅ Live | N/A | Real-time chat, takeover, ratings |
| Facebook Messenger | 🔜 Planned | Meta Business | Page messages, quick replies |
| Instagram DM | 🔜 Planned | Meta Business | Direct messages, media support |
| Email | 🔜 Planned | Google/Microsoft | IMAP/SMTP, threading |
| SMS/WhatsApp | 📋 Future | Twilio/Meta | Two-way messaging |

---

## Core Architecture

### Channel Abstraction Layer

All channels normalize to a common message format:

```typescript
interface UnifiedMessage {
  id: string;
  conversation_id: string;
  channel: 'widget' | 'facebook' | 'instagram' | 'email' | 'sms';
  channel_account_id: string;  // Which FB page, email inbox, etc.
  direction: 'inbound' | 'outbound';
  content: string;
  media?: MessageMedia[];
  metadata: {
    external_id?: string;      // Platform-specific message ID
    thread_id?: string;        // Email thread, FB conversation
    sender_id?: string;        // Platform user ID
    sender_name?: string;
  };
  created_at: string;
}
```

### Database Schema

```sql
-- Social channel accounts (Facebook pages, Instagram accounts, email inboxes)
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,  -- 'facebook', 'instagram', 'email'
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,  -- Platform-specific ID (page ID, email address)
  access_token TEXT,  -- Encrypted
  refresh_token TEXT,  -- Encrypted
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup by channel
CREATE INDEX idx_social_accounts_channel ON social_accounts(agent_id, channel);
CREATE INDEX idx_social_accounts_location ON social_accounts(location_id);
```

---

## Multi-Account Support

### Location-Based Organization

Social accounts are optionally linked to locations for intelligent routing:

```
Agent: MHP Communities
├── Location: Forge at the Lake
│   ├── Facebook Page: "Forge Lake Community"
│   ├── Instagram: @forgelakemhp
│   └── Email: forge@mhpcommunities.com
├── Location: Clearview Estates
│   ├── Facebook Page: "Clearview MHP"
│   ├── Instagram: @clearviewmhp
│   └── Email: clearview@mhpcommunities.com
└── General (No Location)
    └── Email: info@mhpcommunities.com
```

### Connection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Connect Facebook Pages                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Click "Connect Facebook"                                         │
│     └── Redirect to Meta OAuth                                       │
│                                                                      │
│  2. User authorizes ChatPad for business pages                       │
│     └── Grant pages_messaging, pages_read_engagement                 │
│                                                                      │
│  3. Select pages to connect                                          │
│     ☑ Forge Lake Community                                           │
│     ☑ Clearview MHP                                                  │
│     ☐ Personal Page (skip)                                           │
│                                                                      │
│  4. Assign to locations (optional)                                   │
│     Forge Lake Community → Forge at the Lake                         │
│     Clearview MHP → Clearview Estates                                │
│                                                                      │
│  5. Enable webhook subscription                                      │
│     └── Receive messages in real-time                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Message Routing

### Inbound Message Flow

```
Facebook Message Received
    │
    ▼
Webhook: /api/webhooks/facebook
    │
    ▼
Identify Page (channel_account_id)
    │
    ▼
Lookup social_account → agent_id, location_id
    │
    ▼
Create/Update conversation
    │
    ▼
┌─────────────────────────────────────────┐
│  Is conversation in human_takeover?     │
│  ├── Yes: Notify team, skip AI          │
│  └── No: Process with AI agent          │
└─────────────────────────────────────────┘
    │
    ▼
AI generates response (with location context)
    │
    ▼
Send response via Facebook API
    │
    ▼
Store message in database
```

### Outbound Response Context

When AI responds to a Facebook message, it has access to:
- **Location context** (if account is linked to location)
- **Properties** at that location (from knowledge sources)
- **Business hours** for the location
- **Connected calendar** for booking

---

## Admin UI Design

### Integrations Tab Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Social Channels                                    [+ Add Channel]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Facebook Messenger                                                  │
│  ─────────────────                                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📘 Forge Lake Community              Forge at the Lake    ✓ ● │ │
│  │    Last message: 2 hours ago                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📘 Clearview MHP                     Clearview Estates    ✓ ● │ │
│  │    Last message: 5 hours ago                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  [+ Connect More Pages]                                              │
│                                                                      │
│  Instagram                                                           │
│  ─────────                                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📷 @forgelakemhp                     Forge at the Lake    ✓ ● │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  [+ Connect Instagram]                                               │
│                                                                      │
│  Email                                                               │
│  ─────                                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ✉️ forge@mhpcommunities.com          Forge at the Lake    ✓ ● │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ✉️ info@mhpcommunities.com           General              ✓ ● │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  [+ Connect Email]                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Unified Inbox

The Conversations/Inbox page shows messages from all channels:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Inbox                                          [All Channels ▾]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📘 John Smith                              2 min ago          │ │
│  │    Forge Lake Community                                        │ │
│  │    "Hi, I'm interested in the 3BR home..."                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 💬 Sarah Johnson                           15 min ago         │ │
│  │    Widget • forgelake.com                                      │ │
│  │    "What are your office hours?"                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ✉️ mike@example.com                        1 hour ago         │ │
│  │    info@mhpcommunities.com                                     │ │
│  │    "Re: Availability inquiry"                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Email Integration
- [ ] Google Workspace OAuth integration
- [ ] Microsoft 365 OAuth integration
- [ ] Email parsing and threading
- [ ] AI response generation for email format
- [ ] Outbound email sending

### Phase 2: Facebook Messenger
- [ ] Meta Business OAuth integration
- [ ] Webhook endpoint for incoming messages
- [ ] Page selection and location assignment
- [ ] Quick replies and buttons support
- [ ] Media attachment handling

### Phase 3: Instagram DM
- [ ] Instagram Graph API integration
- [ ] DM webhook handling
- [ ] Story mention responses
- [ ] Media message support

### Phase 4: Unified Inbox Enhancements
- [ ] Channel filtering in inbox
- [ ] Cross-channel conversation threading
- [ ] Channel-specific response formatting
- [ ] Analytics by channel

---

## Security Considerations

### Token Management
- All OAuth tokens encrypted at rest
- Automatic token refresh before expiration
- Scope-limited access requests
- Secure webhook verification

### Data Privacy
- Messages stored with same RLS policies as widget conversations
- User data handled per platform TOS
- GDPR/CCPA compliance for user data requests

---

## Related Documentation

- [Native Booking System](./NATIVE_BOOKING_SYSTEM.md) - Data Sources and calendar integration
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Web widget implementation
- [Database Schema](./DATABASE_SCHEMA.md) - Full database documentation
