
# Plan: WordPress Field Mapping System

## Problem Statement

After a user selects **which** WordPress endpoint to sync (e.g., `/agency` → Communities, `/listings` → Properties), they still have no control over **how** the fields from that endpoint map to your data model.

Currently, the system uses "intelligent guessing" via `extractAcfField()` which searches for keywords like:
- Looking for "city" finds `community_city`, `property_city`, `city`, etc.
- Looking for "phone" finds `phone_number`, `telephone`, `community_phone`, etc.

**The problem**: A WordPress site might have:
- `park_title` instead of `name`
- `street_location` instead of `address`
- `contact_number` instead of `phone`
- `lot_rent_price` instead of `price`

The guessing fails, and users have no way to fix it.

## Solution Overview

Add a **Step 4: Field Mapping** to the WordPress connection flow that:
1. Fetches a sample post from the selected endpoint
2. Extracts all available field names (ACF + standard WP fields)
3. Displays a mapping UI where users select which source field → which destination field
4. Saves the mapping configuration
5. Uses the saved mappings during sync instead of keyword guessing

## User Experience Flow

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  After Endpoint Selection, NEW Step 4: Configure Field Mappings                │
│                                                                                 │
│  We found these fields in your "agency" endpoint. Map them to your data:       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ COMMUNITY FIELDS                                                        │    │
│  │                                                                         │    │
│  │  Community Name *     [▼ title.rendered        ]  (auto-detected)       │    │
│  │  Address              [▼ acf.park_address      ]  (auto-detected)       │    │
│  │  City                 [▼ acf.park_city         ]                        │    │
│  │  State                [▼ acf.park_state        ]                        │    │
│  │  ZIP                  [▼ — Skip this field —   ]                        │    │
│  │  Phone                [▼ acf.contact_number    ]                        │    │
│  │  Email                [▼ acf.manager_email     ]                        │    │
│  │  Latitude             [▼ acf.geo_lat           ]                        │    │
│  │  Longitude            [▼ acf.geo_lng           ]                        │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ Available source fields from sample post:                               │    │
│  │ title.rendered, acf.park_address, acf.park_city, acf.park_state,       │    │
│  │ acf.contact_number, acf.manager_email, acf.geo_lat, acf.geo_lng,       │    │
│  │ acf.amenities, acf.pet_policy, acf.lot_count, slug, link...            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                          [Skip Mapping] [Save Mappings]         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Phase 1: Define Field Mapping Data Structures

#### 1.1 Community Target Fields

| Field | DB Column | Required | Description |
|-------|-----------|----------|-------------|
| name | `name` | Yes | Community/location name |
| address | `address` | No | Street address |
| city | `city` | No | City name |
| state | `state` | No | State (2-letter preferred) |
| zip | `zip` | No | ZIP/postal code |
| phone | `phone` | No | Contact phone |
| email | `email` | No | Contact email |
| latitude | `metadata.latitude` | No | GPS latitude |
| longitude | `metadata.longitude` | No | GPS longitude |
| description | `metadata.description` | No | Description text |
| age_category | `metadata.age_category` | No | Age restriction (55+, etc.) |
| community_type | `metadata.community_type` | No | Type (MHC, RV, etc.) |

#### 1.2 Property Target Fields

| Field | DB Column | Required | Description |
|-------|-----------|----------|-------------|
| name | Derived from title | No | Listing title |
| address | `address` | No | Street address |
| lot_number | `lot_number` | No | Lot/site number |
| city | `city` | No | City name |
| state | `state` | No | State |
| zip | `zip` | No | ZIP code |
| price | `price` | No | Price in cents |
| price_type | `price_type` | No | sale/rent/lease |
| beds | `beds` | No | Bedroom count |
| baths | `baths` | No | Bathroom count |
| sqft | `sqft` | No | Square footage |
| year_built | `year_built` | No | Year built |
| status | `status` | No | available/pending/sold |
| description | `description` | No | Description text |
| features | `features` | No | Array of feature strings |

### Phase 2: Edge Function Updates

#### 2.1 Add `fetch-sample-post` Action

Create a new action in `sync-wordpress-communities/index.ts` that:
1. Fetches 1 sample post from the selected endpoint
2. Extracts all available field paths (flattened)
3. Suggests auto-mappings based on field name similarity
4. Returns structured response for UI

**Request:**
```json
{
  "action": "fetch-sample",
  "agentId": "...",
  "siteUrl": "...",
  "endpoint": "agency",
  "type": "community"
}
```

