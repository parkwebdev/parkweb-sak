
# Plan: Fix Street Address Extraction When City/State/Zip Are Pre-Filled

## Problem Summary

The street address extraction fix isn't working because the parsing block is conditionally gated:

```typescript
if (address && (!city || !state || !zip)) {
  // Parse address and extract street
}
```

When the user has WordPress field mappings that provide **both** a combined address field AND separate city/state/zip fields, the condition `(!city || !state || !zip)` is `FALSE` because all three are already filled from Priority 1 field mappings. The address parsing block is never executed, so the full combined address remains in the `address` variable.

---

## Solution

Split the address parsing into two concerns:

1. **City/State/Zip extraction** - Only run if those fields are empty (existing behavior)
2. **Street extraction** - Always run if address contains city/state/zip patterns (new behavior)

---

## Implementation Details

### File: `supabase/functions/sync-wordpress-communities/index.ts`

**Change lines 1518-1539** from:

```typescript
// PRIORITY 2.5: Parse combined address if city/state/zip still empty
if (address && (!city || !state || !zip)) {
  const parsed = parseAddressComponents(address);
  if (!city && parsed.city) { city = parsed.city; }
  if (!state && parsed.state) { state = parsed.state; }
  if (!zip && parsed.zip) { zip = parsed.zip; }
  if (parsed.street && (parsed.city || parsed.state || parsed.zip)) {
    address = parsed.street;
  }
}
```

**To:**

```typescript
// PRIORITY 2.5: Parse combined address for city/state/zip extraction AND street cleanup
if (address) {
  const parsed = parseAddressComponents(address);
  
  // Fill in missing city/state/zip from parsed address
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
  
  // ALWAYS extract just the street component if address contains city/state/zip
  // This handles the case where field mappings provide both a combined address
  // AND separate city/state/zip fields - we still want just the street in `address`
  if (parsed.street && (parsed.city || parsed.state || parsed.zip)) {
    address = parsed.street;
    console.log(`📍 Extracted street address: ${address}`);
  }
}
```

### File: `supabase/functions/sync-wordpress-homes/index.ts`

Apply the same fix to the properties sync function.

---

## Logic Change Summary

| Scenario | Before | After |
|----------|--------|-------|
| Address only, no city/state/zip mappings | ✅ Parses and extracts street | ✅ Parses and extracts street |
| Combined address + separate city/state/zip mappings | ❌ Skips parsing entirely | ✅ Still extracts street component |
| Street-only address (no city/state/zip in string) | ✅ No change | ✅ No change (parsed.city/state/zip will be null) |

---

## Example Flow

**WordPress Data:**
- `acf.community_street_address`: "1011 Albany PL SE, Orange City, IA 51041"
- `acf.community_city`: "Orange City"
- `acf.community_state`: "IA"
- `acf.community_zip_code`: "51041"

**Priority 1 (Field Mappings):**
- `address` = "1011 Albany PL SE, Orange City, IA 51041"
- `city` = "Orange City"
- `state` = "IA"  
- `zip` = "51041"

**Priority 2.5 (BEFORE fix):**
- Condition: `address && (!city || !state || !zip)` = `true && (false || false || false)` = **FALSE**
- Result: **Skipped** - address remains as full combined address ❌

**Priority 2.5 (AFTER fix):**
- Condition: `address` = **TRUE**
- Parses: `{ street: "1011 Albany PL SE", city: "Orange City", state: "IA", zip: "51041" }`
- City/state/zip already set, so no updates there
- Street extracted: `address = "1011 Albany PL SE"` ✅

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/sync-wordpress-communities/index.ts` | Remove `(!city \|\| !state \|\| !zip)` condition, always parse and extract street |
| `supabase/functions/sync-wordpress-homes/index.ts` | Same fix for properties |

---

## Testing

After deployment:
1. Trigger a full resync for communities
2. Verify the edge function logs show "Extracted street address" messages
3. Check database: `address` column should contain only street addresses
4. Open location sheet in UI: Street Address field should show only the street
