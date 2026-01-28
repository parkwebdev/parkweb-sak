

# Plan: Comprehensive WordPress Data Parsing & Schema Enhancement (Revised)

## Executive Summary

This plan focuses on:
1. **Schema Enhancement** - Add fields that improve property/community listings and user experience
2. **Robust Data Parsing** - Handle all edge cases for addresses, states, prices, and other fields

**Excluded**: Latitude/longitude (remains in metadata for AI context if available)

---

## Part 1: Database Schema Enhancements

### Properties Table - New Columns

| Column | Type | Purpose | Business Value |
|--------|------|---------|----------------|
| `manufacturer` | TEXT | Home manufacturer/brand (e.g., "Clayton", "Champion") | Buyers search by brand |
| `model` | TEXT | Home model name | Important for specifications |
| `lot_rent` | INTEGER | Monthly lot rent in cents | Critical for total cost calculation |
| `virtual_tour_url` | TEXT | 3D tour/video link | High-conversion feature |
| `community_type` | TEXT | "55+", "All Ages", "Family" | Key filter criteria |

### Locations Table - New Columns

| Column | Type | Purpose | Business Value |
|--------|------|---------|----------------|
| `amenities` | TEXT[] | Structured amenity list | Searchable features |
| `pet_policy` | TEXT | Pet restrictions/rules | Common buyer question |
| `utilities_included` | JSONB | Water/trash/electric details | Cost transparency |
| `age_category` | TEXT | "55+", "All Ages", etc. | Critical filter |
| `description` | TEXT | Community description | SEO and user info |

### Migration SQL

```sql
-- Properties table enhancements
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS lot_rent INTEGER,
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
  ADD COLUMN IF NOT EXISTS community_type TEXT;

-- Locations table enhancements  
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pet_policy TEXT,
  ADD COLUMN IF NOT EXISTS utilities_included JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS age_category TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Index for community type filtering
CREATE INDEX IF NOT EXISTS idx_properties_community_type 
  ON properties(community_type) 
  WHERE community_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_locations_age_category 
  ON locations(age_category) 
  WHERE age_category IS NOT NULL;
```

---

## Part 2: Robust Data Parsing Utilities

### 2.1 Enhanced Address Parser

**File:** `supabase/functions/_shared/utils/address-parser.ts`

**New Capabilities:**
- Handle addresses without commas (pattern matching)
- Detect multi-word cities (Los Angeles, Salt Lake City, etc.)
- Normalize directionals (N. → North)
- Handle apartment/suite variations

```typescript
// Multi-word city detection
const MULTI_WORD_CITIES = new Set([
  'los angeles', 'new york', 'san francisco', 'san diego', 'las vegas',
  'salt lake city', 'kansas city', 'new orleans', 'oklahoma city',
  'santa monica', 'san jose', 'el paso', 'fort worth', 'palm springs',
  // ... comprehensive list
]);

export function normalizeAndParseAddress(rawAddress: string | null): ParsedAddress {
  // Step 1: Normalize whitespace and punctuation
  // Step 2: Try comma-delimited parsing first
  // Step 3: Fall back to pattern matching with multi-word city detection
  // Step 4: Return structured components
}
```

### 2.2 State Normalization

**File:** `supabase/functions/_shared/utils/state-mapping.ts`

```typescript
// Store states as 2-letter abbreviations consistently
export function normalizeStateToAbbreviation(input: string | null): string | null {
  // Handle: "Arizona" → "AZ", "Ariz." → "AZ", "CALIF" → "CA"
  
  const TYPO_MAP: Record<string, string> = {
    'ARIZ': 'AZ', 'ARIZ.': 'AZ', 'ARIZON': 'AZ',
    'CALIF': 'CA', 'CALIF.': 'CA', 'CALI': 'CA',
    'FLA': 'FL', 'FLA.': 'FL',
    'TEX': 'TX', 'TEX.': 'TX',
    'WASH': 'WA', 'WASH.': 'WA',
    // ... comprehensive variations
  };
}
```

### 2.3 Price Parsing

**File:** `supabase/functions/_shared/utils/price-parser.ts` (NEW)

