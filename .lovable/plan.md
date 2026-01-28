

# Plan: Fix ACF Repeater Field Handling

## Problem Summary

ACF (Advanced Custom Fields) repeater fields are not being fully extracted because:

1. **`getValueByPath` returns only the first array element** instead of the full array
2. **`extractAcfArray` in properties sync assumes simple string arrays** - doesn't handle repeater objects like `{feature: "Pool"}`
3. **Hardcoded subfield name `amenity`** - only checks for one subfield name, but ACF could use `item`, `value`, `name`, `feature`, etc.
4. **No shared utility** - repeater handling logic is duplicated and inconsistent between communities and properties sync

## Solution Overview

1. Create a shared ACF extraction utility module
2. Fix `getValueByPath` to return full arrays when appropriate
3. Implement smart repeater object flattening that handles multiple subfield names
4. Update both sync functions to use the shared utilities

---

## Implementation Details

### Part 1: Create Shared ACF Extraction Utility

**New File:** `supabase/functions/_shared/utils/acf-extraction.ts`

```typescript
/**
 * ACF Field Extraction Utilities
 * 
 * Handles extraction of values from ACF repeater fields and other complex structures.
 */

// Common subfield names used in ACF repeaters
const REPEATER_SUBFIELD_NAMES = [
  'amenity', 'feature', 'item', 'value', 'name', 
  'label', 'text', 'title', 'option', 'entry'
];

/**
 * Flatten an ACF repeater array to simple strings
 * Handles both simple arrays and object arrays with various subfield names
 */
export function flattenRepeaterArray(arr: unknown[]): string[] {
  return arr
    .map(item => {
      // Simple string
      if (typeof item === 'string') return item;
      
      // Number (convert to string)
      if (typeof item === 'number') return String(item);
      
      // Object with known subfield
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        
        // Check common subfield names
        for (const fieldName of REPEATER_SUBFIELD_NAMES) {
          if (fieldName in obj && obj[fieldName] != null) {
            return String(obj[fieldName]);
          }
        }
        
        // Fallback: use first string value found
        for (const value of Object.values(obj)) {
          if (typeof value === 'string' && value.trim()) {
            return value;
          }
        }
      }
      
      return null;
    })
    .filter((v): v is string => v != null && v.trim() !== '');
}

/**
 * Extract an array field from ACF by checking multiple keywords
 * Handles repeater objects and simple arrays
 */
export function extractAcfArrayField(
  acf: Record<string, unknown> | undefined,
  ...keywords: string[]
): string[] {
  if (!acf) return [];
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const match = keys.find(k => k.toLowerCase().includes(keyword.toLowerCase()));
    if (match) {
      const value = acf[match];
      
      if (Array.isArray(value)) {
        return flattenRepeaterArray(value);
      }
      
      // Handle comma-separated string
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      // Single string value
      if (typeof value === 'string' && value.trim()) {
        return [value.trim()];
      }
    }
  }
  
  return [];
}

/**
 * Extract a single string field from ACF by checking multiple keywords
 */
export function extractAcfStringField(
  acf: Record<string, unknown> | undefined,
  ...keywords: string[]
): string | null {
  if (!acf) return null;
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const match = keys.find(k => k.toLowerCase().includes(keyword.toLowerCase()));
    if (match) {
      const value = acf[match];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number') {
        return String(value);
      }
    }
  }
  
  return null;
}

/**
 * Extract a numeric field from ACF by checking multiple keywords
 */
export function extractAcfNumberField(
  acf: Record<string, unknown> | undefined,
  ...keywords: string[]
): number | null {
  if (!acf) return null;
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const match = keys.find(k => k.toLowerCase().includes(keyword.toLowerCase()));
    if (match) {
      const value = acf[match];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(parsed)) return parsed;
      }
    }
  }
  
  return null;
}
```

### Part 2: Fix `getValueByPath` for Full Array Support

**File:** `supabase/functions/sync-wordpress-communities/index.ts` (lines 131-143)
**File:** `supabase/functions/sync-wordpress-homes/index.ts` (similar location)

**Current (broken):**
```typescript
if (Array.isArray(current)) {
  if (current.length === 0) return null;
  const firstItem = current[0];
  if (typeof firstItem === 'object' && firstItem !== null && 'rendered' in firstItem) {
    return (firstItem as Record<string, unknown>).rendered;
  }
  return firstItem; // Only returns first item!
}
```

