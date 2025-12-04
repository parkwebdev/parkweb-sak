# Multi-Account Integrations Architecture

> **Status**: Planning Phase  
> **Last Updated**: December 2024  
> **Related Features**: Agent Integrations, Widget, AI Routing

## Executive Summary

This document outlines the architecture for supporting multiple connected accounts per integration type (calendars, emails, social channels) within a single agent. The primary use case is multi-location businesses (e.g., property management companies with 20+ communities) that need intelligent routing to the correct account based on conversation context.

---

## Problem Statement

### Current Limitation
The current integrations model assumes a 1:1 relationship:
- 1 Agent → 1 Facebook Page
- 1 Agent → 1 Email Account
- 1 Agent → 1 Calendar

### Real-World Requirements
Multi-location businesses need:
- **20+ Facebook Pages** (one per community/location)
- **20+ Email Accounts** (one per community/location)
- **20+ Calendars** (one per community/location)
- **Intelligent Routing** to the correct account based on context

### Example Scenario
```
Client: Mobile Home Park Operator
Communities: 20 locations across 5 states
Need: AI agent that can:
  - Respond to Facebook messages from any of 20 pages
  - Send emails from the correct community's email
  - Book property viewings on the correct community's calendar
  - Route inquiries to the appropriate location
```

---

## Core Concepts

### The Fundamental Question
**What is the organizing principle for connected accounts?**

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Location-Centric** | Locations are first-class entities; accounts belong to locations | Clear mental model, natural hierarchy | Rigid structure, may not fit all use cases |
| **Tag-Based** | Flat list of accounts with flexible tagging | Flexible, supports complex scenarios | Can become messy, harder to manage at scale |
| **Hybrid** | Locations as primary with optional tags for edge cases | Best of both worlds | More complex to implement |

---

## Architecture Options

### Option A: Location-Centric Model

```
Agent
└── Locations
    ├── Phoenix Community
    │   ├── Facebook: Phoenix MHP Page
    │   ├── Email: phoenix@mhpcompany.com
    │   └── Calendar: Phoenix Viewings
    ├── Austin Community
    │   ├── Facebook: Austin MHP Page
    │   ├── Email: austin@mhpcompany.com
    │   └── Calendar: Austin Viewings
    └── Denver Community
        ├── Facebook: Denver MHP Page
        ├── Email: denver@mhpcompany.com
        └── Calendar: Denver Viewings
```

#### Database Schema

```sql
-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly identifier
  address TEXT,
  city TEXT,
  state TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  metadata JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, slug)
);

-- Connected accounts table
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Integration type
  integration_type TEXT NOT NULL, -- 'facebook', 'instagram', 'google_calendar', 'outlook', 'gmail', etc.
  
  -- Account details
  account_name TEXT NOT NULL, -- Display name
  account_id TEXT NOT NULL, -- External platform ID (FB page ID, calendar ID, etc.)
  account_email TEXT, -- For email integrations
  
  -- OAuth/Auth data (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Configuration
  config JSONB DEFAULT '{}', -- Integration-specific settings
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'disconnected', 'error'
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add location context to conversations
ALTER TABLE conversations ADD COLUMN location_id UUID REFERENCES locations(id);

-- Index for efficient lookups
CREATE INDEX idx_connected_accounts_agent_location ON connected_accounts(agent_id, location_id);
CREATE INDEX idx_connected_accounts_type ON connected_accounts(integration_type);
CREATE INDEX idx_locations_agent ON locations(agent_id);
```

### Option B: Flat Multi-Account with Tagging

```sql
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  integration_type TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  
  -- Flexible tagging instead of location FK
  tags JSONB DEFAULT '[]', -- ['location:phoenix', 'region:southwest', 'type:residential']
  labels JSONB DEFAULT '{}', -- { "location": "Phoenix", "manager": "John" }
  
  -- ... rest of fields
);
```

### Option C: Hybrid Approach (Recommended)

Locations as primary organizing principle, but with flexible metadata for edge cases:

