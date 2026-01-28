

# Plan: Complete Repeater Field Handling for Pet Policy

## Problem Summary

The **Pet Policy** field is mapped to a repeater (`acf.community_pet_policies_repeater`) but the code treats it as a simple string. This causes it to show "(empty)" even when data exists.

### Two Issues Found:

1. **Pet Policy extraction assumes string** - Line 1478 in communities sync casts to `string | null` without checking for arrays
2. **Missing subfield names** - The `REPEATER_SUBFIELD_NAMES` array doesn't include common pet policy subfield names like `policy`, `rule`, `pet_type`, `description`

---

## Solution Overview

1. **Add pet policy subfield names** to the shared utility's `REPEATER_SUBFIELD_NAMES`
2. **Fix Pet Policy extraction** to handle arrays (like we do for amenities)
3. **Join array into single string** - Pet policies are stored as a single string, so flatten and join with semicolons

---

## Implementation Details

### Part 1: Update Shared Utility Subfield Names

**File:** `supabase/functions/_shared/utils/acf-extraction.ts`

**Lines 11-14** - Add more subfield names:
```typescript
const REPEATER_SUBFIELD_NAMES = [
  // Original
  'amenity', 'feature', 'item', 'value', 'name', 
  'label', 'text', 'title', 'option', 'entry',
  // Pet policy specific
  'policy', 'rule', 'pet', 'pet_type', 'pet_policy',
  // General description fields
  'description', 'desc', 'detail', 'info', 'note'
];
```

### Part 2: Fix Pet Policy Field Mapping Extraction

**File:** `supabase/functions/sync-wordpress-communities/index.ts`

**Lines 1478** - Update from:
```typescript
petPolicy = getValueByPath(community, fieldMappings.pet_policy) as string | null;
```

**To:**
```typescript
// Pet Policy - handle both string and repeater array
const petPolicyValue = getValueByPath(community, fieldMappings.pet_policy);
if (Array.isArray(petPolicyValue)) {
  // Flatten repeater and join into single policy string
  const policies = flattenRepeaterArray(petPolicyValue);
  petPolicy = policies.length > 0 ? policies.join('; ') : null;
} else if (typeof petPolicyValue === 'string' && petPolicyValue.trim()) {
  petPolicy = petPolicyValue.trim();
}
```

### Part 3: Update Keyword Fallback for Pet Policy

**Lines 1549-1552** - Update the keyword fallback to also try array extraction:
```typescript
if (!petPolicy) {
  // Try string extraction first
  petPolicy = extractAcfStringField(acf, 'pet_policy', 'pets', 'pet_rules', 'pet_friendly');
  
  // If not found, try array extraction (for repeaters)
  if (!petPolicy) {
    const petPolicies = extractAcfArrayField(acf, 
      'community_pet_policies_repeater', 'pet_policies_repeater', 'pet_policies', 
      'pet_rules', 'pets_allowed'
    );
    if (petPolicies.length > 0) {
      petPolicy = petPolicies.join('; ');
    }
  }
  
  // Original fallback
  if (!petPolicy) {
    petPolicy = extractAcfField(acf, 'pet_policy', 'pets', 'pet_rules', 'pet_friendly');
  }
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/utils/acf-extraction.ts` | Add `policy`, `rule`, `pet`, `description`, etc. to `REPEATER_SUBFIELD_NAMES` |
| `supabase/functions/sync-wordpress-communities/index.ts` | Fix pet policy field mapping to handle arrays, update keyword fallback to try array extraction |

---

## Expected Behavior After Fix

| Pet Policy Format | Example | Extracted Value |
|-------------------|---------|-----------------|
| Simple string | `"Pets allowed"` | `"Pets allowed"` |
| Repeater with `policy` | `[{policy: "Dogs OK"}, {policy: "Cats OK"}]` | `"Dogs OK; Cats OK"` |
| Repeater with `rule` | `[{rule: "Max 2 pets"}]` | `"Max 2 pets"` |
| Repeater with `description` | `[{description: "Small pets only"}]` | `"Small pets only"` |
| Comma-separated (via keyword) | `"Dogs, Cats, Birds"` | `"Dogs; Cats; Birds"` |

---

## Testing Plan

After implementation:
1. Run WordPress sync for communities with pet policy repeaters
2. Verify `pet_policy` column is populated in database
3. Check edge function logs for extraction messages

