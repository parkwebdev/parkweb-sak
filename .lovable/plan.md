
# Plan: Consolidate Preview Panel Headers

## Overview
Remove the duplicate "Preview"/"Test Chat" header row from the wrapper components and integrate the collapse toggle directly into the existing header row within `PreviewChat` and `PromptTestChat`. Also remove the redundant refresh button since "Clear conversation" is already in the dropdown menu.

## Current Structure Problem
```
AriPreviewColumn
├── Header Row (with "Preview" + collapse button) ← REMOVE THIS
└── PreviewChat
    ├── Header Row (with "Preview" + dots + refresh) ← ADD COLLAPSE HERE
    └── Messages + Input

AdminPromptPreviewPanel  
├── Header Row (with "Test Chat" + collapse button) ← REMOVE THIS
└── PromptTestChat
    ├── Header Row (with "Preview" + dots + refresh) ← ADD COLLAPSE HERE
    └── Messages + Input
```

## Target Structure
```
AriPreviewColumn
└── PreviewChat
    ├── Header Row (with "Preview" + dots + COLLAPSE) ← Unified
    └── Messages + Input

AdminPromptPreviewPanel
└── PromptTestChat
    ├── Header Row (with "Preview" + badge + dots + COLLAPSE) ← Unified
    └── Messages + Input
```

---

## Technical Changes

### 1. Update PreviewChat Component
**File:** `src/components/agents/PreviewChat.tsx`

Changes:
- Add `isCollapsed` and `onToggleCollapse` props
- Remove the `RefreshCw01` refresh button (line 251-258)
- Add `LayoutPanelRight` collapse button after the dots menu
- Import `LayoutPanelRight` from `@/components/icons/LayoutPanelIcons`

```tsx
interface PreviewChatProps {
  agentId: string;
  primaryColor?: string;
  contactFormPreview?: ContactFormConfig;
  isCollapsed?: boolean;        // NEW
  onToggleCollapse?: () => void; // NEW
}
```

Updated header (lines 229-260):
```tsx
<div className="flex items-center justify-between px-4 py-3 border-b">
  <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
    Preview
  </span>
  <div className="flex items-center gap-1">
    <DropdownMenu>
      {/* ... existing dots menu ... */}
    </DropdownMenu>
    {/* Remove refresh button */}
    {/* Add collapse button */}
    {onToggleCollapse && (
      <IconButton 
        variant="ghost" 
        size="sm" 
        label={isCollapsed ? "Expand preview" : "Collapse preview"}
        onClick={onToggleCollapse}
      >
        <LayoutPanelRight filled={!isCollapsed} size={16} />
      </IconButton>
    )}
  </div>
</div>
```

### 2. Update PromptTestChat Component
**File:** `src/components/admin/prompts/PromptTestChat.tsx`

Changes:
- Add `isCollapsed` and `onToggleCollapse` props
- Remove the `RefreshCw01` refresh button (line 198-205)
- Add `LayoutPanelRight` collapse button after the dots menu
- Import `LayoutPanelRight` from `@/components/icons/LayoutPanelIcons`

```tsx
interface PromptTestChatProps {
  draftPrompts?: PromptOverrides;
  testDraftMode?: boolean;
  isCollapsed?: boolean;        // NEW
  onToggleCollapse?: () => void; // NEW
}
```

### 3. Update AriPreviewColumn Wrapper
**File:** `src/components/agents/AriPreviewColumn.tsx`

Changes:
- Remove the header row entirely (lines 48-65)
- Pass `isCollapsed` and `onToggleCollapse` props to `PreviewChat`
- Simplify to just the container with content

```tsx
export function AriPreviewColumn({
  agentId,
  primaryColor,
  contactFormPreview,
  isCollapsed,
  onToggleCollapse,
}: AriPreviewColumnProps) {
  return (
    <div 
      className={cn(
        "flex-shrink-0 border-l bg-card hidden xl:flex flex-col transition-all duration-200 ease-in-out overflow-hidden",
        isCollapsed ? "w-12" : "w-[375px]"
      )}
    >
      {/* No separate header - PreviewChat has its own */}
      <div 
        className={cn(
          "flex-1 min-h-0 flex flex-col transition-opacity duration-200",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}
      >
        <PreviewChat 
          agentId={agentId}
          primaryColor={primaryColor}
          contactFormPreview={contactFormPreview || undefined}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    </div>
  );
}
```

### 4. Update AdminPromptPreviewPanel Wrapper
**File:** `src/components/admin/prompts/AdminPromptPreviewPanel.tsx`

Changes:
- Remove the header row entirely (lines 42-59)
- Pass `isCollapsed` and `onToggleCollapse` props to `PromptTestChat`
- Keep the draft toggle bar (it shows below the header when there are unsaved changes)

---

## Visual Result

**Before (2 header rows):**
```
┌─────────────────────────────┐
│ Preview          [collapse] │  ← Wrapper header (REMOVE)
├─────────────────────────────┤
│ PREVIEW        [⋮] [↻]      │  ← Chat header
├─────────────────────────────┤
│                             │
│     (messages area)         │
│                             │
└─────────────────────────────┘
```

**After (single header row):**
```
┌─────────────────────────────┐
│ PREVIEW        [⋮] [◧]      │  ← Unified header with collapse
├─────────────────────────────┤
│                             │
│     (messages area)         │
│                             │
└─────────────────────────────┘
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/agents/PreviewChat.tsx` | Add collapse props, remove refresh, add collapse button |
| `src/components/admin/prompts/PromptTestChat.tsx` | Add collapse props, remove refresh, add collapse button |
| `src/components/agents/AriPreviewColumn.tsx` | Remove header row, pass props to PreviewChat |
| `src/components/admin/prompts/AdminPromptPreviewPanel.tsx` | Remove header row, pass props to PromptTestChat |