```typescript
/**
 * Parse price from various formats → cents
 * 
 * "$125,000" → 12500000
 * "125000" → 12500000  
 * "$1,200/mo" → 120000
 * "Call for pricing" → null
 */
export function parsePriceToCents(input: unknown): number | null;

/**
 * Infer price type from context
 * "$1,200/mo" → "rent_monthly"
 * "For Sale: $125,000" → "sale"
 */
export function inferPriceType(rawValue: unknown, explicitType?: string): PriceType;
```

### 2.4 Phone Number Normalization

**File:** `supabase/functions/_shared/utils/phone-parser.ts` (NEW)

```typescript
/**
 * Normalize to E.164 format
 * "(602) 555-1234" → "+16025551234"
 * "602.555.1234" → "+16025551234"
 */
export function normalizePhoneNumber(input: string | null): string | null;
```

### 2.5 Numeric Field Parsing

**File:** `supabase/functions/_shared/utils/numeric-parser.ts` (NEW)

```typescript
// Baths: "2.5", "2 1/2", "2½" → 2.5
export function parseBathCount(input: unknown): number | null;

// Sqft: "1,500 sq ft" → 1500
export function parseSqft(input: unknown): number | null;

// Year: validates 1900-current+1
export function parseYearBuilt(input: unknown): number | null;
```

### 2.6 Status Normalization

**Enhanced mapping for all variations:**

| Input Variations | Output |
|-----------------|--------|
| "Active", "For Sale", "Just Listed", "New" | `available` |
| "Pending", "Under Contract", "Contingent", "In Escrow" | `pending` |
| "Sold", "Closed" | `sold` |
| "Rented", "Leased" | `rented` |
| "Coming Soon", "Pre-Market" | `coming_soon` |
| "Off Market", "Withdrawn", "Expired" | `off_market` |

---

## Part 3: Sync Function Enhancements

### 3.1 Property Sync Updates

**File:** `supabase/functions/sync-wordpress-homes/index.ts`

Add extraction for new fields with 4-tier priority:

```typescript
// New field extraction
let manufacturer: string | null = null;
let model: string | null = null;
let lotRent: number | null = null;
let virtualTourUrl: string | null = null;
let communityType: string | null = null;

// PRIORITY 1: User field mappings
if (fieldMappings) {
  manufacturer = getValueByPath(home, fieldMappings.manufacturer);
  model = getValueByPath(home, fieldMappings.model);
  lotRent = parsePriceToCents(getValueByPath(home, fieldMappings.lot_rent));
  virtualTourUrl = getValueByPath(home, fieldMappings.virtual_tour_url);
  communityType = getValueByPath(home, fieldMappings.community_type);
}

// PRIORITY 2: AI extraction (already handled)

// PRIORITY 3: ACF keyword fallback
if (!manufacturer) manufacturer = extractAcfField(acf, 'manufacturer', 'make', 'builder');
if (!model) model = extractAcfField(acf, 'model', 'model_name');
if (lotRent == null) {
  const raw = extractAcfNumber(acf, 'lot_rent', 'space_rent', 'site_rent');
  lotRent = raw != null ? Math.round(raw * 100) : null;
}
if (!virtualTourUrl) virtualTourUrl = extractAcfField(acf, 'virtual_tour', 'matterport', '3d_tour');
if (!communityType) communityType = extractAcfField(acf, 'community_type', 'age_restriction');
```

### 3.2 Community Sync Updates

**File:** `supabase/functions/sync-wordpress-communities/index.ts`

Add extraction for new fields:

```typescript
// New field extraction
let amenities: string[] = [];
let petPolicy: string | null = null;
let utilitiesIncluded: Record<string, boolean> = {};
let ageCategory: string | null = null;
let description: string | null = null;

// Handle repeater format for amenities
const repeater = acf?.community_amenities_repeater;
if (Array.isArray(repeater)) {
  amenities = repeater
    .map(item => typeof item === 'object' && 'amenity' in item ? String(item.amenity) : String(item))
    .filter(Boolean);
}

// Extract utilities object
if (acf?.water_trash_electric) {
  const utils = acf.water_trash_electric;
  utilitiesIncluded = {
    water: utils.water === true || utils.water === 'yes',
    trash: utils.trash === true || utils.trash === 'yes', 
    electric: utils.electric === true || utils.electric === 'yes',
  };
}
```

---

## Part 4: AI Extraction Schema Updates

**File:** `supabase/functions/_shared/ai/wordpress-extraction.ts`

Update interfaces and Claude tool schemas:

