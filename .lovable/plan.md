
# Plan: Premium Airtable-Style Field Mapper UI

## Problem Summary
The current field mapper UI has multiple visual issues:
- Arrow/connector looks cheap (just a basic icon or dashed line)
- Dropdowns look bad (plain selects with poor styling)
- Visual hierarchy is unclear (everything blends together)
- Too cramped/dense (not enough breathing room)

You want an **Airtable-inspired** premium look with overall visual polish as the priority.

---

## Design Approach

### Airtable Visual Patterns
- **Clean card-based rows** with subtle borders and generous padding
- **Animated connection lines** between source and target (not just arrows)
- **Visual states** that clearly show mapped vs unmapped fields
- **Premium typography** with proper weight and spacing hierarchy
- **Soft colors** for backgrounds, not harsh contrasts

---

## UI Redesign

### Row Design (Card-Based)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌──────────────────────────────────────┐       ┌─────────────────────────────┐ │
│  │                                      │       │                             │ │
│  │  acf.community_name            ▾    ├───────┤  Community Name  *          │ │
│  │                                      │       │  Primary name/title         │ │
│  │  ┌────────────────────────────────┐  │       │                             │ │
│  │  │ "Prairie View MHC"             │  │       │                   ✓ auto    │ │
│  │  └────────────────────────────────┘  │       │                             │ │
│  │                                      │       │                             │ │
│  └──────────────────────────────────────┘       └─────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Visual Changes

| Element | Before | After |
|---------|--------|-------|
| **Row container** | Flat bg-muted/40 highlight | Subtle card with border, hover shadow lift |
| **Connector** | ArrowRight icon or dashed line | SVG curved/straight line with animated gradient |
| **Source dropdown** | Plain select trigger | Pill-style with monospace text, subtle border |
| **Sample preview** | Small muted box below | Integrated preview chip inside the dropdown area |
| **Target label** | Plain text | Bold with proper typography hierarchy |
| **Auto badge** | Secondary badge | Pill with subtle success color |
| **Spacing** | py-3 px-3 (cramped) | py-5 px-5 (generous breathing room) |

---

## Technical Implementation

### File: `src/components/agents/locations/WordPressFieldMapper.tsx`

**1. Row Component Redesign**

Replace the cramped grid with a premium card-based design:

```tsx
function MappingRow({ ... }) {
  return (
    <div className={cn(
      "group relative rounded-xl border transition-all duration-200",
      isMapped 
        ? "bg-card border-border shadow-sm" 
        : "bg-muted/30 border-transparent hover:border-border/50 hover:bg-card/50"
    )}>
      <div className="grid grid-cols-[1fr_80px_1fr] gap-4 p-5 items-center">
        {/* Source Card */}
        <div className="space-y-3">
          <Select ...>
            <SelectTrigger className="h-11 bg-background border-border/60 
              hover:border-primary/50 focus:border-primary 
              transition-colors rounded-lg shadow-sm">
              <SelectValue ... />
            </SelectTrigger>
            ...
          </Select>
          
          {/* Inline sample preview */}
          {sourceField && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 
              rounded-lg border border-border/30">
              <span className="text-2xs uppercase tracking-wide 
                text-muted-foreground font-medium">Preview</span>
              <span className="text-xs text-foreground truncate flex-1">
                {formatSampleValue(sourceField.sampleValue)}
              </span>
            </div>
          )}
        </div>
        
        {/* Connector */}
        <div className="flex justify-center items-center">
          <ConnectionLine isActive={isMapped} />
        </div>
        
        {/* Target Card */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-foreground">
              {targetField.label}
              {targetField.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </span>
            {isAutoDetected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 
                rounded-full bg-success/10 text-success text-2xs font-medium">
                <CheckCircle size={12} />
                Auto
              </span>
            )}
          </div>
          {targetField.description && (
            <p className="text-sm text-muted-foreground">
              {targetField.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**2. Premium Connection Line Component**

Create an SVG-based connector that looks premium:

```tsx
function ConnectionLine({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative w-full h-8 flex items-center justify-center">
      <svg 
        className="w-full h-6" 
        viewBox="0 0 80 24" 
        fill="none"
        aria-hidden="true"
      >
        {/* Background line */}
        <line 
          x1="0" y1="12" x2="80" y2="12" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeDasharray={isActive ? "0" : "4 4"}
          className={cn(
            "transition-all duration-300",
            isActive ? "text-primary" : "text-muted-foreground/30"
          )}
        />
        
        {/* Arrow head */}
        <polygon 
          points="72,6 80,12 72,18" 
          fill="currentColor"
          className={cn(
            "transition-all duration-300",
            isActive ? "text-primary" : "text-muted-foreground/30"
          )}
        />
        
        {/* Active dot at start */}
        {isActive && (
          <circle cx="4" cy="12" r="4" fill="currentColor" className="text-primary" />
        )}
      </svg>
    </div>
  );
}
```

**3. Header Redesign**

Make the header more prominent and spacious:

```tsx
<div className="flex items-center justify-between pb-6 border-b">
  <div className="space-y-1">
    <h2 className="text-lg font-semibold tracking-tight">
      Map {type === 'community' ? 'Community' : 'Property'} Fields
    </h2>
    {samplePostTitle && (
      <p className="text-sm text-muted-foreground">
        Using sample: <span className="font-medium text-foreground">{samplePostTitle}</span>
      </p>
    )}
  </div>
  
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground tabular-nums">
        {mappedCount}
      </span>
      <span className="text-sm text-muted-foreground">of {totalFields} mapped</span>
    </div>
    <Progress 
      value={progressPercent} 
      className="w-24 h-2.5" 
      variant={progressPercent === 100 ? "success" : "default"}
    />
  </div>
