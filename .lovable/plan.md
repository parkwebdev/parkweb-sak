
# Plan: Use Custom CSV Icon for Import/Download CSV Actions

## Overview

Replace generic UntitledUI icons (`Upload01`, `Download01`) with the custom `CsvExportIcon` for all CSV-related import and download actions, matching the pattern used with `JsonExportIcon` for JSON operations.

---

## Current State

The project has a beautiful custom `CsvExportIcon` component (`src/components/admin/shared/CsvExportIcon.tsx`) that displays a document with a green "CSV" badge. However, several places still use generic UntitledUI icons for CSV operations.

---

## Files to Update

### 1. HelpArticlesManager.tsx - TopBar "Import CSV" Action

**Location:** Line 582  
**Current:** Uses `Upload01` icon  
**Change:** Use `CsvExportIcon` (the document icon provides clear context; "Import CSV" label indicates direction)

```tsx
// Before
icon: <Upload01 size={16} aria-hidden="true" />,

// After
icon: <CsvExportIcon size={16} />,
```

### 2. HelpArticlesManager.tsx - Fallback "Import CSV" Button  

**Location:** Line 786-787  
**Current:** Button has no icon  
**Change:** Add `CsvExportIcon` for consistency

```tsx
// Before
<Button variant="outline" size="sm" onClick={() => setBulkImportOpen(true)}>
  Import CSV
</Button>

// After
<Button variant="outline" size="sm" onClick={() => setBulkImportOpen(true)}>
  <CsvExportIcon size={16} className="mr-1.5" />
  Import CSV
</Button>
```

### 3. BulkImportDialog.tsx - "Download sample template" Link

**Location:** Line 322-325  
**Current:** Uses generic `Download01` icon  
**Change:** Use `CsvExportIcon` since it's downloading a CSV file

```tsx
// Before
<Download01 className="w-3.5 h-3.5" />
Download sample template

// After
<CsvExportIcon size={14} />
Download sample template
```

---

## Import Changes Required

### HelpArticlesManager.tsx
```tsx
// Add import
import { CsvExportIcon } from '@/components/admin/shared/CsvExportIcon';

// Can remove Upload01 from the untitledui imports if no longer needed elsewhere
```

### BulkImportDialog.tsx
```tsx
// Add import
import { CsvExportIcon } from '@/components/admin/shared/CsvExportIcon';

// Remove Download01 from the imports (line 15) since it won't be used
```

---

## Visual Consistency

After this change, all CSV-related buttons will show the distinctive green CSV document icon:

| Component | Action | Icon |
|-----------|--------|------|
| Help Articles TopBar | Import CSV | 📄 CSV (green) |
| Help Articles Fallback | Import CSV | 📄 CSV (green) |
| Bulk Import Dialog | Download template | 📄 CSV (green) |
| Leads TopBar | Export CSV | 📄 CSV (green) ✅ (already correct) |
| Admin Accounts | Export | 📄 CSV (green) ✅ (already correct) |
| Admin Audit Log | Export CSV | 📄 CSV (green) ✅ (already correct) |

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/agents/HelpArticlesManager.tsx` | Import `CsvExportIcon`, use for Import CSV action and button |
| `src/components/agents/BulkImportDialog.tsx` | Import `CsvExportIcon`, replace `Download01` for template download |

---

## Design Rationale

Using the same CSV document icon for both import and export follows the existing pattern with `JsonExportIcon` (used for both "Import" and "Export" in the prompts dropdown). The action label ("Import CSV", "Export CSV", "Download template") provides the directional context, while the distinctive file-type icon (green CSV badge) immediately communicates what type of file is involved.