```sql
-- Locations with flexible metadata
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  -- Core location data
  address JSONB, -- { street, city, state, zip, country }
  coordinates JSONB, -- { lat, lng }
  timezone TEXT,
  
  -- Contact info
  phone TEXT,
  email TEXT,
  
  -- Business hours (for availability)
  business_hours JSONB, -- { mon: { open: "09:00", close: "17:00" }, ... }
  
  -- Flexible metadata for edge cases
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Routing Intelligence

### How Does the AI Know Which Account to Use?

The routing decision must happen intelligently based on available context:

```
┌─────────────────────────────────────────────────────────────────┐
│                     ROUTING DECISION TREE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Explicit Context (Highest Priority)                         │
│     └── Embed code includes location: data-location="phoenix"   │
│                                                                  │
│  2. Conversation Context                                         │
│     └── User mentioned "Phoenix" or "Arizona" in chat           │
│                                                                  │
│  3. Referrer Detection                                           │
│     └── User came from phoenix.mhpcompany.com                   │
│                                                                  │
│  4. Inbound Channel                                              │
│     └── Message came FROM Phoenix Facebook Page                  │
│                                                                  │
│  5. User Selection                                               │
│     └── AI asks: "Which community are you interested in?"       │
│                                                                  │
│  6. Default Fallback                                             │
│     └── Use default location or corporate/general account       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Context Sources

#### 1. Embed Code Configuration
```html
<!-- Location-specific widget embed -->
<script
  src="https://app.chatpad.ai/widget.js"
  data-agent-id="abc123"
  data-location-id="phoenix-community"
></script>
```

#### 2. AI Intent Extraction
```typescript
interface ConversationContext {
  detectedLocation?: {
    locationId: string;
    confidence: number; // 0-1
    source: 'explicit' | 'inferred' | 'referrer' | 'channel';
  };
  mentionedLocations: string[]; // All locations mentioned
  userIntent: 'inquiry' | 'booking' | 'support' | 'complaint';
}
```

#### 3. Referrer URL Parsing
```typescript
function detectLocationFromReferrer(referrer: string, locations: Location[]): Location | null {
  // Check subdomain: phoenix.mhpcompany.com
  // Check path: mhpcompany.com/communities/phoenix
  // Check query params: mhpcompany.com?location=phoenix
}
```

#### 4. Inbound Channel Mapping
When a message comes IN from a connected Facebook page, the location is implicit:

```typescript
interface InboundMessage {
  channel: 'facebook' | 'instagram' | 'email';
  externalAccountId: string; // The FB page ID, email address, etc.
  // We can reverse-lookup which location this account belongs to
}
```

---

## Widget Experience

### Pre-Chat Location Selection

For cases where location can't be auto-detected:

```
┌────────────────────────────────────────┐
│  🏠 Welcome to MHP Communities         │
│                                        │
│  Which community can we help you with? │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 📍 Phoenix, AZ                   │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 📍 Austin, TX                    │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 📍 Denver, CO                    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [ General Inquiry ]                   │
│                                        │
└────────────────────────────────────────┘
```

### In-Conversation Location Detection

```
┌────────────────────────────────────────┐
│  AI: Hi! I'd be happy to help you      │
│      schedule a tour. Which of our     │
│      communities would you like to     │
│      visit?                            │
│                                        │
│  User: I'm interested in the Phoenix   │
│        location                        │
│                                        │
│  AI: Great choice! Phoenix Palms has   │
│      beautiful mountain views. I can   │
│      see we have availability this     │
│      week. Would Thursday at 2pm or    │
│      Friday at 10am work better?       │
│                                        │
│  [Context: AI detected "Phoenix" →     │
│   Using Phoenix calendar for booking]  │
└────────────────────────────────────────┘
```

### Calendar Booking Flow

