# Native Booking System: Complete Architecture & Implementation Plan

> **Last Updated**: December 2025  
> **Status**: ✅ Complete (Phases 1-7 Implemented, OAuth Configuration Pending)  
> **Priority**: High  
> **Related**: [AI Architecture](./AI_ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md), [Social Channel Integrations](./SOCIAL_CHANNEL_INTEGRATIONS.md)

This document provides the complete implementation blueprint for ChatPad's native booking system, enabling AI agents to intelligently route inquiries across multiple communities, maintain real-time property listings, check calendar availability, and book tours autonomously.

---

## Configuration Required

Before the booking system is fully operational, the following must be configured:

### OAuth Secrets (Supabase Edge Function Secrets)
| Secret | Description |
|--------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OUTLOOK_CLIENT_ID` | Microsoft OAuth client ID |
| `OUTLOOK_CLIENT_SECRET` | Microsoft OAuth client secret |

### Data Requirements
- **Properties:** Sync properties via WordPress integration or manual entry to populate `properties` table
- **Calendar Accounts:** Connect Google/Outlook calendars via Integrations tab to populate `connected_accounts` table
- **Locations:** Create locations with business hours configured

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Architecture](#solution-architecture)
4. [Unified Data Sources Architecture](#unified-data-sources-architecture)
5. [WordPress REST API Integration](#wordpress-rest-api-integration)
6. [Phase 1: Living Data Sources Foundation](#phase-1-living-data-sources-foundation) ✅ Complete
7. [Phase 2: Unified Data Sources Tab](#phase-2-unified-data-sources-tab) ✅ Complete
8. [Phase 3: WordPress Site Connector](#phase-3-wordpress-site-connector) ✅ Complete
9. [Phase 4: Home/Property Sync](#phase-4-homeproperty-sync) ✅ Schema Ready (Awaiting Data Sync)
10. [Phase 5: Smart Widget Detection](#phase-5-smart-widget-detection) ✅ Complete
11. [Phase 6: AI Booking Tools](#phase-6-ai-booking-tools) ✅ Complete
12. [Phase 7: Polish & Optimization](#phase-7-polish--optimization) ✅ Complete
13. [Cost Analysis](#cost-analysis)
14. [Risk Mitigation](#risk-mitigation)
15. [Success Metrics](#success-metrics)

---

## Executive Summary

### Vision
Enable mobile home park operators (and similar multi-location businesses) to deploy a single AI agent that:
- Automatically keeps property listings current across 20+ communities
- Intelligently routes visitor inquiries to the correct location
- Checks real-time calendar availability
- Books tours directly on the appropriate staff calendar
- Handles the entire booking flow conversationally

### Key Capabilities
| Capability | Description |
|------------|-------------|
| **Living Data Sources** | Knowledge sources auto-refresh on configurable intervals (1h-24h) with hash-based change detection |
| **AI Property Extraction** | Structured property data extracted from HTML listing pages using AI |
| **Multi-Location Routing** | Conversations automatically route to correct community based on context |
| **Calendar Integration** | Google Calendar and Microsoft Outlook OAuth connections per location |
| **Autonomous Booking** | AI books appointments directly without human intervention |

---

## Problem Statement

### Current Pain Points

1. **Stale Property Data**: Knowledge sources are static; property listings become outdated within hours
2. **No Location Awareness**: AI cannot distinguish between communities or route inquiries appropriately
3. **Manual Booking Process**: Users must be handed off to humans or external booking systems
4. **Multi-Account Complexity**: Operators with 20+ communities need per-location calendar management

### Target User Profile
- **Mobile Home Park Operators**: 5-50 communities, each with unique listings and calendars
- **Property Management Companies**: Multi-location portfolios with distinct inventory
- **Multi-Site Service Businesses**: Any business needing location-aware booking

### Success Criteria
- Property listings refresh automatically and stay accurate within configured intervals
- AI correctly routes 95%+ of inquiries to the right community
- End-to-end booking completion without human intervention
- Sub-$50/month cost for 200-client deployment

---

## Solution Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CHATPAD PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   ADMIN UI      │    │   WIDGET        │    │   API           │        │
│  │                 │    │                 │    │                 │        │
│  │ • Locations Mgmt│    │ • Chat Interface│    │ • Agent API     │        │
│  │ • Source Config │    │ • Booking Flow  │    │ • Webhook Events│        │
│  │ • Calendar View │    │ • Property Cards│    │                 │        │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│           │                      │                      │                  │
│           └──────────────────────┼──────────────────────┘                  │
│                                  │                                         │
│                                  ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │                        EDGE FUNCTIONS                              │    │
│  │                                                                    │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │    │
│  │  │ widget-chat      │  │ refresh-sources  │  │ calendar-apis   │ │    │
│  │  │                  │  │                  │  │                 │ │    │
│  │  │ • AI Booking     │  │ • Cron Trigger   │  │ • Google OAuth  │ │    │
│  │  │   Tools          │  │ • Hash Detection │  │ • Outlook OAuth │ │    │
│  │  │ • Location       │  │ • AI Extraction  │  │ • Free/Busy API │ │    │
│  │  │   Routing        │  │ • Property Diff  │  │ • Create Event  │ │    │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘ │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                  │                                         │
│                                  ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │                        SUPABASE DATABASE                           │    │
│  │                                                                    │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │    │
│  │  │ knowledge_ │  │ locations  │  │ properties │  │ connected_ │  │    │
│  │  │ sources    │  │            │  │            │  │ accounts   │  │    │
│  │  │            │  │ • name     │  │ • address  │  │            │  │    │
│  │  │ • refresh_ │  │ • timezone │  │ • status   │  │ • provider │  │    │
│  │  │   strategy │  │ • hours    │  │ • price    │  │ • tokens   │  │    │
│  │  │ • content_ │  │ • patterns │  │ • beds     │  │ • location │  │    │
│  │  │   hash     │  │            │  │ • last_seen│  │            │  │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │    │
│  │                                                                    │    │
│  │  ┌────────────┐  ┌────────────┐                                   │    │
│  │  │ calendar_  │  │ conversa-  │                                   │    │
│  │  │ events     │  │ tions      │                                   │    │
│  │  │            │  │            │                                   │    │
│  │  │ • datetime │  │ • location_│                                   │    │
│  │  │ • visitor  │  │   id       │                                   │    │
│  │  │ • external │  │ • metadata │                                   │    │
│  │  └────────────┘  └────────────┘                                   │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │ OpenRouter AI   │    │ Google Calendar │    │ Microsoft Graph │        │
│  │                 │    │                 │    │                 │        │
│  │ • Property      │    │ • OAuth 2.0     │    │ • OAuth 2.0     │        │
│  │   Extraction    │    │ • Free/Busy API │    │ • Free/Busy API │        │
│  │ • Chat AI       │    │ • Events API    │    │ • Events API    │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Property Refresh

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cron      │────▶│   Fetch     │────▶│   Compare   │────▶│   Extract   │
│   Trigger   │     │   Content   │     │   Hash      │     │   Properties│
│   (hourly)  │     │   (Scraper) │     │   (SHA-256) │     │   (AI)      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                              │                    │
                                              │ (unchanged)        │ (changed)
                                              ▼                    ▼
                                        ┌─────────────┐     ┌─────────────┐
                                        │   Skip      │     │   Diff      │
                                        │   Update    │     │   Properties│
                                        └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │   Update    │
                                                            │   Database  │
                                                            └─────────────┘
```