**Response:**
```json
{
  "success": true,
  "samplePost": {
    "id": 123,
    "title": "Sunset Village"
  },
  "availableFields": [
    { "path": "title.rendered", "sampleValue": "Sunset Village", "type": "string" },
    { "path": "acf.park_address", "sampleValue": "123 Main St", "type": "string" },
    { "path": "acf.contact_number", "sampleValue": "(555) 123-4567", "type": "string" },
    { "path": "acf.geo_lat", "sampleValue": 33.1234, "type": "number" }
  ],
  "suggestedMappings": {
    "name": "title.rendered",
    "address": "acf.park_address",
    "phone": "acf.contact_number",
    "latitude": "acf.geo_lat"
  }
}
```

#### 2.2 Store Field Mappings in Agent Config

Extend `WordPressConfig` interface:
```typescript
interface WordPressConfig {
  site_url: string;
  community_endpoint?: string;
  home_endpoint?: string;
  // NEW: Field mappings
  community_field_mappings?: Record<string, string>;  // target → source
  property_field_mappings?: Record<string, string>;
  // ... existing fields
}
```

#### 2.3 Update Sync Functions to Use Mappings

Modify `syncCommunitiesToLocations()` and `syncHomesToProperties()` to:
1. Check if field mappings exist in config
2. If mappings exist, use them instead of `extractAcfField()` guessing
3. If no mappings, fall back to current keyword-based extraction

### Phase 3: Frontend Components

#### 3.1 Create `WordPressFieldMapper.tsx` Component

```typescript
interface FieldMapping {
  targetField: string;
  targetLabel: string;
  required: boolean;
  sourceField: string | null;
  suggestedField?: string;
  description?: string;
}

interface WordPressFieldMapperProps {
  type: 'community' | 'property';
  availableFields: AvailableField[];
  currentMappings: Record<string, string>;
  suggestedMappings: Record<string, string>;
  onMappingsChange: (mappings: Record<string, string>) => void;
  onConfirm: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}
```

**Features:**
- Dropdown for each target field showing all available source fields
- "— Skip this field —" option to explicitly not map
- Auto-select suggested mappings on load
- Show sample value preview next to dropdown
- Grouped by category (Address, Contact, Details)
- Collapsible "Advanced fields" section for less common fields

#### 3.2 Update Connection Flow States

Extend `ConnectionStep` type:
```typescript
export type ConnectionStep = 
  | 'url' 
  | 'discovering' 
  | 'mapping'         // Endpoint mapping
  | 'field-mapping'   // NEW: Field mapping
  | 'connected';
```

#### 3.3 Update `WordPressIntegrationSheet.tsx`

Add new step in the flow:
1. After endpoint mapping is confirmed
2. Fetch sample post from selected endpoints
3. Show field mapper for communities (if selected)
4. Show field mapper for properties (if selected)
5. Save all mappings and complete connection

### Phase 4: Update Connection Hook

#### 4.1 New Functions in `useWordPressConnection.ts`

```typescript
// Fetch sample post and available fields
const fetchSamplePost = async (
  endpoint: string, 
  type: 'community' | 'property'
): Promise<SamplePostResult | null>;

// Save field mappings to agent config
const saveFieldMappings = async (
  type: 'community' | 'property',
  mappings: Record<string, string>
): Promise<boolean>;
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/agents/locations/WordPressFieldMapper.tsx` | **CREATE** | Field mapping selection component |
| `src/hooks/useWordPressConnection.ts` | Modify | Add `fetchSamplePost()`, `saveFieldMappings()`, update `ConnectionStep` |
| `src/components/agents/locations/WordPressIntegrationSheet.tsx` | Modify | Add field mapping step in flow |
| `supabase/functions/sync-wordpress-communities/index.ts` | Modify | Add `fetch-sample` action, update sync to use mappings |
| `supabase/functions/sync-wordpress-homes/index.ts` | Modify | Update sync to use mappings from config |

## Implementation Sequence

1. **Edge Function First**: Add `fetch-sample` action and field extraction logic
2. **Create Field Mapper Component**: Build the UI for mapping fields
3. **Update Hook**: Add state management and API calls
4. **Integrate into Flow**: Add field mapping step to the sheet
5. **Update Sync Logic**: Make sync functions use saved mappings

## Edge Cases Handled

1. **No ACF fields**: Show only standard WP fields (title, content, excerpt, slug)
2. **Complex nested fields**: Flatten to dot notation (e.g., `acf.location.lat`)
3. **Array fields**: Allow mapping to features array target
4. **Skip mapping entirely**: "Skip" button uses auto-detection fallback
5. **Edit mappings later**: "Reconfigure Mappings" button in connected state
6. **Different field types**: Show sample value to help user identify correct field

## Backward Compatibility

- Agents without saved `field_mappings` continue using keyword-based extraction
- Field mapper is optional - users can "Skip" and rely on auto-detection
- No database migration needed - mappings stored in existing JSONB `deployment_config`
