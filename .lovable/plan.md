

# Plan: Fix Collapsed Sidebar - Show Logo and Navigation Icons

## Problem Analysis

The current collapsed sidebar implementation is broken in two ways:

1. **Toggle icon not centered**: The toggle button is placed at the top but not properly centered in the 48px column
2. **Logo not visible**: When collapsed, the logo disappears completely
3. **Navigation icons not visible**: All navigation content is hidden with `opacity-0 invisible h-0` - but users expect to see the navigation icons (like a traditional collapsed sidebar)

### Current Broken Structure (Sidebar.tsx lines 204-254)
```
When isCollapsed === true:
┌────────┐
│  [◧]   │  ← Only toggle button (not properly centered)
│        │
│        │  ← ALL content hidden (opacity-0 invisible h-0)
│        │
│        │
└────────┘
```

### Expected Structure (What User Wants)
```
When isCollapsed === true:
┌────────┐
│ [logo] │  ← Logo centered at top
│ [◧]    │  ← Toggle button below logo
│────────│
│  [🏠]  │  ← Dashboard icon
│  [✨]  │  ← Ari icon  
│  [💬]  │  ← Inbox icon
│  [👥]  │  ← Leads icon
│  ...   │
│────────│
│  [⚙️]  │  ← Settings icon (bottom)
└────────┘
```

---

## Technical Solution

### File: `src/components/Sidebar.tsx`

The fix requires restructuring the collapsed state to show:
1. **Logo** - centered at top (always visible)
2. **Toggle button** - below or beside the logo
3. **Navigation icons** - icon-only navigation items (no labels)
4. **Bottom items** - icon-only at the bottom

### Changes Required

#### 1. Header Section (lines 201-249)
**Problem**: Header only shows toggle when collapsed, hiding the logo
**Fix**: Always show the logo, adjust layout for collapsed state

```tsx
{/* Header with logo - always visible */}
<header className={cn(
  "w-full mb-6 flex flex-col items-center",
  isCollapsed ? "px-0 pt-2" : "px-2"
)}>
  {/* Logo - always visible, centered when collapsed */}
  <div className={cn(
    "flex items-center",
    isCollapsed ? "justify-center w-full" : "justify-between w-full"
  )}>
    {isPilotTeamMember && isOnAdminRoute ? (
      isCollapsed ? (
        <PilotLogo className="h-5 w-5 text-white flex-shrink-0" />
      ) : (
        <div className="flex items-center gap-2">
          <PilotLogo className="h-6 w-6 text-white flex-shrink-0" />
          <span className="text-sm font-semibold text-white">Admin</span>
        </div>
      )
    ) : (
      <PilotLogo className={cn(
        "text-white flex-shrink-0",
        isCollapsed ? "h-5 w-5" : "h-6 w-6"
      )} />
    )}
    
    {/* Desktop collapse toggle - only visible when expanded */}
    {!isCollapsed && onToggleCollapse && (
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white"
        aria-label="Collapse sidebar"
      >
        <LayoutPanelLeft filled={true} className="h-4 w-4" />
      </button>
    )}
    
    {/* Mobile close button */}
    {!isCollapsed && onClose && (
      <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-white/5">
        <X size={16} />
      </button>
    )}
  </div>
  
  {/* Toggle button - shown below logo when collapsed */}
  {isCollapsed && onToggleCollapse && (
    <button
      onClick={onToggleCollapse}
      className="mt-2 p-2 rounded-md hover:bg-white/5 text-white/60 hover:text-white"
      aria-label="Expand sidebar"
    >
      <LayoutPanelLeft filled={false} className="h-4 w-4" />
    </button>
  )}
</header>
```

#### 2. Main Navigation Section (lines 283-339)
**Problem**: Entire nav wrapped in `opacity-0 invisible h-0` when collapsed
**Fix**: Show icons in collapsed state, hide labels

Replace the current content wrapper with a structure that:
- Always renders the navigation links
- Conditionally shows/hides the labels
- Adjusts link padding for collapsed state

```tsx
{/* Search bar - hidden when collapsed */}
{!isCollapsed && (
  <motion.div className="items-center flex w-full py-0.5 mb-2">
    {/* Search button content */}
  </motion.div>
)}

{/* Main navigation - always visible, icons-only when collapsed */}
<section className="w-full">
  {filteredNavigationItems.map((item, index) => {
    const isActive = /* ... existing logic ... */;
    
    return (
      <motion.div key={item.id} className="items-center flex w-full py-0.5">
        <Link 
          to={item.path}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            "items-center flex w-full rounded-md transition-colors text-sm",
            isCollapsed 
              ? "p-2 justify-center"  // Smaller padding, centered
              : "p-[11px]",
            isActive 
              ? 'bg-white/10 text-white'
              : 'bg-transparent hover:bg-white/5 text-white/60 hover:text-white'
          )}
          title={isCollapsed ? item.label : undefined}  // Tooltip when collapsed
        >
          <div className={cn(
            "items-center flex my-auto",
            isCollapsed ? "" : "gap-2 w-full"
          )}>
            <div className="items-center flex my-auto w-[18px] flex-shrink-0 justify-center relative">
              {isActive && item.activeIcon ? (
                <item.activeIcon size={14} />
              ) : (
                <item.icon size={14} />
              )}
            </div>
            
            {/* Label - hidden when collapsed */}
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1 overflow-hidden">
                <div className={`text-sm font-normal leading-4 whitespace-nowrap ${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </div>
                {/* Badge for unread count */}
                {item.id === 'conversations' && unreadConversationsCount > 0 && (
                  <motion.div className="bg-destructive text-destructive-foreground text-2xs font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center ml-auto">
                    {unreadConversationsCount}
                  </motion.div>
                )}
              </div>
            )}
            
            {/* Collapsed badge - dot indicator for unread */}
            {isCollapsed && item.id === 'conversations' && unreadConversationsCount > 0 && (
              <div 
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full"
                aria-label={`${unreadConversationsCount} unread`}
              />
            )}
          </div>
        </Link>
      </motion.div>
    );
  })}
