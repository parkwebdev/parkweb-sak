

# Plan: Multi-Sample Field Aggregation for Complete Data Discovery

## Problem

Currently, we fetch **ONE** sample post to display field previews. This creates a major UX problem:

- **False negatives** - If the sample post has an empty `acf.phone` field, users assume ALL posts lack phone data
- **Incomplete picture** - Different posts may have different fields populated (some have phone, some have email, etc.)
- **User confusion** - "Why isn't this field showing data?" when it exists in other posts

## Solution: Smart Multi-Sample Aggregation

Fetch **5 posts instead of 1**, then merge their field values to show the **richest available sample** for each field. If field A is empty in post 1 but populated in post 3, we show post 3's value.

```text
┌────────────────────────────────────────────────────────────────┐
│  Post 1: { phone: null,   email: "a@b.com", city: "Denver" }   │
│  Post 2: { phone: null,   email: null,      city: "Austin" }   │
│  Post 3: { phone: "555",  email: null,      city: null }       │
├────────────────────────────────────────────────────────────────┤
│  Merged: { phone: "555",  email: "a@b.com", city: "Denver" }   │ ← Best of each
└────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File 1: `supabase/functions/sync-wordpress-communities/index.ts`

**1. Fetch 5 posts instead of 1:**

```typescript
// Line ~1189 - Change from 1 to 5
const apiUrl = `${normalizedUrl}/wp-json/wp/v2/${endpoint}?per_page=5`;
```

**2. Create a field aggregation function:**

```typescript
/**
 * Merge field values from multiple posts, keeping the first non-empty value
 * for each field path.
 */
function aggregateFieldsFromPosts(
  posts: Record<string, unknown>[]
): AvailableField[] {
  const fieldMap = new Map<string, AvailableField>();
  
  for (const post of posts) {
    const fields = flattenObject(post);
    for (const field of fields) {
      const existing = fieldMap.get(field.path);
      
      // Keep the field if:
      // 1. We haven't seen this path yet, OR
      // 2. Existing value is empty/null but this one has data
      if (!existing || isValueEmpty(existing.sampleValue) && !isValueEmpty(field.sampleValue)) {
        fieldMap.set(field.path, field);
      }
    }
  }
  
  return Array.from(fieldMap.values());
}

function isValueEmpty(value: string | number | boolean | null): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    return value === '' || value === '[]' || value === '(empty)';
  }
  return false;
}
```

**3. Update `fetchSamplePostForMapping` to use aggregation:**

```typescript
const posts = await response.json();
if (!Array.isArray(posts) || posts.length === 0) {
  // ... error handling
}

// Use first post for title display
const primarySample = posts[0];
const title = primarySample.title?.rendered || primarySample.name || `Post #${primarySample.id}`;

// Aggregate fields from ALL fetched posts
const availableFields = aggregateFieldsFromPosts(posts);
```

---

### File 2: `src/types/wordpress.ts`

**Update `SamplePostResult` to show sample count:**

```typescript
export interface SamplePostResult {
  success: boolean;
  samplePost?: {
    id: number;
    title: string;
  };
  sampleCount?: number; // NEW: How many posts were analyzed
  availableFields: AvailableField[];
  suggestedMappings: Record<string, string>;
  error?: string;
}
```

---

### File 3: `src/components/agents/locations/WordPressFieldMapper.tsx`

**Update header to show sample count context:**

Current:
```tsx
<p className="text-sm text-muted-foreground">
  Using sample: <span className="font-medium text-foreground">{samplePostTitle}</span>
</p>
```

New:
```tsx
<p className="text-sm text-muted-foreground">
  Analyzed {sampleCount} posts for best field values
</p>
```

This sets accurate expectations - users understand we're showing the best available data from multiple records.

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| **Only 1 post exists** | Works exactly as before |
| **All 5 posts have empty field** | Shows `(empty)` - user knows field is truly unused |
| **Type mismatch across posts** | First non-empty value determines type |
| **Array vs string in different posts** | Takes first populated value's type |

---

## UI Enhancement: Empty Field Indicator

Add a subtle indicator when a field is empty across ALL samples:

```tsx
// In SearchableFieldSelect dropdown item
{field.sampleValue === null && (
  <span className="text-2xs text-muted-foreground/50 ml-1">(no data found)</span>
)}
```

This differentiates between:
- **"(empty)"** - Field exists but is empty in sample data
- **"no data found"** - Field path exists but ALL posts have no data

---

## Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/sync-wordpress-communities/index.ts` | Multi-sample fetching, field aggregation |
| `src/types/wordpress.ts` | Add `sampleCount` to result type |
| `src/components/agents/locations/WordPressFieldMapper.tsx` | Updated header text, empty field indicator |

---

## Result

- Fields show the **richest available data** from up to 5 posts
- Users won't be misled by a single post's empty fields
- Clear messaging: "Analyzed 5 posts for best field values"
- Subtle indicators for truly empty fields across all samples

