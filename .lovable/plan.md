

# Plan: Smart Repeater Field Detection

## Problem Summary

Currently, `flattenRepeaterArray` uses a hardcoded list of ~20 subfield names to extract values from ACF repeaters. This approach:

1. **Fails for unknown field names** - If a WordPress dev uses `the_amenity_item` or `listing_feature`, we miss it
2. **Requires constant updates** - Every new client requires adding their field names
3. **Is fragile** - Relies on the "first string value" fallback which can pick wrong fields

## Solution: Score-Based Field Selection

Instead of checking specific names, **score each field** in a repeater row to intelligently select the most likely "value" field.

---

## Scoring Algorithm

For each field in a repeater object, calculate a score based on:

| Factor | Score Impact | Reasoning |
|--------|--------------|-----------|
| **Only field in object** | +100 | No ambiguity |
| **Field name is metadata** (`id`, `order`, `index`, `row_id`, `acf_fc_layout`) | -50 | Definitely not the value |
| **Value is string** | +10 | Strings are likely display values |
| **Value is short string** (< 100 chars) | +5 | Short = display text, long = description |
| **Value is number** | +5 | Could be a quantity or ID |
| **Value is object/array** | -20 | Nested structures are rarely the display value |
| **Field name ends with value suffix** (`_name`, `_label`, `_text`, `_value`, `_title`) | +15 | Naming convention suggests value |
| **Field name is generic value word** (`name`, `value`, `text`, `label`, `title`) | +20 | Common ACF conventions |
| **Field name contains semantic hints** (`feature`, `amenity`, `policy`, `item`) | +10 | Domain-specific hints |
| **Short field name** (< 10 chars) | +3 | Simpler names are often the main field |

Select the field with the **highest score**.

---

## Implementation Details

### File: `supabase/functions/_shared/utils/acf-extraction.ts`

### New Constants

```typescript
// Fields that are clearly metadata, not values
const METADATA_FIELD_NAMES = new Set([
  'id', 'row_id', 'index', 'order', 'sort_order', 
  'acf_fc_layout', 'layout', 'type',
  'created_at', 'updated_at', 'modified',
  '_id', '__typename'
]);

// Field names that strongly indicate "this is the value"
const VALUE_FIELD_NAMES = new Set([
  'name', 'value', 'text', 'label', 'title', 
  'item', 'option', 'entry', 'content'
]);

// Suffixes that suggest a value field
const VALUE_SUFFIXES = [
  '_name', '_value', '_text', '_label', '_title',
  '_item', '_option', '_entry'
];

// Domain-specific hints for this application
const DOMAIN_HINTS = [
  'amenity', 'feature', 'policy', 'pet', 'rule',
  'utility', 'highlight', 'benefit', 'service'
];
```

### New Scoring Function

```typescript
interface FieldScore {
  key: string;
  value: unknown;
  score: number;
}

/**
 * Score a field to determine likelihood it's "the value" in a repeater row
 */
function scoreField(key: string, value: unknown): number {
  const lowerKey = key.toLowerCase();
  let score = 0;
  
  // Strongly penalize metadata fields
  if (METADATA_FIELD_NAMES.has(lowerKey)) {
    return -50;
  }
  
  // Score based on value type
  if (typeof value === 'string') {
    score += 10;
    // Short strings are more likely display values
    if (value.length < 100) score += 5;
    // Very short might be abbreviations
    if (value.length < 3) score -= 3;
    // Empty strings are not values
    if (!value.trim()) return -100;
  } else if (typeof value === 'number') {
    score += 5;
  } else if (typeof value === 'object' && value !== null) {
    // Objects/arrays are rarely the display value
    score -= 20;
  } else if (value == null) {
    return -100;
  }
  
  // Score based on field name
  if (VALUE_FIELD_NAMES.has(lowerKey)) {
    score += 20;
  }
  
  // Check for value suffixes
  for (const suffix of VALUE_SUFFIXES) {
    if (lowerKey.endsWith(suffix)) {
      score += 15;
      break;
    }
  }
  
  // Check for domain-specific hints
  for (const hint of DOMAIN_HINTS) {
    if (lowerKey.includes(hint)) {
      score += 10;
      break;
    }
  }
  
  // Shorter field names are often the main field
  if (key.length < 10) score += 3;
  if (key.length < 6) score += 2;
  
  return score;
}

/**
 * Select the best value field from a repeater row object
 */
function selectBestValue(obj: Record<string, unknown>): string | null {
  const entries = Object.entries(obj);
  
  // Single field - use it
  if (entries.length === 1) {
    const [, value] = entries[0];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return null;
  }
  
  // Score all fields
  const scored: FieldScore[] = entries.map(([key, value]) => ({
    key,
    value,
    score: scoreField(key, value)
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Return highest scoring string/number value
  for (const { value, score } of scored) {
    if (score < 0) continue; // Skip negatively scored fields
    
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  
  return null;
}
```

### Updated `flattenRepeaterArray`

```typescript
export function flattenRepeaterArray(arr: unknown[]): string[] {
  return arr
    .map(item => {
      // Simple string - return as-is
      if (typeof item === 'string') return item;
      
      // Number - convert to string
      if (typeof item === 'number') return String(item);
      
      // Object - use smart field selection
      if (typeof item === 'object' && item !== null) {
        return selectBestValue(item as Record<string, unknown>);
      }
      
      return null;
    })
    .filter((v): v is string => v != null && v.trim() !== '');
}
```

---

## Example Scenarios

| Repeater Data | Old Behavior | New Behavior |
|---------------|--------------|--------------|
| `[{amenity: "Pool"}]` | ✅ Found "amenity" in list | ✅ Scores: amenity=45 |
| `[{the_feature_name: "Gym"}]` | ❌ Falls back to first string | ✅ Scores: 15 (suffix _name) + 10 (domain hint) = 25 |
| `[{id: 1, value: "Clubhouse"}]` | ❌ Returns "1" (first value) | ✅ id=-50, value=35 → returns "Clubhouse" |
| `[{listing_item_text: "Ocean View"}]` | ❌ Falls back to first string | ✅ Scores: 15 (_text suffix) = 15 |
| `[{x: "A"}]` | ✅ Falls back to first string | ✅ Single field → returns "A" |
| `[{acf_fc_layout: "item", content: "Pool"}]` | ❌ Might return layout | ✅ layout=-50, content=30 → returns "Pool" |

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/utils/acf-extraction.ts` | Replace hardcoded name checking with score-based field selection |

---

## Benefits

1. **No more hardcoded field names** - Works with any ACF configuration
2. **Self-healing** - Adapts to new WordPress sites automatically
3. **Smarter metadata filtering** - Won't accidentally return `id` or `order` fields
4. **Maintains backward compatibility** - Will still find all existing field names (they just get higher scores)
5. **Extensible** - Easy to add domain-specific hints