</section>
```

#### 3. Footer Section (lines 343-491)
**Problem**: Footer with bottom nav items uses `opacity-0 invisible h-0` when collapsed
**Fix**: Always show icons, hide labels when collapsed

```tsx
{/* Footer with bottom nav items - always visible, icons-only when collapsed */}
<div className={cn(
  "pt-4",
  isCollapsed ? "mt-auto" : ""  // Push to bottom when collapsed
)}>
  {filteredBottomItems.map((item, index) => {
    const isActive = location.pathname === item.path;
    const isGetSetUp = item.id === 'get-set-up';
    
    const renderIcon = () => { /* ... existing renderIcon logic ... */ };
    
    return (
      <motion.div key={item.id} className="items-center flex w-full py-0.5">
        <Link 
          to={item.path}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            "items-center flex w-full rounded-md transition-colors text-sm",
            isCollapsed ? "p-2 justify-center" : "p-[11px]",
            isActive 
              ? 'bg-white/10 text-white' 
              : 'bg-transparent hover:bg-white/5 text-white/60 hover:text-white'
          )}
          title={isCollapsed ? item.label : undefined}
        >
          <div className={cn(
            "items-center flex my-auto",
            isCollapsed ? "" : "gap-2 w-full"
          )}>
            <div className="items-center flex my-auto w-[18px] flex-shrink-0 justify-center">
              {renderIcon()}
            </div>
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1 overflow-hidden">
                <div className={`text-sm font-normal leading-4 whitespace-nowrap ${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </div>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  })}
  
  {/* Back to Dashboard / Admin Dashboard links - same pattern */}
  {/* ... apply same isCollapsed conditional rendering ... */}
</div>
```

---

## Visual Comparison

### Before (Broken)
```
┌────┐               ┌────────────────────────────┐
│[◧] │               │ [Logo]              [◧]    │
│    │               ├────────────────────────────┤
│    │   ← Nothing   │ [🔍 Search...]             │
│    │     visible   │ ──────────────────         │
│    │               │ [🏠] Dashboard             │
│    │               │ [✨] Ari                   │
└────┘               └────────────────────────────┘
Collapsed            Expanded
```

### After (Fixed)
```
┌────┐               ┌────────────────────────────┐
│[◎] │ ← Logo        │ [Logo]              [◧]    │
│[◧] │ ← Toggle      ├────────────────────────────┤
│────│               │ [🔍 Search...]             │
│[🏠]│ ← Dashboard   │ ──────────────────         │
│[✨]│ ← Ari         │ [🏠] Dashboard             │
│[💬]│ ← Inbox       │ [✨] Ari                   │
│[👥]│ ← Leads       │ [💬] Inbox                 │
│... │               │ [👥] Leads                 │
│────│               │ ...                        │
│[⚙️]│ ← Settings    │ [⚙️] Settings              │
└────┘               └────────────────────────────┘
Collapsed            Expanded
```

---

## Accessibility Considerations

1. **Tooltips**: Add `title` attribute to links when collapsed (shows label on hover)
2. **Aria labels**: Maintain existing aria-current for active state
3. **Focus rings**: Ensure all collapsed icons maintain visible focus states
4. **Unread badge**: Use dot indicator with aria-label for screen readers

---

## Files to Change

| File | Changes |
|------|---------|
| `src/components/Sidebar.tsx` | Complete restructure of collapsed state rendering |

---

## Implementation Checklist

1. [ ] Header section: Always show logo, centered when collapsed
2. [ ] Header section: Toggle button position (beside when expanded, below when collapsed)
3. [ ] Search bar: Hide entirely when collapsed
4. [ ] Main nav: Always render icons, conditionally show labels
5. [ ] Main nav: Adjust padding/centering for collapsed state (`p-2 justify-center`)
6. [ ] Main nav: Unread badge becomes dot indicator when collapsed
7. [ ] Bottom nav: Same pattern as main nav
8. [ ] Admin links (Back to Dashboard, Admin Dashboard): Same pattern
9. [ ] Add `title` attributes for hover tooltips
10. [ ] Test both user-side and admin-side navigation

