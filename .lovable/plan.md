
# Plan: Redesign WordPress Field Mapper UI

## Problem Summary

The current field mapper UI is cramped, confusing, and difficult to use. It shows target fields on the left with a small dropdown on the right, grouped by category with collapsibles. This pattern is unintuitive compared to standard CSV importers that users are familiar with.

---

## Design Goals

1. **Wider sheet** - Expand to cover the main container completely
2. **Two-column table layout** - Like CSV importers: Source (left) → Target (right)
3. **Visual sample data preview** - Show what data will be imported
4. **Clear 1:1 mapping visualization** - Arrow or connector between columns
5. **No nested collapsibles** - All fields visible, scrollable
6. **Progress indication** - Show how many fields are mapped

---

## UI Design

### Sheet Width

Expand from `sm:max-w-2xl` (672px) to a new `size="full"` variant that fills the main container area. Use `sm:max-w-[calc(100vw-80px)]` to account for sidebar width (collapsed ~48px + padding).

### Two-Column Table Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  WordPress Field Mapping                                   [Skip] [Confirm]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Sample: "Prairie View MHC"                              6 of 12 fields mapped │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐     ┌─────────────────────────────────────┐ │
│  │  SOURCE (WordPress)         │     │  TARGET (Your Database)             │ │
│  ├─────────────────────────────┤     ├─────────────────────────────────────┤ │
│  │                             │     │                                     │ │
│  │  acf.community_name         │ ──▶ │  Community Name *                   │ │
│  │  "Prairie View MHC"         │     │                                     │ │
│  │                             │     │                                     │ │
│  ├─────────────────────────────┤     ├─────────────────────────────────────┤ │
│  │                             │     │                                     │ │
│  │  acf.street_address         │ ──▶ │  Street Address                     │ │
│  │  "1234 Main Street"         │     │                                     │ │
│  │                             │     │                                     │ │
│  ├─────────────────────────────┤     ├─────────────────────────────────────┤ │
│  │                             │     │                                     │ │
│  │  [Select source field ▼]    │ ──▶ │  City                               │ │
│  │                             │     │                                     │ │
│  │                             │     │                                     │ │
│  └─────────────────────────────┘     └─────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key UI Components

**Row Structure (for each target field):**
- Left side: Source field dropdown with sample value preview below
- Center: Visual arrow/connector (→) showing the mapping
- Right side: Target field label with description

**Source Field Dropdown:**
- Full-width within its column
- Shows field path in monospace font
- Sample value preview below when selected
- "Don't import" option at top (styled differently)

**Visual Indicators:**
- Mapped rows: Solid arrow, full opacity
- Unmapped rows: Dashed line, muted opacity
- Required fields: Red asterisk on target label
- Auto-detected: Small badge on source side

---

## Technical Implementation

### Part 1: Add Sheet Size Variant

**File:** `src/components/ui/sheet.tsx`

Add a `size` prop to `SheetContent` with a `full` variant:

```tsx
const sheetVariants = cva(
  "fixed z-50 bg-background p-6 rounded-[0.60rem] border shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: { /* existing */ },
      size: {
        default: "",
        full: "!w-[calc(100vw-100px)]", // Override w-3/4 and sm:max-w-*
      }
    },
    defaultVariants: {
      side: "right",
      size: "default",
    },
  }
)
```

### Part 2: Rewrite WordPressFieldMapper Component

**File:** `src/components/agents/locations/WordPressFieldMapper.tsx`

Complete rewrite with new layout:

**Structure:**
```tsx
<div className="flex flex-col h-full">
  {/* Header */}
  <div className="flex items-center justify-between pb-4 border-b">
    <div>
      <h2 className="text-base font-semibold">Map Fields</h2>
      <p className="text-sm text-muted-foreground">
        Sample: {samplePostTitle}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {mappedCount} of {totalFields} fields mapped
      </span>
      <Progress value={(mappedCount / totalFields) * 100} className="w-24 h-2" />
    </div>
  </div>
  
  {/* Column Headers */}
  <div className="grid grid-cols-[1fr_48px_1fr] gap-4 py-3 border-b sticky top-0 bg-background z-10">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Source (WordPress)
    </div>
    <div /> {/* Arrow column */}
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Target (Database)
    </div>
  </div>
  
  {/* Scrollable Mapping Rows */}
  <div className="flex-1 overflow-y-auto py-2 space-y-1">
    {targetFields.map((field) => (
      <MappingRow 
        key={field.key}
        targetField={field}
        sourceFields={availableFields}
        selectedSource={currentMappings[field.key]}
        suggestedSource={suggestedMappings[field.key]}
        onSelect={(source) => handleFieldSelect(field.key, source)}
      />
    ))}
  </div>
  
  {/* Footer Actions */}
  <div className="flex items-center justify-between pt-4 border-t">
    <Button variant="ghost" onClick={onBack}>Back</Button>
    <div className="flex gap-2">
      <Button variant="outline" onClick={onSkip}>Skip</Button>
      <Button onClick={onConfirm} disabled={!allRequiredMapped}>
        Save Mappings
      </Button>
    </div>
  </div>
</div>
```