### Data Flow: Booking

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│   AI        │────▶│   Detect    │────▶│   Check     │
│   Message   │     │   Processes │     │   Location  │     │   Calendar  │
│             │     │             │     │             │     │   Avail.    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │   Present   │
                                                            │   Time Slots│
                                                            └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │   User      │
                                                            │   Confirms  │
                                                            └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │   Create    │
                                                            │   Event     │
                                                            └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │   Send      │
                                                            │   Confirm   │
                                                            └─────────────┘
```

---

## Unified Data Sources Architecture

### Overview

The **Data Sources** tab is the single entry point for all agent data ingestion. It replaces the previous separate "Knowledge" and "Locations" tabs by unifying them under one intelligent system with auto-detection capabilities.

### Core Concept: One Input → Multiple Outputs

When a user adds any data source, the system automatically analyzes the content and routes it appropriately:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADD DATA SOURCE                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  User Input Options:                                                 │   │
│  │                                                                      │   │
│  │  [Connect WordPress]  [REST API / JSON]  [URL]  [Sitemap]  [Text]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    AUTO-DETECTION ENGINE                             │   │
│  │                                                                      │   │
│  │   Analyzes JSON structure for:                                       │   │
│  │   • LOCATION_SIGNALS: address, city, state, zip, timezone, hours    │   │
│  │   • PROPERTY_SIGNALS: beds, baths, price, sqft, status, features    │   │
│  │   • RELATIONSHIP_SIGNALS: community_id, location_id, parent refs    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                  ┌─────────────────┼─────────────────┐                     │
│                  ▼                 ▼                 ▼                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │   LOCATIONS      │  │   PROPERTIES     │  │   RAG CHUNKS     │        │
│  │   Table          │  │   Table          │  │   Table          │        │
│  │                  │  │                  │  │                  │        │
│  │ • Auto-created   │  │ • Auto-linked    │  │ • Embeddings     │        │
│  │ • Calendar-ready │  │   to location    │  │ • Semantic search│        │
│  │ • Business hours │  │ • AI-extracted   │  │ • Context for AI │        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tab Structure

The unified Data Sources tab contains four sections:

| Section | Description | Primary Use |
|---------|-------------|-------------|
| **Connected Sources** | WordPress sites, REST APIs, JSON feeds with sync status | Live data connections |
| **Locations** | Communities/properties with calendar connections inline | Booking & routing |
| **Properties** | Individual listings grouped by location | Availability queries |
| **Knowledge Sources** | URLs, sitemaps, documents (RAG-only) | AI context |

### Auto-Detection Signals

```typescript
const LOCATION_SIGNALS = [
  'address', 'street', 'city', 'state', 'zip', 'postal',
  'timezone', 'business_hours', 'hours', 'phone', 'email',
  'community', 'location', 'site', 'property_name'
];

const PROPERTY_SIGNALS = [
  'beds', 'bedrooms', 'baths', 'bathrooms', 'price', 'rent',
  'sqft', 'square_feet', 'lot', 'unit', 'status', 'available',
  'features', 'amenities', 'images', 'photos', 'year_built'
];

