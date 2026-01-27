
# Plan: Fix Property Price Type Enum Validation Error

## Problem Summary

All 66 property updates are failing with:
```
invalid input value for enum property_price_type: "15"
```

**Root Cause**: The `price_type` field is mapped to `property_status`, which returns WordPress taxonomy term IDs (like `15`, `43`) instead of valid enum values (`sale`, `rent_monthly`, `rent_weekly`).

## Solution

Add a normalization function that converts WordPress price type values to valid database enum values.

### Changes to `supabase/functions/sync-wordpress-homes/index.ts`

**1. Add price type normalization helper (after line ~130)**

```typescript
/**
 * Normalize price type value to valid database enum
 * Handles taxonomy term names, common variations, and invalid values
 */
function normalizePriceType(value: unknown): 'sale' | 'rent_monthly' | 'rent_weekly' {
  if (value == null) return 'sale';
  
  const strValue = String(value).toLowerCase().trim();
  
  // Check if it's a numeric taxonomy ID - can't use directly, default to sale
  if (/^\d+$/.test(strValue)) {
    console.log(`⚠️ price_type is numeric (${strValue}), defaulting to 'sale'`);
    return 'sale';
  }
  
  // Map common WordPress/real estate terms to enum values
  if (strValue.includes('rent') || strValue.includes('lease')) {
    if (strValue.includes('week')) return 'rent_weekly';
    return 'rent_monthly';
  }
  
  if (strValue.includes('sale') || strValue.includes('buy') || strValue.includes('purchase')) {
    return 'sale';
  }
  
  // Default to sale for unknown values
  console.log(`⚠️ Unknown price_type value: "${strValue}", defaulting to 'sale'`);
  return 'sale';
}
```

**2. Use normalization when extracting price_type (line ~814)**

Before:
```typescript
priceType = (getValueByPath(home as Record<string, unknown>, fieldMappings.price_type) as string) || 'sale';
```

After:
```typescript
const rawPriceType = getValueByPath(home as Record<string, unknown>, fieldMappings.price_type);
priceType = normalizePriceType(rawPriceType);
```

**3. Also normalize AI extraction result (line ~842)**

Before:
```typescript
if (!priceType || priceType === 'sale') priceType = aiData.price_type || 'sale';
```

After:
```typescript
if (!priceType || priceType === 'sale') priceType = normalizePriceType(aiData.price_type);
```

**4. Also normalize ACF fallback (line ~883)**

Before:
```typescript
if (!priceType || priceType === 'sale') priceType = extractAcfField(acf, 'price_type', 'listing_type') || 'sale';
```

After:
```typescript
if (!priceType || priceType === 'sale') priceType = normalizePriceType(extractAcfField(acf, 'price_type', 'listing_type'));
```

## Optional Enhancement: Resolve Taxonomy Term IDs

For better accuracy, we could resolve term IDs to their names by fetching the `property_status` taxonomy:

```typescript
// Fetch term names once at start of sync
const termResponse = await fetch(`${siteUrl}/wp-json/wp/v2/property_status?per_page=100`);
const terms = await termResponse.json();
const priceTypeTermMap = new Map(terms.map(t => [String(t.id), t.name]));

// Then in normalization:
if (/^\d+$/.test(strValue) && priceTypeTermMap.has(strValue)) {
  return normalizePriceType(priceTypeTermMap.get(strValue));
}
```

This is optional since the current mapping to `property_status` will likely just have "For Sale" / "For Rent" as term names anyway.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/sync-wordpress-homes/index.ts` | Add `normalizePriceType()` helper and use it in all 3 price_type extraction points |

## Expected Result

After deployment:
- Properties will sync successfully with `price_type` set to `sale` (or appropriate enum value)
- No more `invalid input value for enum` errors
- Re-running Full Resync should show "66 updated" instead of "66 errors"
