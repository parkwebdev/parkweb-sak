

# Plan: Premium Content Transition Animation for Locations

## Current State

The existing animation uses a basic directional slide with fixed timing:
```tsx
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: 20 }}
transition={{ duration: 0.2, ease: 'easeOut' }}
```

**Issues:**
- Linear timing feels mechanical
- No spring physics = lacks organic feel
- Doesn't respect reduced motion preferences
- Direction change is abrupt on exit
- Missing subtle scale for depth perception

---

## Enhanced Animation Strategy

### 1. Use Spring Physics Instead of Fixed Duration

Replace `duration: 0.2, ease: 'easeOut'` with `springs.smooth` from motion-variants for natural, organic movement:

```tsx
transition: springs.smooth  // { type: 'spring', stiffness: 300, damping: 30 }
```

### 2. Add Subtle Scale for Depth Perception

Combine slide + fade + slight scale creates a more immersive "panel" effect:

```tsx
// Entering: slightly smaller → full size (feels like emerging)
initial={{ opacity: 0, x: direction, scale: 0.98 }}

// Exiting: full size → slightly smaller (feels like receding)
exit={{ opacity: 0, x: -direction, scale: 0.98 }}
```

### 3. Track Direction State for Intelligent Animation

Use a `useRef` to track which direction the user is navigating, so animations feel contextually correct:

```tsx
const prevViewMode = useRef<ViewMode>(viewMode);

// Determine animation direction based on navigation
const direction = viewMode === 'properties' ? 1 : -1;  // Right = positive, Left = negative
```

### 4. Respect Reduced Motion Preferences

Add `useReducedMotion()` check (accessibility best practice already established in the codebase):

```tsx
const prefersReducedMotion = useReducedMotion();

// For reduced motion: instant opacity, no movement
initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 * direction, scale: 0.98 }}
```

### 5. Use `mode="popLayout"` for Smoother Exits

Change from `mode="wait"` to `mode="popLayout"` for a crossfade effect where the new content doesn't wait for the old to fully exit:

```tsx
<AnimatePresence mode="popLayout" initial={false}>
```

This creates an overlapping transition that feels more fluid.

---

## Technical Changes

### File: `src/components/agents/sections/AriLocationsSection.tsx`

#### 1. Add Import for Reduced Motion Hook and Springs

```tsx
// Add to existing imports
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
```

#### 2. Add Direction Tracking State

Inside the component, add:
```tsx
const prefersReducedMotion = useReducedMotion();
const prevViewMode = useRef<ViewMode>(viewMode);

// Track direction for animations
const animationDirection = viewMode === 'properties' ? 1 : -1;

// Update prev on change
useEffect(() => {
  prevViewMode.current = viewMode;
}, [viewMode]);
```

#### 3. Update AnimatePresence and Motion Divs

**Communities View (lines 737-807):**
```tsx
<AnimatePresence mode="popLayout" initial={false}>
  {viewMode === 'communities' && (
    <motion.div
      key="communities"
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.98 }}
      transition={prefersReducedMotion ? { duration: 0 } : springs.smooth}
    >
      {/* Communities content */}
    </motion.div>
  )}
```

**Properties View (lines 810-end):**
```tsx
  {viewMode === 'properties' && (
    <motion.div
      key="properties"
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -24, scale: 0.98 }}
      transition={prefersReducedMotion ? { duration: 0 } : springs.smooth}
    >
      {/* Properties content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Visual Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Timing | Fixed 200ms ease-out | Spring physics (natural) |
| Movement | x: ±20px only | x: ±24px + scale: 0.98 (depth) |
| Exit mode | `wait` (sequential) | `popLayout` (overlapping) |
| Reduced motion | Not respected | Instant fade only |
| Feel | Mechanical | Organic, premium |

---

## Animation Physics Explained

```text
┌─────────────────────────────────────────────────────────────────┐
│                        SPRING SMOOTH                            │
│  stiffness: 300  │  damping: 30  │  ~250-300ms natural settle  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Position ──────────────────────────────────────────────────►   │
│     │                                                           │
│  1.0│         ╭──────────────────────────────────              │
│     │       ╱                                                   │
│  0.5│     ╱                                                     │
│     │   ╱     ← Natural deceleration curve                      │
│  0.0│ ╱                                                         │
│     └────────────────────────────────────────────────► Time     │
│       0    50   100  150  200  250  300ms                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/agents/sections/AriLocationsSection.tsx` | Import hooks/springs, add reduced motion check, update AnimatePresence mode, enhance motion.div with scale + spring physics |

---

## Design Rationale

This approach follows the existing patterns in the codebase:
- **Settings.tsx** uses `springs.smooth` for tab transitions
- **ThemeSwitcher** uses spring physics for indicator
- **AriConfigurator** respects `prefersReducedMotion`
- **AnimatedItem** component combines scale + slide for premium feel

The result is a cohesive, accessible animation that matches the quality of transitions elsewhere in the app.