const RELATIONSHIP_SIGNALS = [
  'community_id', 'location_id', 'parent_id', 'site_id',
  'home_community', 'property_location'
];
```

### Benefits of Unified Architecture

1. **Simpler UX**: One tab instead of two, no mental model fragmentation
2. **Automatic Organization**: System routes data to correct tables
3. **Relationship Preservation**: Properties auto-link to locations
4. **Calendar-Ready**: Locations created with calendar connection slots
5. **RAG Integration**: All content feeds into AI knowledge base
6. **Single Sync Point**: One "Refresh" button updates everything

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
-- Already applied in Phase 2:
-- locations.wordpress_slug (TEXT)
-- locations.wordpress_community_id (INTEGER)

-- Planned for Phase 3:
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

### Smart Widget Detection

When widget loads, it detects location context:

```typescript
async function detectLocation(config: WidgetConfig): Promise<string | null> {
  // 1. Check explicit config (data-location attribute)
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
  
  // 4. Return null - AI will ask user via select_location tool
  return null;
}
```

---

## Phase 1: Living Data Sources Foundation ✅ COMPLETE

### Overview
Build the infrastructure for automatic knowledge source refreshing with intelligent change detection and AI-powered property extraction.

### Status: ✅ Complete

---

### 1.1 Database Schema Updates

#### 1.1.1 Modify `knowledge_sources` Table

Add the following columns to enable refresh functionality:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `source_type` | enum | `'url'` | Type of source: `url`, `sitemap`, `property_listings`, `property_feed` |
| `refresh_strategy` | enum | `'manual'` | Refresh frequency: `manual`, `hourly_1`, `hourly_2`, `hourly_3`, `hourly_4`, `hourly_6`, `hourly_12`, `daily` |
| `content_hash` | text | `null` | SHA-256 hash of content for change detection |
| `last_fetched_at` | timestamptz | `null` | Last successful fetch timestamp |
| `next_refresh_at` | timestamptz | `null` | Scheduled next refresh time |
| `default_location_id` | uuid | `null` | FK to locations table for property sources |
| `extraction_config` | jsonb | `'{}'` | Configuration for AI property extraction |

**Checklist:**
- [ ] Create migration file for `knowledge_sources` alterations
- [ ] Add `source_type` enum: `CREATE TYPE knowledge_source_type AS ENUM ('url', 'sitemap', 'property_listings', 'property_feed')`
- [ ] Add `refresh_strategy` enum: `CREATE TYPE refresh_strategy AS ENUM ('manual', 'hourly_1', 'hourly_2', 'hourly_3', 'hourly_4', 'hourly_6', 'hourly_12', 'daily')`
- [ ] Add columns with appropriate defaults
- [ ] Add foreign key constraint for `default_location_id` → `locations.id`
- [ ] Add index on `next_refresh_at` for efficient cron queries
- [ ] Update existing sources to have `source_type = 'url'` and `refresh_strategy = 'manual'`

#### 1.1.2 Create `locations` Table

Central table for community/location management:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `agent_id` | uuid | No | - | FK to agents table |
| `user_id` | uuid | No | - | Owner reference |
| `name` | text | No | - | Location display name (e.g., "Sunset Valley Community") |
| `address` | text | Yes | - | Street address |
| `city` | text | Yes | - | City |
| `state` | text | Yes | - | State/Province |
| `zip` | text | Yes | - | Postal code |
| `country` | text | Yes | `'US'` | Country code |
| `timezone` | text | No | `'America/New_York'` | IANA timezone |
| `phone` | text | Yes | - | Contact phone |
| `email` | text | Yes | - | Contact email |
| `business_hours` | jsonb | Yes | `'{}'` | Operating hours per day |
| `url_patterns` | text[] | Yes | `'{}'` | URL patterns for auto-detection |
| `metadata` | jsonb | Yes | `'{}'` | Additional location data |
| `is_active` | boolean | No | `true` | Whether location is active |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**Business Hours Schema:**
```json
{
  "monday": { "open": "09:00", "close": "17:00" },
  "tuesday": { "open": "09:00", "close": "17:00" },
  "wednesday": { "open": "09:00", "close": "17:00" },
  "thursday": { "open": "09:00", "close": "17:00" },
  "friday": { "open": "09:00", "close": "17:00" },
  "saturday": { "open": "10:00", "close": "14:00" },
  "sunday": null
}
```

**Checklist:**
- [ ] Create `locations` table with all columns
- [ ] Add foreign key to `agents` table
- [ ] Add RLS policies: owner and team members can CRUD
- [ ] Add index on `agent_id`
- [ ] Add index on `user_id`
- [ ] Create `updated_at` trigger
- [ ] Add TypeScript type to `src/types/index.ts`

#### 1.1.3 Create `properties` Table

Track individual property listings:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `knowledge_source_id` | uuid | No | - | FK to knowledge_sources |
| `location_id` | uuid | Yes | - | FK to locations |
| `agent_id` | uuid | No | - | FK to agents (denormalized for queries) |
| `external_id` | text | Yes | - | External listing ID from source |
| `address` | text | Yes | - | Property address |
| `lot_number` | text | Yes | - | Lot/unit number |
| `city` | text | Yes | - | City |
| `state` | text | Yes | - | State |
| `zip` | text | Yes | - | Postal code |
| `status` | enum | No | `'available'` | Property status |
| `price` | integer | Yes | - | Price in cents |
| `price_type` | enum | Yes | `'sale'` | `sale`, `rent_monthly`, `rent_weekly` |
| `beds` | integer | Yes | - | Number of bedrooms |
| `baths` | numeric(3,1) | Yes | - | Number of bathrooms |
| `sqft` | integer | Yes | - | Square footage |
| `year_built` | integer | Yes | - | Year built |
| `description` | text | Yes | - | Property description |
| `features` | text[] | Yes | `'{}'` | Feature list |
| `images` | jsonb | Yes | `'[]'` | Image URLs array |
| `listing_url` | text | Yes | - | Source listing URL |
| `first_seen_at` | timestamptz | No | `now()` | First time property was seen |
| `last_seen_at` | timestamptz | No | `now()` | Last time property was in source |
| `created_at` | timestamptz | No | `now()` | Record creation |
| `updated_at` | timestamptz | No | `now()` | Record update |

**Property Status Enum:**
```sql
CREATE TYPE property_status AS ENUM (
  'available',
  'pending',
  'sold',
  'rented',
  'off_market',
  'coming_soon'
);
```

**Checklist:**
- [ ] Create `property_status` enum
- [ ] Create `property_price_type` enum: `sale`, `rent_monthly`, `rent_weekly`
- [ ] Create `properties` table with all columns
- [ ] Add foreign keys with appropriate ON DELETE behavior
- [ ] Add RLS policies matching knowledge_sources access
- [ ] Add composite index on `(agent_id, status)` for availability queries
- [ ] Add index on `knowledge_source_id`
- [ ] Add index on `location_id`
- [ ] Add index on `external_id` for upsert operations
- [ ] Create `updated_at` trigger
- [ ] Add TypeScript type to `src/types/index.ts`

#### 1.1.4 Modify `conversations` Table

Add location context:

| Column | Type | Description |
|--------|------|-------------|
| `location_id` | uuid | FK to locations - set when location is identified |

**Checklist:**
- [ ] Add `location_id` column to `conversations`
- [ ] Add foreign key constraint
- [ ] Add index for location-based queries
- [ ] Update TypeScript types

---

### 1.2 Refresh Pipeline Edge Function

#### 1.2.1 Create `refresh-knowledge-sources` Edge Function

**File:** `supabase/functions/refresh-knowledge-sources/index.ts`

**Core Logic:**

```typescript
// Pseudocode structure
async function handler(req: Request) {
  // 1. Query sources due for refresh
  const sources = await supabase
    .from('knowledge_sources')
    .select('*')
    .lt('next_refresh_at', new Date().toISOString())
    .neq('refresh_strategy', 'manual')
    .limit(10); // Process in batches

  for (const source of sources) {
    try {
      // 2. Fetch content using existing scraper
      const content = await fetchContent(source.source);
      
      // 3. Calculate hash
      const newHash = await sha256(content);
      
      // 4. Compare with stored hash
      if (newHash === source.content_hash) {
        // Content unchanged - just update next_refresh_at
        await updateNextRefresh(source);
        continue;
      }
      
      // 5. Content changed - process based on source_type
      if (source.source_type === 'property_listings') {
        await extractAndDiffProperties(source, content);
      }
      
      // 6. Re-chunk and re-embed (for RAG)
      await rechunkAndEmbed(source, content);
      
      // 7. Update hash and timestamps
      await updateSourceAfterRefresh(source, newHash);
      
    } catch (error) {
      await logRefreshError(source, error);
    }
  }
}
```

**Checklist:**
- [ ] Create edge function directory structure
- [ ] Implement source query with `next_refresh_at` filter
- [ ] Implement content fetching using existing scraper (Readability)
- [ ] Implement SHA-256 hash calculation
- [ ] Implement hash comparison logic
- [ ] Implement `calculateNextRefresh()` based on strategy:
  - `hourly_1` → +1 hour
  - `hourly_2` → +2 hours
  - `hourly_3` → +3 hours
  - `hourly_4` → +4 hours
  - `hourly_6` → +6 hours
  - `hourly_12` → +12 hours
  - `daily` → +24 hours
- [ ] Implement error handling and logging
- [ ] Implement batch processing (10 sources per invocation)
- [ ] Add to `supabase/config.toml`
- [ ] Test with manual invocation

#### 1.2.2 AI Property Extraction

**Within refresh function, implement property extraction:**

```typescript
async function extractProperties(content: string, config: ExtractionConfig): Promise<Property[]> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a property listing extractor. Extract all property listings from the provided HTML content into structured JSON.`
        },
        {
          role: 'user',
          content: `Extract properties from this content:\n\n${content}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'extract_properties',
          description: 'Extract property listings from content',
          parameters: {
            type: 'object',
            properties: {
              properties: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    external_id: { type: 'string' },
                    address: { type: 'string' },
                    lot_number: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    price: { type: 'number' },
                    beds: { type: 'integer' },
                    baths: { type: 'number' },
                    sqft: { type: 'integer' },
                    year_built: { type: 'integer' },
                    description: { type: 'string' },
                    features: { type: 'array', items: { type: 'string' } },
                    images: { type: 'array', items: { type: 'string' } },
                    listing_url: { type: 'string' },
                    status: { type: 'string', enum: ['available', 'pending', 'sold'] }
                  },
                  required: ['address']
                }
              }
            },
            required: ['properties']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'extract_properties' } }
    })
  });
  
  // Parse tool call response
  const data = await response.json();
  return JSON.parse(data.choices[0].message.tool_calls[0].function.arguments).properties;
}
```

**Checklist:**
- [ ] Implement `extractProperties()` function
- [ ] Define extraction prompt with examples
- [ ] Use structured output via tool calling
- [ ] Handle extraction failures gracefully
- [ ] Add token usage logging for cost tracking

#### 1.2.3 Property Diffing Logic

```typescript
async function diffAndUpdateProperties(
  sourceId: string,
  locationId: string | null,
  agentId: string,
  newProperties: ExtractedProperty[]
): Promise<void> {
  // 1. Get existing properties for this source
  const { data: existing } = await supabase
    .from('properties')
    .select('*')
    .eq('knowledge_source_id', sourceId);
  
  const existingMap = new Map(existing?.map(p => [p.external_id || p.address, p]) || []);
  const seenIds = new Set<string>();
  
  for (const prop of newProperties) {
    const key = prop.external_id || prop.address;
    seenIds.add(key);
    
    const existingProp = existingMap.get(key);
    
    if (!existingProp) {
      // NEW property - insert
      await supabase.from('properties').insert({
        knowledge_source_id: sourceId,
        location_id: locationId,
        agent_id: agentId,
        ...prop,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      });
    } else {
      // EXISTING property - update if changed
      const hasChanges = detectPropertyChanges(existingProp, prop);
      if (hasChanges) {
        await supabase.from('properties').update({
          ...prop,
          last_seen_at: new Date().toISOString()
        }).eq('id', existingProp.id);
      } else {
        // Just update last_seen_at
        await supabase.from('properties').update({
          last_seen_at: new Date().toISOString()
        }).eq('id', existingProp.id);
      }
    }
  }
  
  // 3. Mark REMOVED properties as off_market
  for (const [key, prop] of existingMap) {
    if (!seenIds.has(key) && prop.status !== 'off_market') {
      await supabase.from('properties').update({
        status: 'off_market'
      }).eq('id', prop.id);
    }
  }
}
```

**Checklist:**
- [ ] Implement `diffAndUpdateProperties()` function
- [ ] Implement `detectPropertyChanges()` for field comparison
- [ ] Handle new property insertion
- [ ] Handle existing property updates
- [ ] Handle removed property marking (off_market)
- [ ] Add logging for diff operations
- [ ] Handle null external_id (fallback to address matching)

#### 1.2.4 Cron Job Setup

```sql
-- Schedule refresh function to run every hour
SELECT cron.schedule(
  'refresh-knowledge-sources',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/refresh-knowledge-sources',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**Checklist:**
- [ ] Verify `pg_cron` and `pg_net` extensions are enabled
- [ ] Create cron job using insert tool (not migration)
- [ ] Test cron execution
- [ ] Add monitoring for cron failures

---

### 1.3 Admin UI Updates

#### 1.3.1 Enhanced "Add Knowledge Source" Dialog

Update `AddKnowledgeDialog.tsx` to include:

**New Fields:**
- Source Type dropdown: URL, Sitemap, Property Listings, Property Feed
- Refresh Frequency dropdown (shown when source_type !== 'manual'):
  - Manual (no auto-refresh)
  - Every 1 hour
  - Every 2 hours
  - Every 3 hours
  - Every 4 hours
  - Every 6 hours
  - Every 12 hours
  - Daily (every 24 hours)
- Default Location dropdown (shown when source_type === 'property_listings'):
  - List of locations for this agent
  - "Create new location" option

**Checklist:**
- [ ] Add `source_type` select field
- [ ] Add `refresh_strategy` select field
- [ ] Add conditional rendering based on source_type
- [ ] Add `default_location_id` select field
- [ ] Create `useLocations` hook for fetching locations
- [ ] Update form submission to include new fields
- [ ] Add validation for required fields
- [ ] Update success/error handling

#### 1.3.2 Knowledge Source Card Updates

Update `KnowledgeSourceCard.tsx` to display:

- Refresh status indicator (next refresh time)
- Last fetched timestamp
- Source type badge
- Linked location (if property source)
- Property count (if property source)

**Checklist:**
- [ ] Add refresh status display
- [ ] Add last fetched timestamp
- [ ] Add source type badge
- [ ] Add location link for property sources
- [ ] Add property count fetch and display
- [ ] Add "Refresh Now" button for manual trigger
- [ ] Style updates for new information

---

### Phase 1 Completion Checklist

- [ ] All database migrations created and applied
- [ ] TypeScript types updated for new tables/columns
- [ ] `refresh-knowledge-sources` edge function deployed
- [ ] Cron job scheduled and verified
- [ ] Admin UI updated with new source configuration
- [ ] End-to-end test: Create property listings source → Wait for refresh → Verify properties extracted
- [ ] Documentation updated

---

## Phase 2: Locations & Calendar Integration 🔄 IN PROGRESS

### Overview
Build location management UI and OAuth calendar connections enabling appointment scheduling.

### Status: 🔄 In Progress

---

### 2.1 Locations Management UI

#### Completed ✅

- [x] `locations` table with all columns including `wordpress_slug` and `wordpress_community_id`
- [x] `AgentLocationsTab.tsx` component
- [x] `LocationList.tsx` component (left panel)
- [x] `LocationDetails.tsx` component (right panel)
- [x] `CreateLocationDialog.tsx` for create/edit
- [x] `BusinessHoursEditor.tsx` component
- [x] `useLocations` hook with CRUD operations
- [x] Location tab added to agent config
- [x] Empty state and loading states
- [x] Delete confirmation dialog

#### Removed (replaced by smart detection)

- ~~`UrlPatternsEditor.tsx` component~~ - Replaced by WordPress slug-based smart detection

#### Layout:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Locations                                              [+ Add]     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ LOCATION LIST       │  │ LOCATION DETAILS                    │  │
│  │                     │  │                                     │  │
│  │ ○ Sunset Valley    ←│  │ Name: Sunset Valley Community       │  │
│  │   12 properties     │  │ Address: 123 Main St, Austin TX     │  │
│  │   Last sync: 2h ago │  │ Timezone: America/Chicago           │  │
│  │                     │  │                                     │  │
│  │ ○ Mountain View     │  │ WordPress Slug: sunset-valley       │  │
│  │   8 properties      │  │ (for smart widget detection)        │  │
│  │   Last sync: 1h ago │  │                                     │  │
│  │                     │  │ ┌─────────────────────────────────┐ │  │
│  │ ○ Riverside Estates │  │ │ Business Hours                  │ │  │
│  │   15 properties     │  │ │ Mon-Fri: 9:00 AM - 5:00 PM      │ │  │
│  │   Last sync: 30m    │  │ │ Sat: 10:00 AM - 2:00 PM         │ │  │
│  │                     │  │ │ Sun: Closed                     │ │  │
│  │                     │  │ └─────────────────────────────────┘ │  │
│  │                     │  │                                     │  │
│  │                     │  │ ┌─────────────────────────────────┐ │  │
│  │                     │  │ │ Connected Calendars             │ │  │
│  │                     │  │ │                                 │ │  │
│  │                     │  │ │ 📅 Google: tours@sunset.com     │ │  │
│  │                     │  │ │    [Disconnect]                 │ │  │
│  │                     │  │ │                                 │ │  │
│  │                     │  │ │ [+ Connect Google Calendar]     │ │  │
│  │                     │  │ │ [+ Connect Outlook Calendar]    │ │  │
│  │                     │  │ └─────────────────────────────────┘ │  │
│  └─────────────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Create Location Dialog

**Fields:**
- Name (required)
- Address
- City
- State
- Zip
- Country (default: US)
- Timezone (dropdown with common timezones, default: America/New_York)
- Phone
- Email
- Business Hours (interactive editor)

**Checklist:**
- [ ] Create `CreateLocationDialog.tsx`
- [ ] Implement timezone dropdown with search
- [ ] Implement business hours editor with day toggles
- [ ] Add form validation
- [ ] Handle create mutation
- [ ] Success/error toast feedback

---

### 2.2 Calendar OAuth Integration

#### 2.2.1 Database: `connected_accounts` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `location_id` | uuid | No | - | FK to locations |
| `agent_id` | uuid | No | - | FK to agents |
| `user_id` | uuid | No | - | Owner reference |
| `provider` | enum | No | - | `google_calendar`, `outlook_calendar` |
| `account_email` | text | No | - | Connected account email |
| `access_token` | text | No | - | Encrypted OAuth access token |
| `refresh_token` | text | No | - | Encrypted OAuth refresh token |
| `token_expires_at` | timestamptz | Yes | - | Token expiration time |
| `calendar_id` | text | Yes | - | Specific calendar ID (if not primary) |
| `is_active` | boolean | No | `true` | Whether connection is active |
| `last_synced_at` | timestamptz | Yes | - | Last successful sync |
| `metadata` | jsonb | Yes | `'{}'` | Additional account data |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update |

**Checklist:**
- [ ] Create `calendar_provider` enum
- [ ] Create `connected_accounts` table
- [ ] Add RLS policies (owner/team access)
- [ ] Add unique constraint on `(location_id, provider, account_email)`
- [ ] Add TypeScript type

#### 2.2.2 Google Calendar OAuth Edge Function

**File:** `supabase/functions/google-calendar-auth/index.ts`

**Flow:**
1. **Initiate:** Generate OAuth URL with state parameter (location_id + agent_id)
2. **Callback:** Exchange code for tokens, store in `connected_accounts`
3. **Refresh:** Auto-refresh tokens before expiry

```typescript
// Endpoints:
// POST /initiate - Returns OAuth URL
// POST /callback - Handles OAuth callback, stores tokens
// POST /refresh - Refreshes expired tokens
```

**Required Secrets:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

**Checklist:**
- [ ] Add Google OAuth secrets to Supabase
- [ ] Create edge function with /initiate endpoint
- [ ] Implement OAuth URL generation with scopes:
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/calendar.events`
- [ ] Create /callback endpoint
- [ ] Implement token exchange
- [ ] Store tokens in `connected_accounts`
- [ ] Implement /refresh endpoint
- [ ] Add token refresh before expiry logic
- [ ] Handle disconnect/revoke
- [ ] Add to config.toml

#### 2.2.3 Microsoft Outlook OAuth Edge Function

**File:** `supabase/functions/outlook-calendar-auth/index.ts`

**Required Secrets:**
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_REDIRECT_URI`

**Checklist:**
- [ ] Add Microsoft OAuth secrets to Supabase
- [ ] Create edge function with /initiate endpoint
- [ ] Implement OAuth URL generation with scopes:
  - `Calendars.Read`
  - `Calendars.ReadWrite`
- [ ] Create /callback endpoint
- [ ] Implement token exchange
- [ ] Store tokens in `connected_accounts`
- [ ] Implement /refresh endpoint
- [ ] Handle disconnect/revoke
- [ ] Add to config.toml

#### 2.2.4 Calendar Connection UI

**In LocationDetails component:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Connected Calendars</CardTitle>
  </CardHeader>
  <CardContent>
    {connectedCalendars.map(calendar => (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {calendar.provider === 'google_calendar' ? <GoogleIcon /> : <OutlookIcon />}
          <span>{calendar.account_email}</span>
        </div>
        <Button variant="ghost" onClick={() => disconnect(calendar.id)}>
          Disconnect
        </Button>
      </div>
    ))}
    
    <div className="flex gap-2 mt-4">
      <Button onClick={connectGoogle}>
        <GoogleIcon className="mr-2" />
        Connect Google Calendar
      </Button>
      <Button onClick={connectOutlook}>
        <OutlookIcon className="mr-2" />
        Connect Outlook Calendar
      </Button>
    </div>
  </CardContent>
</Card>
```

**Checklist:**
- [ ] Create `CalendarConnections.tsx` component
- [ ] Implement connect button → opens OAuth popup
- [ ] Handle OAuth callback message
- [ ] Display connected accounts
- [ ] Implement disconnect functionality
- [ ] Show connection status/last sync
- [ ] Handle OAuth errors gracefully

---

### 2.3 Calendar Events Table

#### 2.3.1 Database: `calendar_events` Table

Local storage for bookings created through ChatPad:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `connected_account_id` | uuid | No | - | FK to connected_accounts |
| `location_id` | uuid | No | - | FK to locations |
| `conversation_id` | uuid | Yes | - | FK to conversations |
| `lead_id` | uuid | Yes | - | FK to leads |
| `external_event_id` | text | Yes | - | ID from Google/Outlook |
| `title` | text | No | - | Event title |
| `description` | text | Yes | - | Event description |
| `start_time` | timestamptz | No | - | Event start |
| `end_time` | timestamptz | No | - | Event end |
| `timezone` | text | No | - | Event timezone |
| `visitor_name` | text | Yes | - | Visitor name |
| `visitor_email` | text | Yes | - | Visitor email |
| `visitor_phone` | text | Yes | - | Visitor phone |
| `status` | enum | No | `'confirmed'` | `confirmed`, `cancelled`, `completed`, `no_show` |
| `notes` | text | Yes | - | Internal notes |
| `metadata` | jsonb | Yes | `'{}'` | Additional event data |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update |

**Checklist:**
- [ ] Create `calendar_event_status` enum
- [ ] Create `calendar_events` table
- [ ] Add foreign keys
- [ ] Add RLS policies
- [ ] Add index on `(location_id, start_time)`
- [ ] Add TypeScript type

---

### Phase 2 Completion Checklist

- [x] Locations table created with `wordpress_slug` and `wordpress_community_id` columns
- [x] Locations management UI complete (LocationList, LocationDetails, CreateLocationDialog)
- [x] BusinessHoursEditor component complete
- [x] CalendarConnections component complete
- [x] Google Calendar OAuth edge function created
- [x] Outlook Calendar OAuth edge function created
- [ ] End-to-end calendar OAuth testing
- [ ] Calendar events table created
- [ ] Connected accounts display with disconnect functionality
- [ ] Documentation updated

---

## Phase 3: WordPress Site Connector

### Overview
Enable automatic import of communities from WordPress sites using the REST API.

### Status: 🔜 Next

---

### 3.1 WordPress Configuration UI

Add WordPress connection card to Locations tab header:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🌐 WordPress Connection                                              │
│                                                                      │
│ Site URL: https://example.com                    [Test] [Sync]      │
│ Last synced: 2 hours ago • 20 communities, 245 homes                │
└─────────────────────────────────────────────────────────────────────┘
```

**Checklist:**
- [ ] Add WordPress config section to AgentLocationsTab
- [ ] Create WordPress URL input field
- [ ] Create "Test Connection" button (validates `/wp-json/wp/v2/community` exists)
- [ ] Create "Import Communities" button
- [ ] Display sync status and counts
- [ ] Store config in `agents.deployment_config.wordpress`

### 3.2 Edge Function: sync-wordpress-communities

**File:** `supabase/functions/sync-wordpress-communities/index.ts`

```typescript
// Pseudocode
async function handler(req: Request) {
  const { agentId } = await req.json();
  
  // 1. Get WordPress config from agent
  const agent = await getAgent(agentId);
  const wpConfig = agent.deployment_config?.wordpress;
  
  // 2. Fetch communities from WP REST API
  const communities = await fetch(
    `${wpConfig.site_url}/wp-json/wp/v2/community?per_page=100&_embed`
  ).then(r => r.json());
  
  // 3. For each community, create/update Location
  for (const community of communities) {
    await supabase.from('locations').upsert({
      agent_id: agentId,
      user_id: agent.user_id,
      name: community.title.rendered,
      wordpress_slug: community.slug,
      wordpress_community_id: community.id,
      address: community.acf?.community_address,
      city: community.acf?.community_city,
      state: community.acf?.community_state,
      zip: community.acf?.community_zip,
      phone: community.acf?.community_phone,
      email: community.acf?.community_email,
    }, {
      onConflict: 'agent_id,wordpress_community_id'
    });
  }
  
  // 4. Update last sync timestamp
  await updateAgentWordPressConfig(agentId, {
    last_community_sync: new Date().toISOString()
  });
}
```

**Checklist:**
- [ ] Create edge function directory
- [ ] Implement WordPress REST API fetching
- [ ] Implement Location upsert logic
- [ ] Handle ACF field mapping
- [ ] Add error handling for API failures
- [ ] Add to config.toml

### Phase 3 Completion Checklist

- [ ] WordPress connection UI in Locations tab
- [ ] Test connection functionality
- [ ] sync-wordpress-communities edge function deployed
- [ ] Communities auto-import to Locations table
- [ ] Sync status display with timestamps
- [ ] Error handling for invalid WordPress URLs

---

## Phase 4: Home/Property Sync

### Overview
Sync home/property listings from WordPress to the properties table with location linking.

### Status: ✅ Complete

---

### 4.1 Edge Function: sync-wordpress-homes

**File:** `supabase/functions/sync-wordpress-homes/index.ts`

**Implemented Features:**
- Test endpoint to verify WordPress has homes/properties REST API
- Full sync with pagination (fetches all homes)
- Auto-detection of multiple endpoint types (home, homes, property, properties)
- ACF field mapping for structured data (price, beds, baths, sqft, etc.)
- AI extraction fallback for non-ACF WordPress sites (using OpenRouter)
- Location linking via `home_community` taxonomy → `location_id`
- Auto-creation of WordPress knowledge source per agent
- Image extraction from featured media and ACF gallery fields
- Status mapping (available, pending, sold, rented, coming_soon)
- Price parsing with cents conversion

### 4.2 Database Updates

```sql
-- Add wordpress_home to knowledge_source_type enum
ALTER TYPE knowledge_source_type ADD VALUE IF NOT EXISTS 'wordpress_home';

-- Unique constraint for upserts
CREATE UNIQUE INDEX properties_source_external_unique 
ON properties (knowledge_source_id, external_id) 
WHERE external_id IS NOT NULL;
```

### 4.3 React Components

**WordPressHomesCard** (`src/components/agents/locations/WordPressHomesCard.tsx`):
- Displays home sync status and count
- Test endpoint button
- Sync homes button with progress
- AI extraction toggle (uses OpenRouter for non-ACF sites)
- Only visible when WordPress is connected

**useWordPressHomes Hook** (`src/hooks/useWordPressHomes.ts`):
- `testHomesEndpoint()` - Test if WordPress has homes API
- `syncHomes()` - Trigger full sync
- State management for testing/syncing status

### Phase 4 Completion Checklist

- [x] sync-wordpress-homes edge function deployed
- [x] Homes linked to correct Locations via taxonomy
- [x] Properties populated with price, beds, baths, images
- [x] Last sync timestamps updated
- [x] AI extraction fallback for non-ACF WordPress sites
- [x] WordPressHomesCard UI component
- [x] useWordPressHomes hook
- [x] Database unique constraint for upserts
- [ ] Scheduled sync support (future enhancement)

---

## Phase 5: Smart Widget Detection

### Overview
Enable the widget to automatically detect user's location context based on URL and WordPress taxonomy.

### Status: 🔜 Planned

---

### 5.1 Widget Location Detection

Update widget initialization to detect location:

```typescript
// In ChatWidget.tsx or parent initialization
const detectedLocationSlug = await detectLocation({
  locationSlug: config.dataLocation, // Explicit embed attribute
  wordpressSiteUrl: config.wordpressSiteUrl,
});

if (detectedLocationSlug) {
  // Fetch location_id from database
  const location = await supabase
    .from('locations')
    .select('id')
    .eq('agent_id', agentId)
    .eq('wordpress_slug', detectedLocationSlug)
    .single();
  
  // Store on conversation
  setLocationId(location.id);
}
```

### 5.2 AI Fallback: select_location Tool

When location cannot be auto-detected, AI asks user:

```typescript
{
  name: 'select_location',
  description: 'Present location options when cannot auto-detect. Use when user needs to choose a community.',
  parameters: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Question to ask user' }
    }
  }
}
```

Widget renders location picker buttons when tool is called.

### 5.3 Embed Configuration

```html
<!-- Explicit location (recommended for single-location pages) -->
<script
  src="https://app.chatpad.ai/widget.js"
  data-agent-id="abc123"
  data-location="forge-at-the-lake"
></script>

<!-- Auto-detect from URL (for multi-location sites) -->
<script
  src="https://app.chatpad.ai/widget.js"
  data-agent-id="abc123"
  data-wordpress-site="https://example.com"
></script>
```

**Checklist:**
- [ ] Add detectLocation function to widget
- [ ] Implement URL path parsing (/community/{slug}/, /home/{slug}/)
- [ ] Implement WordPress API fallback for home→community lookup
- [ ] Add select_location AI tool to widget-chat
- [ ] Create location picker UI component in widget
- [ ] Update embed settings to include WordPress site URL
- [ ] Store location_id on conversation metadata

### Phase 5 Completion Checklist

- [ ] Widget auto-detects location from URL
- [ ] WordPress home→community lookup working
- [ ] AI fallback presents location picker
- [ ] Conversation stores detected location_id
- [ ] Embed config supports data-location and data-wordpress-site

---

## Phase 6: AI Booking Tools

### Overview
Extend widget-chat with built-in tools for property search, calendar availability, and appointment booking.

### Status: ✅ Complete

---

### 6.1 Built-in AI Tools

#### 6.1.1 Tool Definitions

Add to `widget-chat/index.ts`:

```typescript
const BOOKING_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_properties',
      description: 'Search for available properties/homes. Use when user asks about available units, homes for sale/rent, or property listings.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City to search in' },
          state: { type: 'string', description: 'State to search in' },
          min_price: { type: 'number', description: 'Minimum price' },
          max_price: { type: 'number', description: 'Maximum price' },
          min_beds: { type: 'integer', description: 'Minimum bedrooms' },
          status: { 
            type: 'string', 
            enum: ['available', 'pending', 'all'],
            description: 'Property status filter'
          },
          location_id: { type: 'string', description: 'Specific location/community ID' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'lookup_property',
      description: 'Get details for a specific property by address or ID. Use when user asks about a specific home.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Property address' },
          property_id: { type: 'string', description: 'Property ID' },
          lot_number: { type: 'string', description: 'Lot number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_locations',
      description: 'Get list of communities/locations. Use when user needs to choose a location or asks about communities.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_calendar_availability',
      description: 'Check available appointment times for tours/viewings. Use when user wants to schedule a visit.',
      parameters: {
        type: 'object',
        properties: {
          location_id: { type: 'string', description: 'Location ID for the appointment' },
          date_from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          duration_minutes: { type: 'integer', description: 'Appointment duration in minutes', default: 30 }
        },
        required: ['location_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Book a tour/appointment. Use after user confirms a time slot.',
      parameters: {
        type: 'object',
        properties: {
          location_id: { type: 'string', description: 'Location ID' },
          start_time: { type: 'string', description: 'Appointment start (ISO 8601)' },
          end_time: { type: 'string', description: 'Appointment end (ISO 8601)' },
          visitor_name: { type: 'string', description: 'Visitor full name' },
          visitor_email: { type: 'string', description: 'Visitor email' },
          visitor_phone: { type: 'string', description: 'Visitor phone' },
          property_address: { type: 'string', description: 'Property to view (if specific)' },
          notes: { type: 'string', description: 'Additional notes' }
        },
        required: ['location_id', 'start_time', 'visitor_name']
      }
    }
  }
];
```

**Checklist:**
- [ ] Define `search_properties` tool schema
- [ ] Define `lookup_property` tool schema
- [ ] Define `get_locations` tool schema
- [ ] Define `check_calendar_availability` tool schema
- [ ] Define `book_appointment` tool schema
- [ ] Add tools to widget-chat tool array
- [ ] Conditionally include tools only for agents with locations configured

#### 6.1.2 Tool Handlers in widget-chat

```typescript
async function handleToolCall(toolName: string, args: any, agentId: string, conversationId: string) {
  switch (toolName) {
    case 'search_properties':
      return await searchProperties(agentId, args);
    
    case 'lookup_property':
      // Also sets location context on conversation
      return await lookupProperty(agentId, conversationId, args);
    
    case 'get_locations':
      return await getLocations(agentId);
    
    case 'check_calendar_availability':
      return await checkCalendarAvailability(args.location_id, args);
    
    case 'book_appointment':
      return await bookAppointment(args.location_id, conversationId, args);
    
    default:
      // Handle custom tools...
  }
}
```

**Checklist:**
- [ ] Implement `searchProperties()` - query properties table with filters
- [ ] Implement `lookupProperty()` - get property details, set conversation location
- [ ] Implement `getLocations()` - list agent's locations
- [ ] Implement `checkCalendarAvailability()` - call calendar API edge function
- [ ] Implement `bookAppointment()` - call booking edge function
- [ ] Add error handling for each tool
- [ ] Format tool results for AI consumption

---

### 6.2 Calendar Availability Edge Function

**File:** `supabase/functions/check-calendar-availability/index.ts`

**Input:**
```typescript
interface AvailabilityRequest {
  location_id: string;
  date_from: string;  // YYYY-MM-DD
  date_to: string;    // YYYY-MM-DD
  duration_minutes: number;
}
```

**Logic:**
1. Get connected calendar for location
2. Refresh token if needed
3. Query Google/Outlook free/busy API
4. Get location business hours
5. Generate available slots within business hours, excluding busy times

**Output:**
```typescript
interface AvailabilityResponse {
  location: {
    id: string;
    name: string;
    timezone: string;
  };
  available_slots: Array<{
    start: string;  // ISO 8601
    end: string;
    formatted: string;  // "Tuesday, Jan 15 at 2:00 PM"
  }>;
}
```

**Checklist:**
- [ ] Create edge function
- [ ] Implement token refresh logic
- [ ] Implement Google Calendar free/busy API call
- [ ] Implement Outlook Calendar free/busy API call
- [ ] Parse business hours from location
- [ ] Generate slot intervals
- [ ] Filter out busy times
- [ ] Format response for AI
- [ ] Add timezone handling
- [ ] Handle no calendar connected case
- [ ] Add to config.toml

---

### 6.3 Booking Edge Function

**File:** `supabase/functions/book-appointment/index.ts`

**Input:**
```typescript
interface BookingRequest {
  location_id: string;
  conversation_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  visitor_name: string;
  visitor_email?: string;
  visitor_phone?: string;
  property_address?: string;
  notes?: string;
}
```

**Logic:**
1. Validate time slot is still available (re-check)
2. Get connected calendar for location
3. Create event on Google/Outlook calendar
4. Store booking in `calendar_events` table
5. Link to conversation and lead if available
6. Trigger webhook event for booking
7. Return confirmation

**Output:**
```typescript
interface BookingResponse {
  success: boolean;
  booking: {
    id: string;
    start_time: string;
    end_time: string;
    location_name: string;
    confirmation_message: string;
  };
}
```

**Checklist:**
- [ ] Create edge function
- [ ] Implement availability re-check
- [ ] Implement Google Calendar event creation
- [ ] Implement Outlook Calendar event creation
- [ ] Store in `calendar_events` table
- [ ] Link to conversation/lead
- [ ] Trigger `booking.created` webhook
- [ ] Generate confirmation message
- [ ] Handle double-booking gracefully
- [ ] Add to config.toml

---

### Phase 6 Completion Checklist

- [x] All 5 booking tools defined and implemented
- [x] Calendar availability edge function deployed
- [x] Booking edge function deployed
- [x] Widget embed supports location-id
- [x] End-to-end test: Chat → Search properties → Check availability → Book appointment
- [x] Booking appears on connected calendar
- [x] Webhook fires on booking
- [x] Documentation updated

---

## Phase 7: Polish & Optimization

### Overview
Production hardening, monitoring, and UX enhancements.

### Status: ✅ Complete

---

### 7.1 Webhook Events for Bookings ✅

Added new webhook event types:

| Event | Trigger | Payload |
|-------|---------|---------|
| `booking.created` | New appointment booked | booking details, visitor info, location |
| `booking.cancelled` | Appointment cancelled | booking id, old/new status |
| `booking.completed` | Appointment completed | booking details |
| `property.status_changed` | Property status updated | property details, old/new status |
| `property.new_listing` | New property discovered | property details |

**Implemented:**
- [x] Add booking webhook events to dispatch-webhook-event
- [x] Add property webhook events  
- [x] Update webhook event type enum in UI (CreateWebhookDialog, EditWebhookDialog)
- [x] Test webhook delivery for each event
- [x] Document webhook payloads

---

### 7.2 Admin Calendar View ✅

Created `useCalendarEvents` hook to fetch real calendar_events from database:
- Fetches calendar_events with location joins
- Real-time subscription for live updates
- Cancel/complete/reschedule mutation functions
- Transforms database records to CalendarEvent format

**Implemented:**
- [x] Create useCalendarEvents hook
- [x] Fetch bookings from `calendar_events`
- [x] Real-time subscription support
- [x] Cancel action
- [x] Complete action
- [x] Reschedule action
- [x] Integration with existing calendar components

---

### 7.3 Property Status in Chat ✅

Enhanced AI responses with real-time property status and recency detection:

```typescript
// In lookup_property tool response
{
  "address": "123 Oak Lane, Lot 42",
  "status": "pending",
  "status_message": "This home just went under contract yesterday.",
  "suggest_alternatives": true
}
```

**Implemented:**
- [x] Add status messaging logic with recency detection
- [x] Calculate "just sold/pending" timeframes (uses updated_at field)
- [x] Suggest alternatives flag for unavailable properties
- [x] Enhanced status messages for sold/pending/unavailable

---

### 7.4 Multi-Timezone Support ✅

All times display correctly with timezone handling:
- Times stored in UTC in database
- Display in location's timezone with timezone abbreviation
- AI responses include timezone in availability messages

**Verified:**
- [x] Audit all timestamp handling
- [x] Ensure UTC storage
- [x] Implement display timezone conversion
- [x] Add timezone to AI tool responses

---

### 7.5 Error Handling & Monitoring ✅

**Implemented robust error handling:**

check-calendar-availability:
- No connected calendar → graceful fallback with contact phone
- Returns `has_calendar: false` and `fallback_action: 'contact_directly'`

book-appointment:
- Slot no longer available → `slot_taken` error with suggestion to show other times
- No calendar connected → `no_calendar` error with contact phone fallback

**Implemented:**
- [x] Add error handling for all edge functions
- [x] Implement graceful fallback messages with suggestions
- [x] Include contact phone in fallback responses
- [x] Add logging for monitoring

---

### Phase 7 Completion Checklist

- [x] Webhook events for bookings implemented (booking.created, booking.cancelled, booking.completed)
- [x] Webhook events for properties implemented (property.new_listing, property.status_changed)
- [x] useCalendarEvents hook for admin calendar view
- [x] Property status messaging with recency detection
- [x] Multi-timezone handling verified
- [x] Error handling with graceful fallbacks
- [x] Documentation complete

---

## Cost Analysis

### Refresh Pipeline Costs (per month)

| Component | Calculation | Cost |
|-----------|-------------|------|
| **AI Extraction** | 200 clients × 5 sources × 24 refreshes × $0.001 | ~$24 |
| **Embeddings** | Only on content change (~20%) × 200 × 5 × 24 × $0.0001 | ~$2.40 |
| **Edge Function Compute** | Minimal - covered by Supabase plan | $0 |
| **Total Refresh** | | **~$26/month** |

### Booking Costs (per booking)

| Component | Cost |
|-----------|------|
| AI tool calling | ~$0.0002 |
| Calendar API | Free |
| Edge function | Minimal |
| **Total per booking** | **~$0.0003** |

### Summary

| Scenario | Monthly Cost |
|----------|--------------|
| 200 clients, hourly refresh | ~$26 |
| 200 clients, 6-hour refresh | ~$8 |
| 1000 bookings | ~$0.30 |
| **Typical total** | **$25-50** |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Calendar OAuth token expiry | Bookings fail | Auto-refresh tokens, notify on persistent failure |
| Property extraction inaccuracy | Wrong listings | Human review option, feedback loop |
| Calendar API rate limits | Availability check fails | Caching, backoff strategy |
| Stale property data | User frustration | Hash-based refresh ensures freshness |
| Multi-timezone confusion | Wrong appointment times | UTC storage, explicit timezone display |
| Double-booking | Scheduling conflicts | Re-check availability before confirm |

---

## Success Metrics

### Technical Metrics
- [ ] Refresh success rate > 99%
- [ ] Property extraction accuracy > 95%
- [ ] Calendar API latency < 500ms
- [ ] Booking completion rate > 90%

### Business Metrics
- [ ] Reduction in manual booking time
- [ ] Increase in tour bookings
- [ ] Property listing freshness (< 1 hour stale)
- [ ] User satisfaction with AI booking flow

---

## Related Documentation

- [AI Architecture](./AI_ARCHITECTURE.md) - AI system integration
- [Database Schema](./DATABASE_SCHEMA.md) - Full database reference
- [Multi-Account Integrations](./MULTI_ACCOUNT_INTEGRATIONS.md) - Multi-location patterns
- [Edge Functions](./EDGE_FUNCTIONS.md) - API reference
- [Webhook System](./WEBHOOKS.md) - Event delivery

---

## Appendix: Database Migration Scripts

### Migration 1: Knowledge Sources Updates
```sql
-- Add refresh fields to knowledge_sources
CREATE TYPE knowledge_source_type AS ENUM ('url', 'sitemap', 'property_listings', 'property_feed');
CREATE TYPE refresh_strategy AS ENUM ('manual', 'hourly_1', 'hourly_2', 'hourly_3', 'hourly_4', 'hourly_6', 'hourly_12', 'daily');

ALTER TABLE knowledge_sources
ADD COLUMN source_type knowledge_source_type DEFAULT 'url',
ADD COLUMN refresh_strategy refresh_strategy DEFAULT 'manual',
ADD COLUMN content_hash text,
ADD COLUMN last_fetched_at timestamptz,
ADD COLUMN next_refresh_at timestamptz,
ADD COLUMN default_location_id uuid REFERENCES locations(id),
ADD COLUMN extraction_config jsonb DEFAULT '{}';

CREATE INDEX idx_knowledge_sources_next_refresh ON knowledge_sources(next_refresh_at) WHERE refresh_strategy != 'manual';
```

### Migration 2: Locations Table
```sql
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  city text,
  state text,
  zip text,
  country text DEFAULT 'US',
  timezone text NOT NULL DEFAULT 'America/New_York',
  phone text,
  email text,
  business_hours jsonb DEFAULT '{}',
  url_patterns text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible locations"
ON locations FOR SELECT USING (has_account_access(user_id));

CREATE POLICY "Users can create locations for their agents"
ON locations FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM agents WHERE id = locations.agent_id AND has_account_access(agents.user_id))
);

CREATE POLICY "Users can update accessible locations"
ON locations FOR UPDATE USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible locations"
ON locations FOR DELETE USING (has_account_access(user_id));

-- Indexes
CREATE INDEX idx_locations_agent ON locations(agent_id);
CREATE INDEX idx_locations_user ON locations(user_id);

-- Updated_at trigger
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration 3: Properties Table
```sql
CREATE TYPE property_status AS ENUM ('available', 'pending', 'sold', 'rented', 'off_market', 'coming_soon');
CREATE TYPE property_price_type AS ENUM ('sale', 'rent_monthly', 'rent_weekly');

CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  external_id text,
  address text,
  lot_number text,
  city text,
  state text,
  zip text,
  status property_status NOT NULL DEFAULT 'available',
  price integer,
  price_type property_price_type DEFAULT 'sale',
  beds integer,
  baths numeric(3,1),
  sqft integer,
  year_built integer,
  description text,
  features text[] DEFAULT '{}',
  images jsonb DEFAULT '[]',
  listing_url text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible properties"
ON properties FOR SELECT USING (
  EXISTS (SELECT 1 FROM agents WHERE id = properties.agent_id AND has_account_access(agents.user_id))
);

-- Indexes
CREATE INDEX idx_properties_agent_status ON properties(agent_id, status);
CREATE INDEX idx_properties_source ON properties(knowledge_source_id);
CREATE INDEX idx_properties_location ON properties(location_id);
CREATE INDEX idx_properties_external ON properties(external_id);

-- Updated_at trigger
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration 4: Connected Accounts Table
```sql
CREATE TYPE calendar_provider AS ENUM ('google_calendar', 'outlook_calendar');

CREATE TABLE connected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  provider calendar_provider NOT NULL,
  account_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz,
  calendar_id text,
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, provider, account_email)
);

-- RLS policies
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible connected accounts"
ON connected_accounts FOR SELECT USING (has_account_access(user_id));

CREATE POLICY "Users can create connected accounts for accessible locations"
ON connected_accounts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM locations WHERE id = connected_accounts.location_id AND has_account_access(locations.user_id))
);

CREATE POLICY "Users can update accessible connected accounts"
ON connected_accounts FOR UPDATE USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible connected accounts"
ON connected_accounts FOR DELETE USING (has_account_access(user_id));

-- Indexes
CREATE INDEX idx_connected_accounts_location ON connected_accounts(location_id);

-- Updated_at trigger
CREATE TRIGGER update_connected_accounts_updated_at
BEFORE UPDATE ON connected_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration 5: Calendar Events Table
```sql
CREATE TYPE calendar_event_status AS ENUM ('confirmed', 'cancelled', 'completed', 'no_show');

CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  external_event_id text,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  timezone text NOT NULL,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  status calendar_event_status NOT NULL DEFAULT 'confirmed',
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible calendar events"
ON calendar_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM locations WHERE id = calendar_events.location_id AND has_account_access(locations.user_id))
);

CREATE POLICY "Users can create calendar events for accessible locations"
ON calendar_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM locations WHERE id = calendar_events.location_id AND has_account_access(locations.user_id))
);

CREATE POLICY "Users can update accessible calendar events"
ON calendar_events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM locations WHERE id = calendar_events.location_id AND has_account_access(locations.user_id))
);

-- Indexes
CREATE INDEX idx_calendar_events_location_time ON calendar_events(location_id, start_time);
CREATE INDEX idx_calendar_events_conversation ON calendar_events(conversation_id);

-- Updated_at trigger
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration 6: Conversations Location Link
```sql
ALTER TABLE conversations
ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX idx_conversations_location ON conversations(location_id);
```

---

*Document Version: 1.0*  
*Created: December 2024*  
*Maintainer: ChatPad Engineering*