```
User: "I'd like to schedule a tour"
                │
                ▼
┌───────────────────────────────────┐
│  Location Known?                  │
│  (from context/embed/detection)   │
└───────────────────────────────────┘
        │               │
       Yes              No
        │               │
        ▼               ▼
┌─────────────┐  ┌─────────────────┐
│ Fetch       │  │ Ask user which  │
│ Location's  │  │ location        │
│ Calendar    │  └─────────────────┘
└─────────────┘          │
        │                │
        ▼                ▼
┌─────────────────────────────────────┐
│  Check Calendar Availability        │
│  (respecting business hours)        │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Present Available Slots            │
│  "Thursday 2pm or Friday 10am?"     │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Create Calendar Event              │
│  - On location's calendar           │
│  - Send confirmation from           │
│    location's email                 │
└─────────────────────────────────────┘
```

---

## Admin UI Design

### Integrations Tab - Location View

```
┌─────────────────────────────────────────────────────────────────────┐
│  Integrations                                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌────────────────────────────────────────────┐   │
│  │              │  │                                            │   │
│  │  Locations   │  │  Phoenix Community                         │   │
│  │  ──────────  │  │  ════════════════                         │   │
│  │              │  │                                            │   │
│  │  ● Phoenix   │  │  📱 Social Channels                        │   │
│  │    Austin    │  │  ┌─────────────────────────────────────┐  │   │
│  │    Denver    │  │  │ f  Phoenix MHP Page    ✓ Connected  │  │   │
│  │    Houston   │  │  │     @phoenixmhp                      │  │   │
│  │    Portland  │  │  └─────────────────────────────────────┘  │   │
│  │              │  │  ┌─────────────────────────────────────┐  │   │
│  │  ──────────  │  │  │ 📷 Phoenix MHP         ✓ Connected  │  │   │
│  │              │  │  │     @phoenixmhp                      │  │   │
│  │  + Add       │  │  └─────────────────────────────────────┘  │   │
│  │    Location  │  │                                            │   │
│  │              │  │  📧 Email Accounts                         │   │
│  │              │  │  ┌─────────────────────────────────────┐  │   │
│  │              │  │  │ ✉️  phoenix@mhpcompany.com          │  │   │
│  │              │  │  │     Google Workspace   ✓ Connected  │  │   │
│  │              │  │  └─────────────────────────────────────┘  │   │
│  │              │  │                                            │   │
│  │              │  │  📅 Calendars                              │   │
│  │              │  │  ┌─────────────────────────────────────┐  │   │
│  │              │  │  │ 📅 Phoenix Tours Calendar           │  │   │
│  │              │  │  │    Google Calendar     ✓ Connected  │  │   │
│  │              │  │  └─────────────────────────────────────┘  │   │
│  │              │  │                                            │   │
│  │              │  │  [ + Add Integration ]                     │   │
│  │              │  │                                            │   │
│  └──────────────┘  └────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Location Management Panel

```
┌─────────────────────────────────────────────────────────────────────┐
│  Edit Location: Phoenix Community                            [ × ]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Name                                                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Phoenix Community                                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Identifier (for embed code)                                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ phoenix-community                                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Address                                                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 1234 Desert View Dr, Phoenix, AZ 85001                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Timezone                                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ America/Phoenix (MST)                              ▼         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Business Hours                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Mon-Fri: 9:00 AM - 5:00 PM                                   │    │
│  │ Sat: 10:00 AM - 2:00 PM                                      │    │
│  │ Sun: Closed                                                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ☑ Set as default location                                          │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │     Cancel      │  │      Save       │                           │
│  └─────────────────┘  └─────────────────┘                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Connected Account Card States