</div>
```

**4. Column Headers Redesign**

Cleaner, more prominent column headers:

```tsx
<div className="grid grid-cols-[1fr_80px_1fr] gap-4 py-4 px-5">
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-primary" />
    <span className="text-sm font-semibold text-foreground">
      Source Field
    </span>
    <span className="text-xs text-muted-foreground">(WordPress)</span>
  </div>
  <div /> {/* Connector spacer */}
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-foreground" />
    <span className="text-sm font-semibold text-foreground">
      Target Field
    </span>
    <span className="text-xs text-muted-foreground">(Database)</span>
  </div>
</div>
```

**5. Footer Redesign**

Cleaner button layout with proper spacing:

```tsx
<div className="flex items-center justify-between pt-6 border-t bg-muted/20 
  -mx-6 px-6 -mb-6 pb-6 rounded-b-[0.60rem]">
  <Button variant="ghost" size="default" onClick={onBack} disabled={isSaving}>
    <ArrowLeft size={16} className="mr-2" aria-hidden="true" />
    Back
  </Button>
  
  <div className="flex items-center gap-3">
    <Button
      variant="outline"
      onClick={() => onMappingsChange({})}
      disabled={isSaving || mappedCount === 0}
    >
      Clear All
    </Button>
    <Button onClick={onConfirm} disabled={isSaving || !allRequiredMapped}>
      {isSaving ? 'Saving...' : 'Save Mappings'}
    </Button>
  </div>
</div>
```

---

## Visual Polish Details

| Aspect | Implementation |
|--------|---------------|
| **Spacing** | Increase row padding from `p-3` to `p-5` |
| **Row gaps** | Increase from `space-y-0.5` to `space-y-3` |
| **Border radius** | Use `rounded-xl` (16px) for rows |
| **Shadows** | Add `shadow-sm` on mapped rows, `hover:shadow-md` on hover |
| **Transitions** | Add `transition-all duration-200` for smooth state changes |
| **Typography** | Target labels use `text-base font-semibold` |
| **Colors** | Use `bg-success/10 text-success` for auto badge |

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/agents/locations/WordPressFieldMapper.tsx` | Complete visual overhaul with premium styling |

---

## Expected Result

A field mapper that:
- Feels premium and polished like Airtable
- Has clear visual hierarchy (headers, rows, states)
- Uses generous spacing without feeling bloated
- Shows elegant animated connectors between fields
- Has smooth hover/focus transitions
- Clearly distinguishes mapped vs unmapped fields