```typescript
export interface ExtractedPropertyData {
  // ... existing fields ...
  manufacturer?: string | null;
  model?: string | null;
  lot_rent?: number | null;  // in dollars, convert to cents after
  virtual_tour_url?: string | null;
  community_type?: string | null;
}

export interface ExtractedCommunityData {
  // ... existing fields ...
  amenities?: string[];
  pet_policy?: string | null;
  utilities_included?: { water?: boolean; trash?: boolean; electric?: boolean };
  age_category?: string | null;
  description?: string | null;
}
```

---

## Part 5: Field Mapping UI Updates

**File:** `src/components/ari/wordpress/WordPressFieldMapper.tsx`

Add new target fields to mapper:

**Properties:**
- `manufacturer` - "Manufacturer/Builder"
- `model` - "Model Name"
- `lot_rent` - "Monthly Lot Rent"
- `virtual_tour_url` - "Virtual Tour URL"
- `community_type` - "Community Type (55+, etc.)"

**Communities:**
- `amenities` - "Amenities (array)"
- `pet_policy` - "Pet Policy"
- `utilities_included` - "Utilities Included"
- `age_category` - "Age Category"
- `description` - "Description"

---

## Part 6: Type Updates

**File:** `src/types/properties.ts`

```typescript
export interface Property {
  // ... existing fields ...
  manufacturer?: string | null;
  model?: string | null;
  lot_rent?: number | null;
  virtual_tour_url?: string | null;
  community_type?: string | null;
}
```

**File:** `src/types/locations.ts`

```typescript
export interface LocationMetadata {
  // ... existing fields ...
  // Remove lat/long - stays in metadata if needed
}

// New interface for Location with enhanced fields
export interface LocationWithDetails extends Location {
  amenities?: string[] | null;
  pet_policy?: string | null;
  utilities_included?: {
    water?: boolean;
    trash?: boolean;
    electric?: boolean;
  } | null;
  age_category?: string | null;
  description?: string | null;
}
```

---

## Implementation Order

1. **Database Migration** - Add new columns to properties and locations
2. **Parsing Utilities** - Create price-parser, phone-parser, numeric-parser; enhance address-parser and state-mapping
3. **Sync Functions** - Update extraction logic for new fields
4. **AI Extraction** - Update Claude schemas for new fields
5. **Frontend** - Update field mapper and types
6. **Testing** - Full resync with sample feeds

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_enhance_wp_schema.sql` | New columns for properties and locations |
| `supabase/functions/_shared/utils/address-parser.ts` | Enhanced address parsing with multi-word cities |
| `supabase/functions/_shared/utils/state-mapping.ts` | Add abbreviation normalization |
| `supabase/functions/_shared/utils/price-parser.ts` | NEW - Price parsing utilities |
| `supabase/functions/_shared/utils/phone-parser.ts` | NEW - Phone normalization |
| `supabase/functions/_shared/utils/numeric-parser.ts` | NEW - Beds/baths/sqft parsing |
| `supabase/functions/sync-wordpress-homes/index.ts` | Add new field extraction |
| `supabase/functions/sync-wordpress-communities/index.ts` | Add new field extraction |
| `supabase/functions/_shared/ai/wordpress-extraction.ts` | Update schemas for new fields |
| `src/components/ari/wordpress/WordPressFieldMapper.tsx` | Add new mappable fields |
| `src/types/properties.ts` | Add new property fields |
| `src/types/locations.ts` | Add new location fields |

---

## Edge Cases Covered

| Scenario | Solution |
|----------|----------|
| Address: "123 Main St Phoenix AZ 85001" (no commas) | Pattern matching with state detection |
| Address: "456 Oak Ave, Los Angeles, California" | State normalization + multi-word city |
| State: "Ariz." or "CALIF" | Typo/abbreviation mapping |
| Price: "$125,000" vs "125000" vs "Call for pricing" | Flexible parsing with null handling |
| Price: "$1,200/mo" | Infer rent_monthly from context |
| Baths: "2.5" vs "2 1/2" vs "2½" | Handle all fraction formats |
| Phone: "(602) 555-1234" vs "602.555.1234" | Normalize to E.164 |
| Status: "Active" vs "For Sale" vs "Coming Soon!" | Comprehensive status mapping |
| Amenities as repeater array | Handle `[{amenity: "Pool"}, {amenity: "Gym"}]` format |
| Missing fields | Graceful null handling throughout |

