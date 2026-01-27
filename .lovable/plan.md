
# Plan: Add Collapsible Preview Panels with Icon Toggle

## Overview
Add the same collapse functionality from the Inbox page to both the Ari Configurator and Admin Prompts preview panels. The icon should be **filled when the panel is visible** and **unfilled when collapsed** (reversing the current inbox behavior).

## Technical Changes

### 1. Centralize Layout Panel Icons
**File:** `src/components/icons/LayoutPanelIcons.tsx` (new)

Create a shared icon file for `LayoutPanelRight` to avoid duplication across components:

```tsx
// Custom SVG with filled prop
// LayoutPanelRight - panel on right side (for preview columns)
export function LayoutPanelRight({ 
  filled = false, 
  className 
}: { 
  filled?: boolean; 
  className?: string 
}) { /* SVG implementation */ }
```

### 2. Update AriPreviewColumn Component
**File:** `src/components/agents/AriPreviewColumn.tsx`

Add collapse functionality:
- Add `isCollapsed` and `onToggleCollapse` props
- Add sticky header with collapse button
- Animate width transition (375px → 48px collapsed)
- Use `LayoutPanelRight` icon with `filled={!isCollapsed}` (filled when visible)

```tsx
interface AriPreviewColumnProps {
  agentId: string;
  primaryColor?: string;
  contactFormPreview?: ContactFormConfig | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}
```

### 3. Update AdminPromptPreviewPanel Component
**File:** `src/components/admin/prompts/AdminPromptPreviewPanel.tsx`

Add collapse functionality:
- Add `isCollapsed` and `onToggleCollapse` props
- Add header row with "Test Chat" title and collapse button
- Animate width transition (360px → 48px collapsed)
- Use `LayoutPanelRight` icon with `filled={!isCollapsed}` (filled when visible)

### 4. Update AriConfigurator Page
**File:** `src/pages/AriConfigurator.tsx`

Manage collapse state:
- Add `previewCollapsed` state with localStorage persistence
- Pass `isCollapsed` and `onToggleCollapse` props to `AriPreviewColumn`

```tsx
const [previewCollapsed, setPreviewCollapsed] = useState(() => {
  const saved = localStorage.getItem('ari_preview_collapsed');
  return saved === 'true';
});

// Persist to localStorage
useEffect(() => {
  localStorage.setItem('ari_preview_collapsed', String(previewCollapsed));
}, [previewCollapsed]);
```

### 5. Update AdminPrompts Page
**File:** `src/pages/admin/AdminPrompts.tsx`

Manage collapse state:
- Add `previewCollapsed` state with localStorage persistence
- Pass `isCollapsed` and `onToggleCollapse` props to `AdminPromptPreviewPanel`

### 6. Fix Existing Inbox Icon States (Reversal)
**Files:**
- `src/components/conversations/ConversationsList.tsx`
- `src/components/conversations/VirtualizedConversationsList.tsx`
- `src/components/conversations/ConversationMetadataPanel.tsx`

Change icon logic from `filled={isCollapsed}` to `filled={!isCollapsed}`:
- When panel is **visible** → icon is **filled** (active state)
- When panel is **collapsed** → icon is **unfilled** (inactive state)

---

## Visual Behavior

| State | Panel Width | Icon State |
|-------|-------------|------------|
| Expanded (visible) | 375px / 360px | **Filled** |
| Collapsed | 48px | Unfilled |

## Accessibility
- Button has `aria-label` describing the action: "Collapse preview" / "Expand preview"
- Width transition uses CSS `transition-all duration-200 ease-in-out`

## Files Changed
1. `src/components/icons/LayoutPanelIcons.tsx` — New file with centralized icon
2. `src/components/agents/AriPreviewColumn.tsx` — Add collapse support
3. `src/components/admin/prompts/AdminPromptPreviewPanel.tsx` — Add collapse support
4. `src/pages/AriConfigurator.tsx` — Manage collapse state
5. `src/pages/admin/AdminPrompts.tsx` — Manage collapse state
6. `src/components/conversations/ConversationsList.tsx` — Reverse icon fill logic
7. `src/components/conversations/VirtualizedConversationsList.tsx` — Reverse icon fill logic
8. `src/components/conversations/ConversationMetadataPanel.tsx` — Reverse icon fill logic
