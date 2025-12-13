# Multi-Account Integrations Architecture

> **Last Updated**: December 2024  
> **Status**: In Progress (Phase 1)  
> **Related**: [ChatPad Architecture](./CHATPAD_ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md), [Widget Architecture](./WIDGET_ARCHITECTURE.md)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [WordPress REST API Integration](#wordpress-rest-api-integration)
4. [Core Architecture](#core-architecture)
5. [Routing Intelligence](#routing-intelligence)
6. [Widget Experience](#widget-experience)
7. [Admin UI Design](#admin-ui-design)
8. [Implementation Phases](#implementation-phases)

---

## Executive Summary

This document outlines the architecture for supporting multiple connected accounts per integration type (calendars, emails, social channels) within a single agent. The primary use case is multi-location businesses (e.g., property management companies with 20+ communities) that need intelligent routing to the correct account based on conversation context.

**Key Innovation**: WordPress REST API integration for automatic community and home/property synchronization, eliminating manual data entry and enabling AI-powered location routing.

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
  - Know about all 200+ homes across all communities
  - Route inquiries to the correct community
  - Respond to Facebook messages from any of 20 pages
  - Send emails from the correct community's email
  - Book property viewings on the correct community's calendar
```

---

## WordPress REST API Integration

### Overview

For clients using WordPress with custom post types for communities and homes, ChatPad integrates directly with the WordPress REST API to:

1. **Auto-import communities** as ChatPad Locations
2. **Sync home/property listings** for AI knowledge and RAG
3. **Enable smart widget detection** based on URL paths and taxonomy
4. **Keep data fresh** with scheduled sync

### WordPress Data Structure

#### Community Post Type (`/wp-json/wp/v2/community`)

```json
{
  "id": 135,
  "slug": "forge-at-the-lake",
  "title": { "rendered": "Forge at the Lake" },
  "acf": {
    "community_address": "123 Lakeside Dr",
    "community_city": "Austin",
    "community_state": "TX",
    "community_zip": "78701",
    "community_phone": "(512) 555-0100",
    "community_email": "forge@example.com",
    "community_amenities": ["Pool", "Clubhouse", "Fitness Center"]
  }
}
```

#### Home Post Type (`/wp-json/wp/v2/home`)

```json
{
  "id": 459,
  "slug": "forge-lake-home-123",
  "title": { "rendered": "3BR/2BA at Forge Lake" },
  "home_community": [135],  // Taxonomy linking to community ID
  "acf": {
    "price": 1250,
    "bedrooms": 3,
    "bathrooms": 2,
    "square_feet": 1400,
    "home_status": "available",
    "home_address": "Lot 42",
    "home_photos": [...]
  },
  "_embedded": {
    "wp:featuredmedia": [...]
  }
}
```

### Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WordPress Site Connector                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Agent Settings                                                     │
│   └── WordPress Site URL: https://example.com                       │
│       └── [Test Connection] [Import Communities] [Sync Homes]       │
│                                                                      │
│   ┌────────────────────┐    ┌─────────────────────────────────┐     │
│   │  /wp-json/wp/v2/   │    │  ChatPad Database               │     │
│   │  community         │───▶│  locations table                │     │
│   │  (20 communities)  │    │  - wordpress_slug               │     │
│   └────────────────────┘    │  - wordpress_community_id       │     │
│                              │  - name, address (from ACF)     │     │
│   ┌────────────────────┐    └─────────────────────────────────┘     │
│   │  /wp-json/wp/v2/   │    ┌─────────────────────────────────┐     │
│   │  home              │───▶│  properties table               │     │
│   │  (200+ homes)      │    │  - location_id (matched via     │     │
│   │  + home_community  │    │    wordpress_community_id)      │     │
│   └────────────────────┘    │  - price, beds, baths, images   │     │
│                              └─────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Database Schema Additions

```sql
-- Add WordPress linking columns to locations
ALTER TABLE locations 
  ADD COLUMN wordpress_slug TEXT,
  ADD COLUMN wordpress_community_id INTEGER;

-- Add unique constraint for WordPress sync matching
CREATE UNIQUE INDEX idx_locations_wordpress 
  ON locations(agent_id, wordpress_community_id) 
  WHERE wordpress_community_id IS NOT NULL;

-- Add wordpress_home to knowledge_source_type enum
ALTER TYPE knowledge_source_type ADD VALUE IF NOT EXISTS 'wordpress_community';
ALTER TYPE knowledge_source_type ADD VALUE IF NOT EXISTS 'wordpress_home';
```

### Agent WordPress Config

Stored in `agents.deployment_config`:

```json
{
  "wordpress": {
    "site_url": "https://example.com",
    "community_endpoint": "/wp-json/wp/v2/community",
    "home_endpoint": "/wp-json/wp/v2/home",
    "last_community_sync": "2024-12-13T10:00:00Z",
    "last_home_sync": "2024-12-13T10:00:00Z",
    "auto_sync_enabled": true,
    "sync_interval": "daily"
  }
}
```

---

## Core Architecture

### Location-Centric Model (Recommended)

```
Agent
└── Locations (auto-imported from WordPress OR manual)
    ├── Forge at the Lake
    │   ├── wordpress_slug: "forge-at-the-lake"
    │   ├── wordpress_community_id: 135
    │   ├── Properties: 45 homes (from WP sync)
    │   ├── Facebook: Forge Lake Page
    │   ├── Email: forge@mhpcompany.com
    │   └── Calendar: Forge Tours
    ├── Clearview Estates
    │   ├── wordpress_slug: "clearview-estates"
    │   ├── wordpress_community_id: 142
    │   ├── Properties: 62 homes
    │   ├── Facebook: Clearview Page
    │   └── Calendar: Clearview Tours
    └── [Manual Location - No WordPress]
        ├── Name: "Corporate Office"
        ├── No wordpress fields
        └── Calendar: HQ Calendar
```

### What's Retained

All existing knowledge source types and features remain available:

| Feature | Status |
|---------|--------|
| Manual URL knowledge sources | ✅ Retained |
| Sitemap crawling | ✅ Retained |
| Property Listings parser | ✅ Retained |
| Text/Upload sources | ✅ Retained |
| Refresh strategies (1/2/3/4/6/12/24hr) | ✅ Retained |
| Business hours editor | ✅ Retained |
| Calendar connections | ✅ Retained |

### What's Added

| Feature | Description |
|---------|-------------|
| WordPress Site Connector | Connect WordPress site, auto-import communities |
| `wordpress_slug` field | Links Location to WP community post |
| `wordpress_community_id` field | Integer ID for sync matching |
| Home/Property Sync | Import all homes with `home_community` taxonomy |
| Smart Widget Detection | Auto-detect location from URL path |
| AI Fallback | Ask user to select location when auto-detect fails |

### What's Removed

| Feature | Reason |
|---------|--------|
| URL Patterns Editor | Replaced by smart detection (URL path + WP taxonomy) |

---

## Routing Intelligence

### Smart Location Detection Flow

```
User visits: example.com/home/forge-lake-home-123/
    │
    ▼
Widget initializes
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│  Detection Priority:                                           │
│                                                                │
│  1. Explicit embed: data-location="forge-at-the-lake"         │
│     └── Direct match to wordpress_slug                         │
│                                                                │
│  2. URL Path Detection:                                        │
│     └── /community/{slug}/ → extract slug, match Location     │
│     └── /home/{slug}/ → fetch home_community from WP API      │
│                                                                │
│  3. Conversation Context:                                      │
│     └── User mentions "Forge" or "the lake property"          │
│                                                                │
│  4. AI Fallback:                                               │
│     └── "Which community are you interested in?"              │
│     └── Present location picker buttons                        │
│                                                                │
└───────────────────────────────────────────────────────────────┘
    │
    ▼
AI greets: "Welcome! I see you're looking at homes in 
            Forge at the Lake. How can I help?"
```

### Widget Configuration

```html
<!-- Option 1: Explicit location (most reliable) -->
<script
  src="https://app.chatpad.ai/widget.js"
  data-agent-id="abc123"
  data-location="forge-at-the-lake"
></script>

<!-- Option 2: Auto-detect from URL (requires WP sync) -->
<script
  src="https://app.chatpad.ai/widget.js"
  data-agent-id="abc123"
  data-auto-detect-location="true"
></script>
```

### Detection Code (Widget)

```typescript
async function detectLocation(config: WidgetConfig): Promise<string | null> {
  // 1. Check explicit config
  if (config.locationSlug) {
    return config.locationSlug;
  }
  
  // 2. Check URL path for /community/{slug}/
  const communityMatch = window.location.pathname.match(/\/community\/([^\/]+)/);
  if (communityMatch) {
    return communityMatch[1];
  }
  
  // 3. Check URL path for /home/{slug}/ and fetch taxonomy
  const homeMatch = window.location.pathname.match(/\/home\/([^\/]+)/);
  if (homeMatch && config.wordpressSiteUrl) {
    try {
      const response = await fetch(
        `${config.wordpressSiteUrl}/wp-json/wp/v2/home?slug=${homeMatch[1]}&_fields=home_community`
      );
      const [home] = await response.json();
      if (home?.home_community?.[0]) {
        // Fetch community slug from ID
        const communityId = home.home_community[0];
        const commResponse = await fetch(
          `${config.wordpressSiteUrl}/wp-json/wp/v2/community/${communityId}?_fields=slug`
        );
        const community = await commResponse.json();
        return community.slug;
      }
    } catch (e) {
      console.warn('Failed to detect location from WP:', e);
    }
  }
  
  // 4. Return null - AI will ask user
  return null;
}
```

---

## Widget Experience

### AI Fallback: Location Selection

When location cannot be auto-detected:

```
┌────────────────────────────────────────┐
│  🏠 Welcome to MHP Communities         │
│                                        │
│  AI: Hi! I'd be happy to help. Which   │
│  community are you interested in?      │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 📍 Forge at the Lake             │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 📍 Clearview Estates             │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 📍 Pine Ridge                    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [ General Inquiry ]                   │
│                                        │
└────────────────────────────────────────┘
```

### AI Tool: `select_location`

```typescript
{
  name: "select_location",
  description: "Present location options when user's community cannot be auto-detected",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Question to ask user"
      },
      include_general_option: {
        type: "boolean",
        default: true
      }
    }
  }
}
```

---

## Admin UI Design

### Locations Tab - Simplified

```
┌─────────────────────────────────────────────────────────────────────┐
│  Locations                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 🌐 WordPress Connection                                         ││
│  │                                                                  ││
│  │ Site URL: https://example.com                    [Test] [Sync]  ││
│  │ Last synced: 2 hours ago • 20 communities, 245 homes           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌────────────────┐  ┌──────────────────────────────────────────┐   │
│  │   Locations    │  │                                          │   │
│  │   ──────────   │  │  Forge at the Lake                       │   │
│  │                │  │  ════════════════════                    │   │
│  │   ● Forge      │  │                                          │   │
│  │     Clearview  │  │  WordPress Slug: forge-at-the-lake       │   │
│  │     Pine Ridge │  │  Address: 123 Lakeside Dr, Austin, TX    │   │
│  │                │  │  Phone: (512) 555-0100                   │   │
│  │   ──────────   │  │  Email: forge@example.com                │   │
│  │                │  │                                          │   │
│  │   + Add        │  │  Properties: 45 homes synced            │   │
│  │     Location   │  │                                          │   │
│  │                │  │  Business Hours: Mon-Fri 9-5, Sat 10-2   │   │
│  │                │  │                                          │   │
│  │                │  │  📅 Connected Calendars                   │   │
│  │                │  │  └── Forge Tours (Google) ✓              │   │
│  │                │  │                                          │   │
│  └────────────────┘  └──────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Location Details Form (Simplified)

Fields shown:
- **Name** (auto-filled from WP, editable)
- **WordPress Slug** (read-only or manual entry for non-WP)
- **Address, City, State, ZIP** (auto-filled from WP ACF)
- **Timezone** (dropdown)
- **Phone, Email** (auto-filled from WP ACF)
- **Business Hours** (editor component)
- **Connected Calendars** (existing component)

**Removed:**
- URL Patterns Editor (replaced by smart detection)

---

## Implementation Phases

### Phase 1: Simplify Locations Tab ✅ IN PROGRESS
- [x] Create locations table and basic CRUD
- [x] Build LocationList and LocationDetails components
- [x] Business hours editor
- [x] Calendar connections
- [ ] **Remove URL Patterns Editor**
- [ ] **Add `wordpress_slug` field to UI**
- [ ] **Database migration: add `wordpress_slug`, `wordpress_community_id`**

### Phase 2: WordPress Site Connector
- [ ] Add WordPress Site URL field to agent config
- [ ] Create `sync-wordpress-communities` edge function
- [ ] Import communities as Locations with WP slug/ID
- [ ] Pull ACF fields (address, phone, email, amenities)
- [ ] Show sync status and "Re-sync" button

### Phase 3: Home/Property Sync
- [ ] Create `sync-wordpress-homes` edge function
- [ ] Map `home_community` taxonomy → ChatPad Location
- [ ] Create/update Properties with home details
- [ ] Generate embeddings for RAG
- [ ] Add `wordpress_home` source type

### Phase 4: Smart Widget Detection
- [ ] Widget detects `/community/{slug}/` in URL
- [ ] Widget fetches `home_community` for `/home/{slug}/`
- [ ] Pass detected location to conversation
- [ ] Store `location_id` on conversation for routing

### Phase 5: Scheduled Sync & Refresh
- [ ] Apply existing refresh strategies to WordPress sync
- [ ] Show "Last Synced" timestamp per location
- [ ] "Re-sync Now" button per location
- [ ] Handle community/home deletions gracefully

### Phase 6: AI Fallback for Non-WordPress
- [ ] Create `select_location` AI tool
- [ ] AI presents location picker when undetected
- [ ] Store selected location in conversation metadata
- [ ] Route calendar/email to correct connected accounts

---

## Technical Considerations

### OAuth Token Management
```typescript
interface TokenManagement {
  storage: 'database';  // Encrypted in connected_accounts
  refreshStrategy: 'on-demand';  // Refresh when token expires
  onTokenExpiry: 'notify-user';  // Show reconnect prompt
}
```

### Refresh Strategies (Retained)
All existing refresh intervals remain available:
- `manual` - Only refresh on user action
- `hourly_1` - Every hour
- `hourly_2` - Every 2 hours
- `hourly_3` - Every 3 hours
- `hourly_4` - Every 4 hours
- `hourly_6` - Every 6 hours
- `hourly_12` - Every 12 hours
- `daily` - Every 24 hours

### Caching Strategy
```typescript
interface CachingStrategy {
  calendarAvailability: { ttl: '5 minutes' };
  locations: { ttl: '1 hour' };
  properties: { ttl: '6 hours' };  // WordPress homes
  accountStatus: { ttl: '15 minutes' };
}
```

---

## References

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [OAuth 2.0 Best Practices](https://oauth.net/2/)
- [Google Calendar API](https://developers.google.com/calendar)
- [ACF to REST API Plugin](https://wordpress.org/plugins/acf-to-rest-api/)