```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Connected                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  f  Phoenix MHP Page                         ● Connected   │  │
│  │     @phoenixmhp • 15.2K followers                          │  │
│  │     Last sync: 2 minutes ago                               │  │
│  │                                                             │  │
│  │     [ Disconnect ]  [ Refresh ]  [ Settings ]              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ⚠ Error State                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  f  Austin MHP Page                          ⚠ Error       │  │
│  │     @austinmhp                                              │  │
│  │     Token expired - reconnection required                  │  │
│  │                                                             │  │
│  │     [ Reconnect ]  [ Remove ]                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  + Not Connected                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  f  Connect Facebook Page                                  │  │
│  │     Link a Facebook Page for this location                 │  │
│  │                                                             │  │
│  │     [ Connect with Facebook ]                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Agent Integration

### System Prompt Additions

The AI agent needs context about available locations and their integrations:

```typescript
interface AgentLocationContext {
  locations: {
    id: string;
    name: string;
    slug: string;
    address?: string;
    timezone: string;
    businessHours?: BusinessHours;
    integrations: {
      hasCalendar: boolean;
      hasEmail: boolean;
      hasFacebook: boolean;
      hasInstagram: boolean;
    };
  }[];
  defaultLocationId?: string;
}
```

### Dynamic System Prompt Injection

```typescript
const locationContext = `
## Available Locations

You can help users with the following locations:

${locations.map(loc => `
### ${loc.name}
- Address: ${loc.address}
- Timezone: ${loc.timezone}
- Can book tours: ${loc.integrations.hasCalendar ? 'Yes' : 'No'}
- Can send emails: ${loc.integrations.hasEmail ? 'Yes' : 'No'}
`).join('\n')}

## Location Detection

When a user asks about a specific location:
1. If they mention a location name, use that location
2. If unclear, ask which location they're interested in
3. Use the default location if no preference is expressed

## Booking Tours

When booking a tour:
1. Confirm the location
2. Check availability for that location's calendar
3. Present 2-3 available time slots
4. Create the booking and send confirmation
`;
```

### Tool Definitions

```typescript
const agentTools = [
  {
    name: "check_calendar_availability",
    description: "Check available time slots for tours at a location",
    parameters: {
      type: "object",
      properties: {
        location_id: {
          type: "string",
          description: "The location ID to check availability for"
        },
        date_range: {
          type: "object",
          properties: {
            start: { type: "string", format: "date" },
            end: { type: "string", format: "date" }
          }
        },
        duration_minutes: {
          type: "number",
          default: 30
        }
      },
      required: ["location_id"]
    }
  },
  {
    name: "book_appointment",
    description: "Book a tour or appointment at a location",
    parameters: {
      type: "object",
      properties: {
        location_id: { type: "string" },
        datetime: { type: "string", format: "date-time" },
        duration_minutes: { type: "number" },
        attendee_name: { type: "string" },
        attendee_email: { type: "string" },
        attendee_phone: { type: "string" },
        notes: { type: "string" }
      },
      required: ["location_id", "datetime", "attendee_name", "attendee_email"]
    }
  },
  {
    name: "send_email",
    description: "Send an email from a location's email account",
    parameters: {
      type: "object",
      properties: {
        location_id: { type: "string" },
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" }
      },
      required: ["location_id", "to", "subject", "body"]
    }
  }
];
```

---

## Open Questions to Resolve

### 1. Organizing Principle
- [ ] **Location-centric** (recommended for multi-location businesses)
- [ ] **Tag-based** (more flexible but potentially messy)
- [ ] **Hybrid** (locations + tags for edge cases)

### 2. Location Detection Strategy
- [ ] **Embed code parameter** - Most reliable, requires separate embeds
- [ ] **AI inference from conversation** - Flexible, less reliable
- [ ] **Pre-chat selector** - Explicit, adds friction
- [ ] **Referrer URL detection** - Automatic, depends on URL structure
- [ ] **Combination of all** - Most robust

### 3. Default/Fallback Behavior
- [ ] What happens when location can't be determined?
  - [ ] Ask the user
  - [ ] Use default location
  - [ ] Use "corporate" generic accounts
  - [ ] Block certain actions (no booking without location)

### 4. Cross-Location Scenarios
- [ ] Can a user inquiry span multiple locations?
- [ ] How to handle "I'm interested in Phoenix AND Austin"?
- [ ] Should conversations be transferable between locations?

### 5. Permission Model
- [ ] Can team members be restricted to specific locations?
- [ ] Should location managers only see their location's conversations?
- [ ] How does this interact with existing role system?

### 6. Conversation History
- [ ] Is conversation history per-location or global per-user?
- [ ] If a user talks about Phoenix, then Austin, are these separate conversations?

### 7. Analytics & Reporting
- [ ] Location-level analytics (conversations, bookings, leads)?
- [ ] Compare performance across locations?
- [ ] Which locations drive the most engagement?

### 8. Scaling Considerations
- [ ] What's the max number of locations per agent?
- [ ] Performance impact of location lookups?
- [ ] Rate limits per connected account?

### 9. Integration Specifics
- [ ] **Facebook**: Multiple pages = multiple OAuth connections?
- [ ] **Google Calendar**: Multiple calendars under one Google account vs separate accounts?
- [ ] **Email**: Shared inbox vs individual accounts?

### 10. Widget Embed Variants
- [ ] Single widget with location selector?
- [ ] Location-specific widget embeds?
- [ ] Location detection via subdomain/path?

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Locations data model and CRUD
- [ ] Connected accounts data model
- [ ] Basic UI for managing locations
- [ ] Location-aware embed code generation

### Phase 2: OAuth Integrations
- [ ] Google OAuth (Calendar, Gmail)
- [ ] Microsoft OAuth (Outlook Calendar, Email)
- [ ] Facebook Pages OAuth
- [ ] Instagram Business OAuth

### Phase 3: Routing Intelligence
- [ ] Embed code location parameter
- [ ] AI conversation analysis for location detection
- [ ] Referrer URL parsing
- [ ] Inbound message routing

### Phase 4: AI Tools
- [ ] Calendar availability checking
- [ ] Appointment booking
- [ ] Email sending
- [ ] Tool execution with location context

### Phase 5: Advanced Features
- [ ] Location-based analytics
- [ ] Team member location permissions
- [ ] Multi-location conversation handling
- [ ] Location-specific business rules

---

## Technical Considerations

### OAuth Token Management
```typescript
interface TokenManagement {
  // Token storage (encrypted)
  storage: 'database' | 'vault';
  