**Fixed:**
```typescript
if (Array.isArray(current)) {
  if (current.length === 0) return null;
  
  // If this is the final path segment, return the full array
  if (i === parts.length - 1) {
    // Check if it's an array of {rendered: ...} objects (WP content)
    const firstItem = current[0];
    if (typeof firstItem === 'object' && firstItem !== null && 'rendered' in firstItem) {
      return (firstItem as Record<string, unknown>).rendered;
    }
    // Return full array for field mappings to handle
    return current;
  }
  
  // If there are more path segments, traverse into first item
  const firstItem = current[0];
  if (typeof firstItem === 'object' && firstItem !== null) {
    current = firstItem as Record<string, unknown>;
  } else {
    return null;
  }
}
```

### Part 3: Update Communities Sync to Use Shared Utility

**File:** `supabase/functions/sync-wordpress-communities/index.ts`

**Add import:**
```typescript
import { 
  flattenRepeaterArray, 
  extractAcfArrayField, 
  extractAcfStringField 
} from '../_shared/utils/acf-extraction.ts';
```

**Update field mapping extraction (lines 1466-1475):**
```typescript
// Amenities - from field mapping
const amenitiesValue = getValueByPath(community, fieldMappings.amenities);
if (Array.isArray(amenitiesValue)) {
  amenities = flattenRepeaterArray(amenitiesValue);
} else if (typeof amenitiesValue === 'string') {
  amenities = amenitiesValue.split(',').map(s => s.trim()).filter(Boolean);
}
```

**Update keyword fallback (lines 1541-1550):**
```typescript
// Amenities - keyword fallback using shared utility
if (amenities.length === 0) {
  amenities = extractAcfArrayField(acf, 
    'community_amenities_repeater', 'amenities_repeater', 'amenities', 
    'community_features', 'features'
  );
}

// Pet policy - keyword fallback
if (!petPolicy) {
  petPolicy = extractAcfStringField(acf, 'pet_policy', 'pets', 'pet_rules', 'pet_friendly');
}
```

### Part 4: Update Properties Sync to Use Shared Utility

**File:** `supabase/functions/sync-wordpress-homes/index.ts`

**Add import:**
```typescript
import { 
  flattenRepeaterArray, 
  extractAcfArrayField, 
  extractAcfStringField,
  extractAcfNumberField 
} from '../_shared/utils/acf-extraction.ts';
```

**Remove local `extractAcfArray` function** (lines 117-138) - replaced by shared utility.

**Update features extraction (around line 900):**
```typescript
// Features - from field mapping
const featuresValue = getValueByPath(home, fieldMappings.features);
if (Array.isArray(featuresValue)) {
  features = flattenRepeaterArray(featuresValue);
} else if (typeof featuresValue === 'string') {
  features = featuresValue.split(',').map(s => s.trim()).filter(Boolean);
}

// Features - keyword fallback
if (features.length === 0) {
  features = extractAcfArrayField(acf, 
    'features', 'home_features', 'property_features', 
    'amenities', 'highlights'
  );
}
```

**Update other keyword extractions to use shared utilities:**
```typescript
if (!manufacturer) {
  manufacturer = extractAcfStringField(acf, 'manufacturer', 'make', 'builder', 'brand');
}

if (!model) {
  model = extractAcfStringField(acf, 'model', 'model_name', 'home_model');
}

if (lotRent == null) {
  const lotRentValue = extractAcfNumberField(acf, 'lot_rent', 'space_rent', 'site_rent', 'lot_fee');
  if (lotRentValue != null) lotRent = Math.round(lotRentValue * 100);
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/utils/acf-extraction.ts` | **NEW** - Shared ACF extraction utilities with repeater support |
| `supabase/functions/sync-wordpress-communities/index.ts` | Fix `getValueByPath`, import and use shared utilities |
| `supabase/functions/sync-wordpress-homes/index.ts` | Fix `getValueByPath`, remove local `extractAcfArray`, use shared utilities |

---

## Supported Repeater Formats After Fix

| Format | Example | Supported |
|--------|---------|-----------|
| Simple string array | `["Pool", "Gym"]` | ✅ |
| Repeater with `amenity` | `[{amenity: "Pool"}, {amenity: "Gym"}]` | ✅ |
| Repeater with `feature` | `[{feature: "Pool"}, {feature: "Gym"}]` | ✅ |
| Repeater with `item` | `[{item: "Pool"}, {item: "Gym"}]` | ✅ |
| Repeater with `value` | `[{value: "Pool"}, {value: "Gym"}]` | ✅ |
| Repeater with `name` | `[{name: "Pool"}, {name: "Gym"}]` | ✅ |
| Comma-separated string | `"Pool, Gym, Clubhouse"` | ✅ |
| Mixed object (fallback) | `[{custom_field: "Pool"}]` | ✅ (uses first string value) |

---

## Testing Plan

After implementation:
1. Test with MHP Communities WordPress site (known to use repeater fields)
2. Run Full Resync for communities and verify amenities array is populated
3. Run Full Resync for properties and verify features array is populated
4. Check edge function logs for any extraction errors

