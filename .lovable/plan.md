
# Plan: Standardize Edit Icons to Edit05 (Pencil with Square)

## Overview

Ensure all **edit action buttons** across the app consistently use `Edit05` (pencil with square border) instead of the plain pencil variants (`Edit02`, `Edit03`).

---

## Icon Reference

| Icon | Visual | Usage |
|------|--------|-------|
| `Edit05` | Pencil with square | **Standard for edit actions** (buttons, menus) |
| `Edit02` | Plain pencil | Activity logs, status indicators (not actions) |
| `Edit03` | Different pencil | Should not be used |

---

## Files to Update

### 1. `src/components/admin/plans/PlanActions.tsx`

**Change:** `Edit02` → `Edit05`

```tsx
// Before
import { Edit02, Trash01 } from '@untitledui/icons';

// After
import { Edit05, Trash01 } from '@untitledui/icons';
```

Update both the quick action icon and menu item icon.

---

### 2. `src/components/admin/emails/EmailTemplateList.tsx`

**Change:** `Edit02` → `Edit05`

```tsx
// Before
import { Eye, Edit02, Send01, ... } from '@untitledui/icons';

// After
import { Eye, Edit05, Send01, ... } from '@untitledui/icons';
```

Update the edit button in the actions cell.

---

### 3. `src/components/agents/locations/WordPressIntegrationSheet.tsx`

**Change:** `Edit02` → `Edit05`

```tsx
// Before
import { ..., Edit02, ... } from '@untitledui/icons';

// After
import { ..., Edit05, ... } from '@untitledui/icons';
```

Update the "Edit URL" button.

---

### 4. `src/components/agents/sections/AriWebhooksSection.tsx`

**Change:** `Edit03` → `Edit05`

```tsx
// Before
import { Link03, Trash01, Eye, Edit03, PlayCircle, Code01 } from '@untitledui/icons';

// After
import { Link03, Trash01, Eye, Edit05, PlayCircle, Code01 } from '@untitledui/icons';
```

Update the edit webhook button.

---

### 5. `src/components/agents/sections/AriCustomToolsSection.tsx`

**Change:** `Edit03` → `Edit05`

```tsx
// Before
import { Trash01, Link03, Edit03, PlayCircle, ... } from '@untitledui/icons';

// After
import { Trash01, Link03, Edit05, PlayCircle, ... } from '@untitledui/icons';
```

Update the edit tool button.

---

### 6. `src/components/admin/knowledge/VideoNodeView.tsx`

**Change:** `Edit03` → `Edit05`

```tsx
// Before
import { Edit03, Trash01 } from '@untitledui/icons';

// After
import { Edit05, Trash01 } from '@untitledui/icons';
```

Update the edit video button.

---

## Files NOT Changing (Correct Usage)

These files use `Edit02` for **activity/event indicators** (not action buttons), which is the correct semantic use:

| File | Usage | Why Edit02 is correct |
|------|-------|----------------------|
| `LeadActivityPanel.tsx` | `field_updated` activity icon | Represents "was edited" (past tense) |
| `AuditLogTable.tsx` | `plan_update`, `article_update` event icons | Represents historical events |

---

## Summary

| File | Before | After |
|------|--------|-------|
| `PlanActions.tsx` | Edit02 | Edit05 |
| `EmailTemplateList.tsx` | Edit02 | Edit05 |
| `WordPressIntegrationSheet.tsx` | Edit02 | Edit05 |
| `AriWebhooksSection.tsx` | Edit03 | Edit05 |
| `AriCustomToolsSection.tsx` | Edit03 | Edit05 |
| `VideoNodeView.tsx` | Edit03 | Edit05 |

**Total:** 6 files updated for icon consistency