  // Refresh strategy
  refreshStrategy: 'on-demand' | 'proactive' | 'scheduled';
  
  // Error handling
  onTokenExpiry: 'notify-user' | 'auto-reconnect' | 'disable-integration';
}
```

### Rate Limiting
```typescript
interface RateLimits {
  // Per integration type
  facebook: {
    messagesPerHour: 200,
    apiCallsPerHour: 200
  };
  googleCalendar: {
    queriesPerDay: 1000000, // Per-project quota
    eventsPerCalendar: 500
  };
  email: {
    sendsPerDay: 500 // Varies by provider
  };
}
```

### Caching Strategy
```typescript
interface CachingStrategy {
  // Calendar availability
  calendarAvailability: {
    ttl: '5 minutes',
    invalidateOn: ['booking', 'cancellation']
  };
  
  // Location list
  locations: {
    ttl: '1 hour',
    invalidateOn: ['location-update']
  };
  
  // Connected account status
  accountStatus: {
    ttl: '15 minutes',
    invalidateOn: ['token-refresh', 'disconnect']
  };
}
```

---

## Appendix: Competitor Analysis

### How Others Handle Multi-Location

| Platform | Approach | Notes |
|----------|----------|-------|
| Intercom | Single inbox, manual tagging | No native multi-location |
| Drift | Playbooks per page/segment | URL-based routing |
| HubSpot | Properties + workflows | CRM-centric approach |
| Zendesk | Brands (separate instances) | Heavy-weight solution |

### Differentiation Opportunity
ChatPad can be the first to offer **native multi-location AI routing** with:
- Automatic location detection
- AI-powered context understanding
- Seamless integration routing
- Unified management interface

---

## References

- [OAuth 2.0 Best Practices](https://oauth.net/2/)
- [Google Calendar API](https://developers.google.com/calendar)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/)

---

*This document is a living spec. Update as decisions are made.*
