
# Plan: Fix Field Mapper Column Widths & Auto Badge Design

## Problem Analysis

From the screenshot, I can see two distinct issues:

1. **Dropdown widths are inconsistent** - Each dropdown button is sized to fit its content (e.g., `acf.community_zip_code` is narrower than `acf.community_phone_number`). Despite using a unified grid with `1fr` columns, the **Button component inside uses `w-full` but doesn't enforce a minimum width**, so the content shrinks the button.

2. **"Auto" badge looks cheap** - The current green pill with checkmark (`bg-success/10 text-success`) clashes with the overall aesthetic. It's too attention-grabbing and doesn't feel integrated into the design.

---

## Root Cause

The grid uses `grid-cols-[1fr_48px_1fr]` which should give equal widths, but the issue is:
- The sheet is `sm:max-w-2xl` (672px max)
- After padding (px-4 × 2 = 32px), header (48px), and margins, each `1fr` column is roughly ~296px
- But the **Source Cell** has `space-y-2` with optional preview text below the dropdown
- The **dropdown Button doesn't stretch** because it's sized by the monospace code text inside

The fix requires enforcing the dropdown to **always fill its container width**.

---

## Solution

### 1. Enforce Full-Width Dropdowns

Change the grid to use **fixed pixel widths** for the source column instead of `1fr`:

```tsx
// Current: grid-cols-[1fr_48px_1fr]
// New: grid-cols-[240px_48px_1fr]
```

Or, keep `1fr` but ensure the Button has `w-full` applied correctly with an outer container.

### 2. Redesigned Auto Badge

Replace the green pill with a more subtle, integrated indicator:

**Option A - Subtle text suffix:**
```tsx
<span className="text-xs text-muted-foreground ml-1 font-normal">(auto)</span>
```

**Option B - Small icon only (no text):**
```tsx
<Sparkles size={14} className="text-primary opacity-60" />
```

**Option C - Muted badge (recommended):**
```tsx
<span className="text-2xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
  auto
</span>
```

---

## Technical Implementation

### File: `src/components/agents/locations/WordPressFieldMapper.tsx`

**1. Fixed Column Width for Source Field**

The source column should have a fixed minimum width to prevent content-based sizing:

```tsx
// Change grid template from flexible to fixed source column
// Header and rows both use:
<div className="grid grid-cols-[minmax(200px,1fr)_48px_1fr] transition-colors">
```

Or wrap the dropdown in a width-enforcing container:

```tsx
{/* Source Cell */}
<div className="px-4 py-4 space-y-2">
  <div className="w-full"> {/* Force full width */}
    <SearchableFieldSelect ... />
  </div>
  {/* Preview text */}
</div>
```

**2. Increase Sheet Width**

Given the long field paths like `acf.community_phone_number`, increasing the sheet width will give more breathing room:

In `WordPressIntegrationSheet.tsx`:
```tsx
// Current: sm:max-w-2xl (672px)
// New: sm:max-w-3xl (768px) for field-mapping step only
<SheetContent className={cn(
  "overflow-y-auto flex flex-col",
  connectionStep === 'field-mapping' ? "sm:max-w-3xl" : "sm:max-w-2xl"
)}>
```

**3. Subtle Auto Badge Redesign**

Replace the current loud green badge with a muted, elegant indicator:

```tsx
{isAutoDetected && (
  <span className="text-2xs text-muted-foreground/70 font-medium uppercase tracking-wide">
    auto
  </span>
)}
```

**4. Preview Text Cleanup**

Make the preview text more compact and consistent:

```tsx
{sourceField && (
  <p className="text-xs text-muted-foreground truncate pl-0.5">
    {formatSampleValue(sourceField.sampleValue)}
  </p>
)}
```

Remove the "Preview:" label to reduce visual noise.

---

## Visual Comparison

| Element | Before | After |
|---------|--------|-------|
| **Source column** | Content-sized (inconsistent) | Fixed min-width (consistent) |
| **Sheet width** | 672px | 768px on field-mapping step |
| **Auto badge** | Green pill with icon | Muted uppercase text label |
| **Preview label** | "Preview: value" | Just the value (cleaner) |

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/agents/locations/WordPressFieldMapper.tsx` | Fixed grid columns, subtle auto badge, cleaner preview |
| `src/components/agents/locations/WordPressIntegrationSheet.tsx` | Wider sheet for field-mapping step |

---

## Expected Result

- All source dropdowns are **exactly the same width**
- Auto-mapped fields show a subtle, non-distracting "auto" label
- More horizontal space for long WordPress field paths
- Cleaner overall appearance matching professional data mapping tools