**MappingRow Component:**
```tsx
function MappingRow({ targetField, sourceFields, selectedSource, suggestedSource, onSelect }) {
  const sourceField = sourceFields.find(f => f.path === selectedSource);
  const isMapped = !!selectedSource;
  
  return (
    <div className={cn(
      "grid grid-cols-[1fr_48px_1fr] gap-4 items-center py-3 px-2 rounded-lg",
      isMapped ? "bg-muted/30" : "bg-transparent"
    )}>
      {/* Source Column */}
      <div className="space-y-1">
        <Select value={selectedSource || '__skip__'} onValueChange={...}>
          <SelectTrigger className="h-10 bg-background">
            <SelectValue placeholder="Select source field..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="__skip__" className="text-muted-foreground">
              Don't import
            </SelectItem>
            <SelectSeparator />
            {sourceFields.map(field => (
              <SelectItem key={field.path} value={field.path}>
                <code className="font-mono text-xs">{field.path}</code>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Sample value preview */}
        {sourceField && (
          <div className="px-3 py-1.5 bg-muted rounded text-xs text-muted-foreground truncate">
            {formatSampleValue(sourceField.sampleValue)}
          </div>
        )}
      </div>
      
      {/* Arrow Column */}
      <div className="flex justify-center">
        {isMapped ? (
          <ArrowRight size={20} className="text-primary" />
        ) : (
          <div className="w-5 border-t border-dashed border-muted-foreground/40" />
        )}
      </div>
      
      {/* Target Column */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {targetField.label}
            {targetField.required && <span className="text-destructive ml-0.5">*</span>}
          </span>
          {selectedSource === suggestedSource && suggestedSource && (
            <Badge variant="secondary" size="sm">auto</Badge>
          )}
        </div>
        {targetField.description && (
          <p className="text-xs text-muted-foreground">{targetField.description}</p>
        )}
      </div>
    </div>
  );
}
```

### Part 3: Update WordPressIntegrationSheet

**File:** `src/components/agents/locations/WordPressIntegrationSheet.tsx`

When in `field-mapping` step, use the full-width sheet:

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent 
    className={cn(
      "overflow-y-auto",
      connectionStep === 'field-mapping' 
        ? "sm:max-w-[calc(100vw-100px)]" 
        : "sm:max-w-2xl"
    )}
  >
```

Also update the field mapping section to give it full height:

```tsx
{connectionStep === 'field-mapping' && (
  <div className="flex-1 min-h-0">
    <WordPressFieldMapper
      type={fieldMappingType}
      availableFields={...}
      currentMappings={...}
      suggestedMappings={...}
      onMappingsChange={...}
      onConfirm={handleFieldMappingConfirm}
      onBack={handleFieldMappingBack}
      onSkip={handleSkipFieldMapping}
      samplePostTitle={...}
    />
  </div>
)}
```

---

## Visual Improvements Summary

| Before | After |
|--------|-------|
| Target on left, source dropdown on right | Source on left, target on right (natural reading flow) |
| Grouped by category with collapsibles | Flat list, all visible |
| Small 200px dropdown | Full-width dropdown with sample preview |
| No progress indication | Progress bar + "X of Y mapped" |
| Cramped sm:max-w-2xl sheet | Full-width sheet covering main content |
| Text-only connection | Visual arrow between source → target |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/sheet.tsx` | Add size variant for full-width sheets |
| `src/components/agents/locations/WordPressFieldMapper.tsx` | Complete rewrite with two-column table layout |
| `src/components/agents/locations/WordPressIntegrationSheet.tsx` | Use full-width sheet for field mapping step |

---

## Accessibility

- All dropdowns have proper labels
- Arrow icons are decorative (`aria-hidden="true"`)
- Progress bar has `aria-valuenow` and `aria-valuemax`
- Required fields indicated with both asterisk and `aria-required`
- Keyboard navigation works through all rows
