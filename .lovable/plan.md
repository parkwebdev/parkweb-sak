
# Plan: Make WordPress Integration Sheet Wider

## Current State

The WordPress integration sheet uses a narrow width:
- `SheetContent className="sm:max-w-md"` (448px max-width)
- Base sheet variant: `sm:max-w-sm` (384px)

This is too narrow for the field mapping UI which shows:
- Target field labels and descriptions
- Source field dropdowns with long field paths
- Sample values preview

## Solution

Widen the sheet to `sm:max-w-xl` (576px) or `sm:max-w-2xl` (672px) to provide adequate space for the field mapping interface.

## Changes

| File | Change |
|------|--------|
| `src/components/agents/locations/WordPressIntegrationSheet.tsx` | Change `sm:max-w-md` to `sm:max-w-2xl` on SheetContent |

## Technical Details

**Line 390** in WordPressIntegrationSheet.tsx:
```tsx
// BEFORE
<SheetContent className="sm:max-w-md overflow-y-auto">

// AFTER
<SheetContent className="sm:max-w-2xl overflow-y-auto">
```

This increases the sheet width from 448px to 672px, giving the field mapper enough room to display:
- Full field labels without truncation
- Dropdown selects with readable field paths like `acf.community_details.address`
- Sample values alongside the mapping controls
