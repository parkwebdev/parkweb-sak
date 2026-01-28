

# Plan: Fix Address Field to Only Store Street Address

## Problem Summary

When clicking a location in the sheet, the "Street Address" field shows the full combined address (e.g., "101 Polaris Ave, Pierre, SD 57501") instead of just the street component ("101 Polaris Ave").

### Root Cause

In `sync-wordpress-communities/index.ts`, when parsing a combined address to extract city/state/zip, the code **does not update the `address` variable** with the parsed street component. The full address string is stored in the `address` column while city/state/zip are correctly extracted.

**Current code (lines 1520-1534):**
```typescript
if (address && (!city || !state || !zip)) {
  const parsed = parseAddressComponents(address);
  if (!city && parsed.city) city = parsed.city;
  if (!state && parsed.state) state = parsed.state;
  if (!zip && parsed.zip) zip = parsed.zip;
  // ❌ Missing: address = parsed.street
}
```

---

## Solution

After parsing the combined address, update the `address` variable with just the street component if successfully parsed.

---

## Implementation Details

### File: `supabase/functions/sync-wordpress-communities/index.ts`

**Lines 1518-1534** - Update to also extract street:

```typescript
// PRIORITY 2.5: Parse combined address if city/state/zip still empty
// This runs before keyword extraction to avoid wasting cycles on fields we can parse
if (address && (!city || !state || !zip)) {
  const parsed = parseAddressComponents(address);
  if (!city && parsed.city) {
    city = parsed.city;
    console.log(`📍 Parsed city from address: ${city}`);
  }
  if (!state && parsed.state) {
    state = parsed.state;
    console.log(`📍 Parsed state from address: ${state}`);
  }
  if (!zip && parsed.zip) {
    zip = parsed.zip;
    console.log(`📍 Parsed zip from address: ${zip}`);
  }
  // NEW: Update address to just the street component if we successfully parsed it
  if (parsed.street && (parsed.city || parsed.state || parsed.zip)) {
    address = parsed.street;
    console.log(`📍 Extracted street address: ${address}`);
  }
}
```

### Also Apply to Properties Sync

**File:** `supabase/functions/sync-wordpress-homes/index.ts`

Apply the same fix to the properties sync function if it has similar address parsing logic.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/sync-wordpress-communities/index.ts` | Update address variable with parsed.street when parsing combined addresses |
| `supabase/functions/sync-wordpress-homes/index.ts` | Same fix for properties (if applicable) |

---

## Example Transformation

| Before Sync | After Sync |
|-------------|------------|
| address: "101 Polaris Ave, Pierre, SD 57501" | address: "101 Polaris Ave" |
| city: null | city: "Pierre" |
| state: null | state: "SD" |
| zip: null | zip: "57501" |

---

## Data Migration Note

Existing locations in the database already have the full address stored. After deploying this fix:

1. **New syncs** will store correctly separated address components
2. **Existing data** will need a full resync to fix the address field

Alternatively, we could run a one-time SQL migration to re-parse existing addresses, but a full resync is simpler and ensures all data is up-to-date.

---

## Testing Plan

1. Deploy the updated edge functions
2. Trigger a WordPress sync for a community with combined addresses
3. Verify in the database that:
   - `address` column contains only street address
   - `city`, `state`, `zip` are properly separated
4. Open the location sheet in the UI and confirm the street address field shows only the street

