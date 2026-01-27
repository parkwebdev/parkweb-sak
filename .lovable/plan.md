

# Plan: Add Collapsible Sidebar Menus

## Overview
Add collapse/expand functionality to the left-side section menus on both the **Ari Configurator** (`/ari`) and **Admin Prompts** pages. The sidebars will match the existing pattern from the Inbox conversations list, using the `LayoutPanelLeft` icon in the header that toggles between full width (240px) and collapsed width (48px).

## Visual Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                      PAGE LAYOUT                              │
├───────────┬──────────────────────────────┬───────────────────┤
│  Section  │                              │      Preview      │
│   Menu    │       Content Area           │       Panel       │
│ (240px)   │                              │     (375px)       │
│    ▼      │                              │         ▼         │
│ [◨] Icon  │                              │      [◧] Icon     │
│  Filled   │                              │       Filled      │
│  when     │                              │       when        │
│  visible  │                              │       visible     │
└───────────┴──────────────────────────────┴───────────────────┘

Collapsed state:
┌───┬─────────────────────────────────────┬───────────────────┐
│[◨]│         Content Area (flex-1)        │      Preview      │
│48px│                                     │                   │
└───┴─────────────────────────────────────┴───────────────────┘
```

## Technical Details

### Icon States
- **`LayoutPanelLeft`** - Used for left sidebars (section menus)
- **`LayoutPanelRight`** - Used for right panels (preview chat)
- Icons are **filled when the panel is visible**, unfilled when collapsed

### State Persistence
Each collapsed state is saved to localStorage with unique keys:
- `ari_sidebar_collapsed` - Ari Configurator sidebar
- `admin_prompts_sidebar_collapsed` - Admin Prompts sidebar

---

## Changes by File

### 1. AriSectionMenu Component
**File:** `src/components/agents/AriSectionMenu.tsx`

Add collapse props and header with toggle button:

```tsx
interface AriSectionMenuProps {
  activeSection: AriSection;
  onSectionChange: (section: AriSection) => void;
  isCollapsed: boolean;            // NEW
  onToggleCollapse: () => void;    // NEW
}
```

Changes:
- Import `LayoutPanelLeft` from `@/components/icons/LayoutPanelIcons`
- Import `Button` from `@/components/ui/button`
- Add `h-14` header row with collapse button (matching InboxNavSidebar pattern)
- Conditionally show nav items based on `isCollapsed`
- Animate width transition (240px → 48px)

Header structure when expanded:
```tsx
<div className="h-14 border-b flex items-center justify-between px-3">
  <span className="text-sm font-medium">Ari</span>
  <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
    <LayoutPanelLeft filled={!isCollapsed} />
  </Button>
</div>
```

Header structure when collapsed:
```tsx
<div className="h-14 border-b flex items-center justify-center">
  <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
    <LayoutPanelLeft filled={false} />
  </Button>
</div>
```

### 2. AdminPromptSectionMenu Component
**File:** `src/components/admin/prompts/AdminPromptSectionMenu.tsx`

Same pattern as AriSectionMenu:

```tsx
interface AdminPromptSectionMenuProps {
  activeSection: PromptSection;
  onSectionChange: (section: PromptSection) => void;
  isCollapsed: boolean;            // NEW
  onToggleCollapse: () => void;    // NEW
}
```

Changes:
- Import `LayoutPanelLeft` and `Button`
- Add header with "Prompts" title and collapse toggle
- Conditionally render nav content
- Width transition (240px → 48px)

### 3. AriConfigurator Page
**File:** `src/pages/AriConfigurator.tsx`

Add sidebar collapse state management:

```tsx
// Sidebar collapse state with localStorage persistence
const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  const saved = localStorage.getItem('ari_sidebar_collapsed');
  return saved === 'true';
});

useEffect(() => {
  localStorage.setItem('ari_sidebar_collapsed', String(sidebarCollapsed));
}, [sidebarCollapsed]);

const handleToggleSidebar = useCallback(() => {
  setSidebarCollapsed(prev => !prev);
}, []);
```

Pass props to `AriSectionMenu`:
```tsx
<AriSectionMenu
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  isCollapsed={sidebarCollapsed}
  onToggleCollapse={handleToggleSidebar}
/>
```

### 4. AdminPrompts Page
**File:** `src/pages/admin/AdminPrompts.tsx`

Add sidebar collapse state management (same pattern):

```tsx
// Sidebar collapse state with localStorage persistence
const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  const saved = localStorage.getItem('admin_prompts_sidebar_collapsed');
  return saved === 'true';
});

useEffect(() => {
  localStorage.setItem('admin_prompts_sidebar_collapsed', String(sidebarCollapsed));
}, [sidebarCollapsed]);

const handleToggleSidebar = useCallback(() => {
  setSidebarCollapsed(prev => !prev);
}, []);
```

Pass props to `AdminPromptSectionMenu`:
```tsx
<AdminPromptSectionMenu
  activeSection={activeSection}
  onSectionChange={handleSectionChange}
  isCollapsed={sidebarCollapsed}
  onToggleCollapse={handleToggleSidebar}
/>
```

---

## Visual Result

### Expanded State
```
┌────────────────────────────────────┐
│ Ari                          [◨◉] │ ← Filled icon (panel visible)
├────────────────────────────────────┤
│ CORE                               │
│ ▸ System Prompt                    │
│   Appearance                       │
│   Welcome Messages                 │
├────────────────────────────────────┤
│ ENGAGEMENT                         │
│   Lead Capture                     │
│   ...                              │
└────────────────────────────────────┘
w-[240px]
```

### Collapsed State
```
┌────┐
│[◨]│ ← Unfilled icon (panel hidden)
├────┤
│    │
│    │
│    │
└────┘
w-12 (48px)
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/agents/AriSectionMenu.tsx` | Add collapse props, header with toggle, conditional content |
| `src/components/admin/prompts/AdminPromptSectionMenu.tsx` | Add collapse props, header with toggle, conditional content |
| `src/pages/AriConfigurator.tsx` | Add sidebar collapse state with localStorage |
| `src/pages/admin/AdminPrompts.tsx` | Add sidebar collapse state with localStorage |

