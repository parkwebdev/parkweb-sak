

# Plan: True Column-Aligned Field Mapper Layout

## Problem
The current card-per-row approach causes inconsistent column widths because:
- Each row has its own independent grid
- Dropdown widths vary based on content
- The sample preview box appears conditionally, causing height inconsistency
- Visual alignment between rows is lost

## Solution: Table-Style Layout
Switch from individual cards to a true **column-aligned table layout** where:
- A single parent grid controls column widths for ALL rows
- Source and Target columns have consistent, fixed widths
- Each row is a sub-element within the grid, not an independent card
- Dropdowns stretch to fill their column consistently

---

## Visual Design

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│  ● Source Field (WordPress)           │      │  ● Target Field (Database)     │
├────────────────────────────────────────┼──────┼────────────────────────────────┤
│  ┌──────────────────────────────────┐  │      │                                │
│  │  acf.community_name          ▾   │  │ ───► │  Community Name *              │
│  └──────────────────────────────────┘  │      │  Primary name/title            │
│  Preview: "Prairie View MHC"           │      │                         ✓ Auto │
├────────────────────────────────────────┼──────┼────────────────────────────────┤
│  ┌──────────────────────────────────┐  │      │                                │
│  │  acf.address                 ▾   │  │ ───► │  Street Address                │
│  └──────────────────────────────────┘  │      │                                │
├────────────────────────────────────────┼──────┼────────────────────────────────┤
│  ┌──────────────────────────────────┐  │      │                                │
│  │  Don't import                ▾   │  │ - - -│  City                          │
│  └──────────────────────────────────┘  │      │                                │
└────────────────────────────────────────┴──────┴────────────────────────────────┘
```

**Key Visual Changes:**
- All source dropdowns have **identical width** 
- All target labels align perfectly
- Connector column is a fixed-width separator
- Rows are separated by subtle borders, not individual cards
- Preview text is inline below dropdown (only when mapped)

---

## Technical Implementation

### File: `src/components/agents/locations/WordPressFieldMapper.tsx`

**1. New Layout Structure**

Replace independent row cards with a unified grid container:

```tsx
{/* Unified Table Container */}
<div className="flex-1 overflow-y-auto min-h-0">
  <div className="border rounded-xl overflow-hidden">
    {/* Column Headers - Inside the table */}
    <div className="grid grid-cols-[1fr_48px_1fr] bg-muted/30 border-b sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-sm font-semibold">Source Field</span>
        <span className="text-xs text-muted-foreground">(WordPress)</span>
      </div>
      <div className="flex items-center justify-center">
        {/* Connector header placeholder */}
      </div>
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-foreground" />
        <span className="text-sm font-semibold">Target Field</span>
        <span className="text-xs text-muted-foreground">(Database)</span>
      </div>
    </div>
    
    {/* Rows */}
    {targetFields.map((field, index) => (
      <MappingRow key={field.key} ... isLast={index === targetFields.length - 1} />
    ))}
  </div>
</div>
```

**2. Simplified MappingRow as Table Row**

Each row uses the same grid columns as the parent:

```tsx
function MappingRow({ ..., isLast }: MappingRowProps & { isLast: boolean }) {
  return (
    <div className={cn(
      "grid grid-cols-[1fr_48px_1fr] transition-colors",
      !isLast && "border-b",
      isMapped ? "bg-card" : "bg-background hover:bg-muted/20"
    )}>
      {/* Source Cell */}
      <div className="px-4 py-4 space-y-2">
        <SearchableFieldSelect ... />
        {sourceField && (
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium">Preview:</span> {formatSampleValue(sourceField.sampleValue)}
          </p>
        )}
      </div>
      
      {/* Connector Cell */}
      <div className="flex items-center justify-center">
        <ConnectionLine isActive={isMapped} />
      </div>
      
      {/* Target Cell */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">
            {targetField.label}
            {targetField.required && <span className="text-destructive ml-1">*</span>}
          </span>
          {isAutoDetected && (
            <span className="...">✓ Auto</span>
          )}
        </div>
        {targetField.description && (
          <p className="text-xs text-muted-foreground mt-1">{targetField.description}</p>
        )}
      </div>
    </div>
  );
}
```

**3. Narrower Connector Column**

Reduce connector from 80px to 48px for tighter spacing:

```tsx
// Old: grid-cols-[1fr_80px_1fr]
// New: grid-cols-[1fr_48px_1fr]

function ConnectionLine({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center h-full">
      <svg className="w-8 h-4" viewBox="0 0 32 16" ...>
        <line x1="0" y1="8" x2="24" y2="8" ... />
        <polygon points="22,4 30,8 22,12" ... />
      </svg>
    </div>
  );
}
```

**4. Dropdown Fixed Width**

The popover content width now uses a fixed min-width instead of trigger width:

```tsx
<PopoverContent 
  className="min-w-[280px] w-[var(--radix-popover-trigger-width)] p-0" 
  align="start"
>
```

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Layout** | Independent card per row | Unified table with shared grid columns |
| **Column widths** | Vary per card | Fixed and consistent across all rows |
| **Connector width** | 80px | 48px (tighter) |
| **Row separation** | Margin + border per card | Single border between rows |
| **Preview** | Separate box with border | Inline text below dropdown |
| **Visual alignment** | Poor (grid per row) | Perfect (single grid for all) |

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/agents/locations/WordPressFieldMapper.tsx` | Convert to table-based layout with unified grid |

---

## Expected Result

- All source dropdowns are **exactly the same width**
- All target labels align **perfectly** across rows
- The entire mapper looks like a proper **data table**, not disconnected cards
- Cleaner, more professional appearance matching Airtable's column-to-column mapping style

