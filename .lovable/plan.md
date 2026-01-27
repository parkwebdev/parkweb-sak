

# Plan: Add Combined Address Parsing for Edge Cases

## Problem

When WordPress provides a single address field like:
- `"123 Main St, Phoenix, AZ 85001"`
- `"456 Oak Ave, Los Angeles, California 90210"`

Users can map it to the `address` target field, but city/state remain empty unless:
1. AI extraction is enabled (slower, uses API credits)
2. Separate city/state fields exist in WordPress (often they don't)

## Solution

Add a `parseAddressComponents()` function that extracts city, state, and ZIP from combined address strings using regex patterns. This runs automatically **after** field mapping but **before** AI extraction.

## Technical Details

### New Function (in sync-wordpress-communities/index.ts)

```typescript
/**
 * Parse a combined address string into components
 * Handles formats like:
 * - "123 Main St, Phoenix, AZ 85001"
 * - "456 Oak Ave, Los Angeles, California 90210"
 * - "789 First St, Suite 100, Denver, CO 80202-1234"
 */
function parseAddressComponents(fullAddress: string | null): {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  if (!fullAddress) return { street: null, city: null, state: null, zip: null };

  // State abbreviations and full names
  const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i;

  // Extract ZIP (already have extractZipFromAddress, reuse pattern)
  const zipMatch = fullAddress.match(/\b(\d{5})(-\d{4})?\b/);
  const zip = zipMatch ? zipMatch[1] : null;

  // Extract state
  const stateMatch = fullAddress.match(statePattern);
  const state = stateMatch ? stateMatch[1] : null;

  // Parse city - typically before state, after last comma before state
  let city: string | null = null;
  if (state) {
    // Split by comma, find the part just before state
    const parts = fullAddress.split(',').map(p => p.trim());
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes(state)) {
        // City is the previous part
        if (i > 0) {
          city = parts[i - 1];
        } else {
          // State is in first part, try to extract city from same part
          const beforeState = parts[i].split(statePattern)[0].trim();
          if (beforeState) city = beforeState;
        }
        break;
      }
    }
  }

  // Street is everything before city (or the full address if no parsing worked)
  let street = fullAddress;
  if (city) {
    const cityIndex = fullAddress.indexOf(city);
    if (cityIndex > 0) {
      street = fullAddress.substring(0, cityIndex).replace(/,\s*$/, '').trim();
    }
  }

  return { street, city, state, zip };
}
```

### Integration Point (in sync function, around line 1475)

```typescript
// PRIORITY 3: Parse combined address if city/state/zip still empty
if (address && (!city || !state || !zip)) {
  const parsed = parseAddressComponents(address);
  if (!city && parsed.city) city = parsed.city;
  if (!state && parsed.state) state = parsed.state;
  if (!zip && parsed.zip) zip = parsed.zip;
}

// PRIORITY 4: Fall back to keyword-based ACF extraction (existing code)
```

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-wordpress-communities/index.ts` | Add `parseAddressComponents()` function, integrate after field mapping |
| `supabase/functions/sync-wordpress-homes/index.ts` | Add same function and integration for property sync |

## Example Parsing Results

| Input | Street | City | State | ZIP |
|-------|--------|------|-------|-----|
| "123 Main St, Phoenix, AZ 85001" | "123 Main St" | "Phoenix" | "AZ" | "85001" |
| "456 Oak Ave, Los Angeles, CA" | "456 Oak Ave" | "Los Angeles" | "CA" | null |
| "789 First St, Suite 100, Denver, Colorado 80202" | "789 First St, Suite 100" | "Denver" | "Colorado" | "80202" |

## User Experience

**In the Field Mapper UI:**
1. User maps `acf.location` → `address` (the combined field)
2. User leaves City, State, ZIP as "Skip this field" since WordPress doesn't have them
3. During sync, `parseAddressComponents()` automatically extracts missing components

**No UI changes required** - this is a backend enhancement that works transparently.

## Benefits

- **No API costs** - Pure regex parsing, no AI calls
- **Fast** - Runs in milliseconds per record
- **Fallback** - AI extraction still available for complex cases
- **Automatic** - Users don't need to do anything special

