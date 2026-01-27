
# Plan: Add Collapsible Main Sidebar

## Overview
Add the same collapse/expand functionality from the Inbox and preview panels to the main navigation sidebar. The implementation will:
- Use `LayoutPanelLeft` icon (filled when expanded, unfilled when collapsed)
- Persist state to localStorage
- Animate width transition (240px → 48px)
- Show only a toggle button when collapsed

This applies to **both** user-side (regular navigation) and admin-side (/admin/* routes) since they share the same `Sidebar.tsx` component.

---

## Technical Changes

### 1. Update AppLayout to Manage Sidebar Collapse State
**File:** `src/components/layout/AppLayout.tsx`

Add collapse state management at the layout level with localStorage persistence:

```tsx
const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sidebar_collapsed') === 'true';
});

useEffect(() => {
  localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
}, [sidebarCollapsed]);

const toggleSidebar = useCallback(() => {
  setSidebarCollapsed(prev => !prev);
}, []);
```

Pass props to Sidebar:
```tsx
<Sidebar 
  isCollapsed={sidebarCollapsed} 
  onToggleCollapse={toggleSidebar}
  onClose={() => setSidebarOpen(false)} 
/>
```

### 2. Update Sidebar Component
**File:** `src/components/Sidebar.tsx`

**Changes:**
- Add `isCollapsed` and `onToggleCollapse` props
- Import `LayoutPanelLeft` from `@/components/icons/LayoutPanelIcons`
- Add collapse toggle button in the header area
- Animate width (240px → 48px)
- Hide content with `opacity-0 invisible h-0` when collapsed
- Always show the toggle button for expansion

**Updated Props Interface:**
```tsx
interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}
```

**Visual Layout When Collapsed:**
```
┌────────┐
│  [◧]   │  ← Toggle button centered in 48px column
└────────┘
```

**Visual Layout When Expanded:**
```
┌──────────────────────────┐
│ [Logo]           [◨]    │  ← Toggle in header
├──────────────────────────┤
│ [🔍 Search...]           │
│ ────────────────────     │
│ Dashboard                │
│ Ari                      │
│ Inbox                    │
│ ...                      │
└──────────────────────────┘
```

### 3. Icon Logic
Use `LayoutPanelLeft` (left-side panel icon) since the sidebar is on the left:
- **Expanded (visible)** → `filled={true}` (active state)
- **Collapsed** → `filled={false}` (inactive state)

This matches the reversed icon behavior we just implemented for preview panels.

---

## Implementation Details

### Sidebar.tsx Changes

**Header Section Update (lines 194-215):**
```tsx
<header className="w-full px-2 mb-6">
  <div className="flex items-center justify-between">
    {isCollapsed ? (
      // Collapsed: show only toggle button
      <button
        onClick={onToggleCollapse}
        className="p-2 rounded-md hover:bg-white/5 text-white/60 hover:text-white mx-auto"
        aria-label="Expand sidebar"
      >
        <LayoutPanelLeft filled={false} className="h-4 w-4" />
      </button>
    ) : (
      <>
        {/* Normal header content */}
        {isPilotTeamMember && isOnAdminRoute ? (
          <div className="flex items-center gap-2">
            <PilotLogo className="h-6 w-6 text-white flex-shrink-0" />
            <span className="text-sm font-semibold text-white">Admin</span>
          </div>
        ) : (
          <PilotLogo className="h-6 w-6 text-white flex-shrink-0" />
        )}
        
        {/* Desktop collapse toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white"
            aria-label="Collapse sidebar"
          >
            <LayoutPanelLeft filled={true} className="h-4 w-4" />
          </button>
        )}
        
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-white/5 text-white/60 hover:text-white"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </>
    )}
  </div>
</header>
```

**Aside Container (line 191):**
```tsx
<aside 
  className={cn(
    "flex h-full rounded-xl border bg-sidebar border-sidebar-border transition-all duration-200 ease-in-out",
    isCollapsed ? "w-12" : "w-[240px]"
  )}
>
```

**Content Visibility (wrap nav content):**
```tsx
{/* Main content - hidden when collapsed */}
<div className={cn(
  "flex-1 overflow-auto transition-opacity duration-200",
  isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible"
)}>
  {/* Search bar + navigation items */}
</div>

{/* Footer - hidden when collapsed */}
<div className={cn(
  "pt-4 transition-opacity duration-200",
  isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible"
)}>
  {/* Bottom nav items */}
</div>
```

---

## Behavior Summary

| State | Sidebar Width | Icon State | Content |
|-------|--------------|------------|---------|
| Expanded | 240px | Filled | Full navigation visible |
| Collapsed | 48px | Unfilled | Only toggle button visible |

---

## Accessibility
- Button has `aria-label`: "Expand sidebar" / "Collapse sidebar"
- Smooth width transition using `transition-all duration-200 ease-in-out`
- Focus states preserved on toggle button

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.tsx` | Add collapse state with localStorage persistence, pass props to Sidebar |
| `src/components/Sidebar.tsx` | Add collapse props, toggle button in header, width animation, hide content when collapsed |

---

## Technical Notes

1. **Mobile Sidebar Unchanged**: The mobile slide-in overlay sidebar doesn't collapse - it uses the existing open/close mechanism. The collapse functionality only applies to the desktop (lg:) sidebar.

2. **localStorage Key**: `sidebar_collapsed` - follows the same pattern as `ari_preview_collapsed` and `prompts_preview_collapsed`.

3. **Admin Detection**: The sidebar already detects when it's on `/admin/*` routes and shows different content. The collapse behavior is the same regardless of mode.
