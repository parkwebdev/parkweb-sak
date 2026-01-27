
# Plan: Intelligent WordPress Endpoint Discovery & Mapping

## Problem Statement

Currently, when connecting a WordPress site, the system assumes hardcoded endpoint slugs (`/wp-json/wp/v2/community` and `/wp-json/wp/v2/home`). But WordPress sites use different custom post type slugs like:
- `/wp-json/wp/v2/agency` instead of `/wp-json/wp/v2/community`
- `/wp-json/wp/v2/listings` instead of `/wp-json/wp/v2/home`

The existing endpoint discovery feature is buried in "Advanced Settings" and requires users to manually configure endpoints after connection fails.

## Solution Overview

Redesign the WordPress connection flow to:
1. **Auto-discover endpoints on URL entry** (not hidden in advanced settings)
2. **Present discovered endpoints for user mapping** before first sync
3. **Allow users to explicitly map** which endpoint = Communities and which = Properties
4. **Remember and display current mappings** clearly

## User Experience Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Enter WordPress URL                                   │
│  ┌─────────────────────────────────┐ ┌──────────┐               │
│  │ https://yoursite.com            │ │ Connect  │               │
│  └─────────────────────────────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Discovering API endpoints... (auto-triggered)         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⟳ Scanning for custom post types...                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Map Endpoints (new UI section - not hidden)           │
│                                                                 │
│  We found 4 custom post types. Map them to your data:          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🏘️ COMMUNITIES (locations/parks)                          │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │  ○ agency (23 items) - High confidence ✓           │   │  │
│  │ │  ○ parks (5 items)                                 │   │  │
│  │ │  ○ None - don't sync communities                   │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🏠 PROPERTIES (homes/listings)                            │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │  ○ listings (147 items) - High confidence ✓        │   │  │
│  │ │  ○ units (12 items)                                │   │  │
│  │ │  ○ None - don't sync properties                    │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                    ┌────────────────────────┐   │
│                                    │ Save & Start Sync      │   │
│                                    └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Phase 1: Update Connection Flow

#### 1.1 Modify `WordPressIntegrationSheet.tsx`

**Current flow:**
```
Enter URL → Test Connection → Auto-import with hardcoded endpoints
```

**New flow:**
```
Enter URL → Discover Endpoints → Show Mapping UI → User confirms → Save config → Sync
```

**Key changes:**
- Add new state: `connectionStep: 'url' | 'discovering' | 'mapping' | 'connected'`
- Auto-trigger `discoverEndpoints()` when user enters valid URL
- Add new `EndpointMappingSection` component
- Change "Connect" button to trigger discovery, not immediate sync

#### 1.2 Create `WordPressEndpointMapper.tsx` Component

```tsx
interface WordPressEndpointMapperProps {
  discoveredEndpoints: DiscoveredEndpoints;
  selectedCommunityEndpoint: string | null;
  selectedPropertyEndpoint: string | null;
  onCommunitySelect: (endpoint: string | null) => void;
  onPropertySelect: (endpoint: string | null) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}
```

**Features:**
- Radio button selection for each category (Communities, Properties)
- Shows post count and confidence signals for each endpoint
- "None" option to skip syncing a category
- Pre-selects highest-confidence endpoints automatically
- Allow same endpoint to be used for both (with warning)

#### 1.3 Update `useWordPressConnection.ts` Hook

**Add new function:**
```tsx
const connectWithDiscovery = useCallback(async (url: string): Promise<{
  success: boolean;
  endpoints: DiscoveredEndpoints | null;
  error?: string;
}> => {
  // 1. Normalize URL
  // 2. Save URL to config  
  // 3. Discover endpoints
  // 4. Return discovered endpoints for UI to display
}, []);
```

**Update return value to include:**
- `connectionStep` state
- `setConnectionStep` setter
- `connectWithDiscovery` function

### Phase 2: Update Edge Function Response

#### 2.1 Modify `sync-wordpress-communities/index.ts`

Update `discoverEndpoints()` to also return:
- Whether ACF plugin is detected
- Sample field names found (helps user understand data structure)

**Add new action `connect` that combines:**
1. URL validation
2. Endpoint discovery
3. Returns structured response for UI

### Phase 3: Update Connected State UI

#### 3.1 Show Current Mappings Prominently

When connected, display:
```
Communities: /wp-json/wp/v2/agency (23 items)
Properties: /wp-json/wp/v2/listings (147 items)
[Re-scan Endpoints] [Edit Mappings]
```

#### 3.2 Allow Re-mapping Without Disconnecting

Add "Change Mappings" button that returns to mapping UI without losing data.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/agents/locations/WordPressIntegrationSheet.tsx` | Add multi-step connection flow with mapping UI |
| `src/components/agents/locations/WordPressEndpointMapper.tsx` | **NEW** - Endpoint selection component |
| `src/components/agents/locations/WordPressIntegrationSection.tsx` | Add same mapping flow (alternative UI location) |
| `src/hooks/useWordPressConnection.ts` | Add `connectionStep` state, `connectWithDiscovery()` function |
| `supabase/functions/sync-wordpress-communities/index.ts` | Add `connect` action combining validation + discovery |

## Edge Cases Handled

1. **No custom post types found**: Show message suggesting manual endpoint input
2. **Only one type found**: Auto-select it for whichever category matches
3. **Site doesn't have REST API enabled**: Clear error message
4. **Endpoints change after initial sync**: "Re-scan" button detects changes
5. **User selects same endpoint for both**: Warning but allow it

## Backward Compatibility

- Existing connected sites continue to work with their saved `community_endpoint` and `home_endpoint`
- Discovery only triggers on new connections or explicit "Re-scan"
- No data migration needed - just UI/flow changes

## Summary

This change moves endpoint discovery from a hidden "Advanced Settings" feature to the **primary connection flow**, making the WordPress integration work with any WordPress site regardless of custom post type naming conventions.
