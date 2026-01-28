

# Plan: Add Searchable Dropdown to WordPress Field Mapper

## Problem
The source field dropdowns in the WordPress Field Mapper contain many JSON fields (often 50+ fields from WordPress APIs). Scrolling through a long list to find the right field is tedious and error-prone. A search bar would make it much easier to find specific fields quickly.

## Solution
Replace the standard `Select` component with a searchable Combobox pattern using `Popover` + `Command` components (shadcn/ui pattern). This provides:
- Type-to-filter search functionality
- Keyboard navigation
- Visual feedback for selected item
- Same premium styling as the current design

---

## Visual Design

The new searchable dropdown will look like this when opened:

```text
┌────────────────────────────────────────┐
│  🔍  Search fields...                  │
├────────────────────────────────────────┤
│  acf.community_name              ✓     │
│  acf.address                           │
│  acf.city                              │
│  acf.state                             │
│  meta.price                            │
│  title.rendered                        │
│  ...                                   │
└────────────────────────────────────────┘
```

**Key Features:**
- Search input at the top with magnifying glass icon
- Monospace font for field paths (like current design)
- Check mark indicator for selected field
- "Don't import" option at top with separator
- Empty state when no matches found
- Same height trigger button as current design

---

## Technical Implementation

### File: `src/components/agents/locations/WordPressFieldMapper.tsx`

**1. Add Required Imports**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ArrowLeft, CheckCircle, Check, ChevronDown } from '@untitledui/icons';
```

**2. Create SearchableFieldSelect Component**

New internal component to handle the combobox logic:

```tsx
interface SearchableFieldSelectProps {
  availableFields: AvailableField[];
  selectedSource: string | null;
  onSelect: (source: string | null) => void;
  isMapped: boolean;
}

function SearchableFieldSelect({
  availableFields,
  selectedSource,
  onSelect,
  isMapped,
}: SearchableFieldSelectProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between bg-background border-border/60",
            "hover:border-primary/50 transition-colors rounded-lg shadow-sm",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isMapped && "border-primary/30"
          )}
        >
          {selectedSource ? (
            <code className="font-mono text-xs truncate">{selectedSource}</code>
          ) : (
            <span className="text-muted-foreground italic">Don't import</span>
          )}
          <ChevronDown size={16} className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search fields..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No fields found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__skip__"
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="text-muted-foreground italic"
              >
                <Check
                  size={16}
                  className={cn(
                    "mr-2 shrink-0",
                    selectedSource === null ? "opacity-100" : "opacity-0"
                  )}
                />
                Don't import
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {availableFields.map((field) => (
                <CommandItem
                  key={field.path}
                  value={field.path}
                  onSelect={() => {
                    onSelect(field.path);
                    setOpen(false);
                  }}
                >
                  <Check
                    size={16}
                    className={cn(
                      "mr-2 shrink-0",
                      selectedSource === field.path ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <code className="font-mono text-xs">{field.path}</code>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**3. Update MappingRow Component**

Replace the `Select` with the new `SearchableFieldSelect`:

```tsx
function MappingRow({ ... }: MappingRowProps) {
  // ... existing code ...
  
  return (
    <div className={cn(...)}>
      <div className="grid grid-cols-[1fr_80px_1fr] gap-4 p-5 items-center">
        {/* Source Column */}
        <div className="space-y-3">
          <SearchableFieldSelect
            availableFields={availableFields}
            selectedSource={selectedSource}
            onSelect={onSelect}
            isMapped={isMapped}
          />
          
          {/* Sample value preview - unchanged */}
          {sourceField && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/30">
              {/* ... */}
            </div>
          )}
        </div>
        
        {/* Rest remains unchanged */}
      </div>
    </div>
  );
}
```

---

## Accessibility

- `role="combobox"` and `aria-expanded` on trigger button
- Keyboard navigation via cmdk library (arrow keys, enter, escape)
- Focus management handled by Popover/Command
- Search input auto-focused when opened
- Visible focus rings on all interactive elements

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/agents/locations/WordPressFieldMapper.tsx` | Replace Select with searchable Combobox pattern |

---

## Expected Result

- Users can type to filter the long list of WordPress JSON fields
- Keyboard navigation works as expected (arrows, enter, escape)
- Selected field shows a check mark indicator
- Same premium visual styling maintained
- Significant UX improvement for sites with many custom fields

