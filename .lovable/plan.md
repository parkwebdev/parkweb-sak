

# Plan: Industry-Grade Field Mapper with Rich Previews

## Problem Analysis

After reviewing the codebase, I identified three key limitations:

1. **Previews only visible after selection** - Users can't see sample values while browsing the dropdown, making field selection a guessing game
2. **Truncation cuts off data** - 40-character limit hides critical information
3. **No type indicators** - Users can't tell if a field is a string, array, or object

## Industry Standard (Airtable/Zapier/n8n Pattern)

Professional data mappers show:
- **Sample value inline with each option** in the dropdown
- **Data type badge** (string, array, number) for clarity
- **Full value on hover** via tooltip for truncated values
- **Consistent two-column layout** with field path on left, preview on right

---

## Visual Design: Enhanced Dropdown Item

```text
┌────────────────────────────────────────────────────────────────┐
│  🔍 Search fields...                                           │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  acf.community_name                    STR               │  │
│  │  ○ "Prairie View Manufactured Ho..."   [hover: full]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  acf.amenities                         ARR               │  │
│  │  ○ "Pool, Clubhouse, Laundry"                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  acf.city                              STR               │  │
│  │  ○ "Springfield"                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

Each dropdown item shows:
- **Field path** (monospace, primary)
- **Type badge** (STR, NUM, ARR, OBJ) - tiny, muted
- **Sample value** (secondary line, dimmed, with tooltip on hover)

---

## Technical Implementation

### File 1: `supabase/functions/sync-wordpress-communities/index.ts`

**Increase `maxDepth` for deeper JSON traversal:**

```typescript
// Line ~1028
function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
  result: AvailableField[] = [],
  maxDepth = 5,  // Increased from 3 to 5
  currentDepth = 0
): AvailableField[] {
```

This allows access to deeply nested ACF fields like `acf.location.coordinates.lat`.

---

### File 2: `src/components/agents/locations/WordPressFieldMapper.tsx`

**1. Update Type Badge Component**

Create a small helper for type indicators:

```tsx
function TypeBadge({ type }: { type: AvailableField['type'] }) {
  const labels: Record<AvailableField['type'], string> = {
    string: 'STR',
    number: 'NUM',
    boolean: 'BOOL',
    array: 'ARR',
    object: 'OBJ',
    null: 'NULL',
  };
  
  return (
    <span className="text-3xs font-medium text-muted-foreground/60 uppercase tracking-wider px-1 py-0.5 bg-muted/50 rounded shrink-0">
      {labels[type]}
    </span>
  );
}
```

**2. Enhanced `formatSampleValue` Function**

Increase truncation limit and add tooltip support:

```tsx
function formatSampleValue(value: string | number | boolean | null, maxLength = 60): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  const str = String(value);
  if (str.length > maxLength) return str.substring(0, maxLength) + '...';
  return str;
}

function getFullValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}
```

**3. Enhanced Dropdown Item with Preview**

Update the CommandItem in SearchableFieldSelect to show inline previews:

```tsx
<CommandItem
  key={field.path}
  value={`${field.path} ${getFullValue(field.sampleValue)}`}  // Include sample in search
  onSelect={() => { onSelect(field.path); setOpen(false); }}
  className="flex flex-col items-start gap-1 py-2"
>
  <div className="flex items-center justify-between w-full gap-2">
    <div className="flex items-center gap-2 min-w-0">
      {selectedSource === field.path && (
        <Check size={14} className="shrink-0 text-primary" aria-hidden="true" />
      )}
      <code className="font-mono text-xs truncate">{field.path}</code>
    </div>
    <TypeBadge type={field.type} />
  </div>
  <Tooltip>
    <TooltipTrigger asChild>
      <p className="text-xs text-muted-foreground truncate w-full pl-5">
        {formatSampleValue(field.sampleValue)}
      </p>
    </TooltipTrigger>
    <TooltipContent side="right" className="max-w-[300px]">
      <p className="text-xs break-words">{getFullValue(field.sampleValue)}</p>
    </TooltipContent>
  </Tooltip>
</CommandItem>
```

**4. Wider Popover for Better Readability**

```tsx
<PopoverContent 
  className="min-w-[400px] w-auto max-w-[500px] p-0 bg-popover" 
  align="start"
>
```

**5. Include Sample Value in Search**

The `value` prop on CommandItem now includes the sample value, so users can search by field path OR sample content:

```tsx
value={`${field.path} ${getFullValue(field.sampleValue)}`}
```

This means typing "Springfield" will find `acf.city` if its sample value is "Springfield".

---

## Enhanced Features Summary

| Feature | Before | After |
|---------|--------|-------|
| **Preview visibility** | Only after selection | Inline in dropdown |
| **Truncation limit** | 40 chars | 60 chars |
| **Full value access** | Not available | Tooltip on hover |
| **Type indicators** | None | STR/NUM/ARR/OBJ badges |
| **Search scope** | Field path only | Path + sample value |
| **JSON depth** | 3 levels | 5 levels |
| **Popover width** | 320-400px | 400-500px |

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/agents/locations/WordPressFieldMapper.tsx` | Rich dropdown items with previews, type badges, tooltips |
| `supabase/functions/sync-wordpress-communities/index.ts` | Increase maxDepth from 3 to 5 |

---

## Expected Result

- Every field option shows its **sample value** directly in the dropdown
- Users can **search by content** (e.g., type "Springfield" to find city field)
- **Type badges** help identify arrays vs strings at a glance
- **Tooltips** reveal full values for truncated content
- **Deeper nesting** captures complex ACF structures
- Industry-leading UX matching Airtable, Zapier, and n8n

