# Widget Bundle Optimization Plan

> **Status:** PENDING IMPLEMENTATION  
> **Goal:** Reduce widget bundle from ~200-250KB to ~45-60KB gzipped  
> **Guarantee:** EXACT visual and functional parity with current implementation

---

## Problem Summary

15 widget files import heavy main app dependencies:
- `motion/react` (~35KB gzipped)
- `@radix-ui/react-tooltip` (~15KB)
- `@radix-ui/react-avatar` (~8KB)
- `@radix-ui/react-select` (~20KB)
- Full `@untitledui/icons` library (~80KB) - barrel exports prevent tree-shaking
- `class-variance-authority` (~8KB)

**Total bloat: ~150-190KB unnecessary**

---

## Files With Heavy Imports (15 files)

| File | Heavy Imports | Action Required |
|------|---------------|-----------------|
| `src/widget/icons.tsx` | Full `@untitledui/icons` barrel | Rewrite with individual imports |
| `src/widget/ChatWidget.tsx` | `TooltipProvider` from main app | Remove, use native title attrs |
| `src/widget/components/ContactForm.tsx` | `Button`, `Input`, `Textarea`, `Select` | Replace with widget UI |
| `src/widget/components/MessageBubble.tsx` | `Avatar`, `Tooltip`, direct icon imports | Replace with widget UI |
| `src/widget/components/MessageInput.tsx` | `Button`, `Textarea` | Replace with widget UI |
| `src/widget/components/WidgetHeader.tsx` | `Button` | Replace with widget UI |
| `src/widget/components/TakeoverBanner.tsx` | `Avatar` | Replace with widget UI |
| `src/widget/components/TypingIndicator.tsx` | `Avatar` | Replace with widget UI |
| `src/widget/views/HomeView.tsx` | `Button` | Replace with widget UI |
| `src/widget/views/HelpView.tsx` | `Button`, `Input`, `Textarea`, `Badge` | Replace with widget UI |
| `src/widget/views/MessagesView.tsx` | `Button` | Replace with widget UI |
| `src/widget/views/NewsView.tsx` | `Avatar` | Replace with widget UI |
| `src/widget/components/SatisfactionRating.tsx` | `Button`, `Textarea` | Replace with widget UI |
| `src/widget/components/FloatingButton.tsx` | `ChatBubbleIcon` from main app | Replace with widget SVG |
| `src/widget/components/QuickReplies.tsx` | `Button` | Replace with widget UI |

---

## Files That Are ALREADY CLEAN (28 files - DO NOT MODIFY)

These files use only lightweight dependencies (React, Tailwind, local utils):

### Hooks (12 files)
- `useConversationStatus.ts` - Pure React/Supabase
- `useConversations.ts` - Pure React/Supabase
- `useKeyboardHeight.ts` - Pure React
- `useLocationDetection.ts` - Pure React
- `useParentMessages.ts` - Pure React
- `useRealtimeConfig.ts` - Pure React/Supabase
- `useRealtimeMessages.ts` - Pure React/Supabase
- `useSoundSettings.ts` - Pure React
- `useSystemTheme.ts` - Pure React
- `useTypingIndicator.ts` - Pure React/Supabase
- `useVisitorAnalytics.ts` - Pure React/Supabase
- `useVisitorPresence.ts` - Pure React/Supabase
- `useWidgetConfig.ts` - Pure React

### Utils (6 files)
- `utils/formatting.ts` - Pure JS
- `utils/referrer.ts` - Pure JS
- `utils/session.ts` - Pure JS
- `utils/url-stripper.ts` - Pure JS
- `utils/validation.ts` - Pure JS (uses libphonenumber-js - acceptable)
- `api.ts` - Pure fetch/Supabase

### Components (6 files)
- `CSSAnimatedItem.tsx` - Pure CSS animations
- `CSSAnimatedList.tsx` - Pure CSS animations
- `CallButton.tsx` - Pure React/Tailwind
- `LocationPicker.tsx` - Pure React/Tailwind
- `LinkPreviewsWidget.tsx` - Pure React/Tailwind
- `booking/` components - Pure React/Tailwind

### Other (4 files)
- `types.ts` - TypeScript types only
- `constants.ts` - Pure constants
- `category-icons.tsx` - Pure SVG
- `NavIcons.tsx` - Pure SVG

---

## Phase 1: Create Widget UI Components

Create `src/widget/ui/` directory with 10 lightweight components.

### 1.1 WidgetButton.tsx

**Must match EXACTLY:** `src/components/ui/button.tsx`

```tsx
// EXACT class requirements from original:
// Base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium 
//        transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
//        disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"

// Variants used in widget:
// - default: "bg-primary text-primary-foreground shadow hover:bg-primary/90"
// - ghost: "hover:bg-accent hover:text-accent-foreground"
// - outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
// - secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
// - destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"

// Sizes used in widget:
// - default: "h-9 px-4 py-2"
// - sm: "h-8 rounded-md px-3 text-xs"
// - lg: "h-10 rounded-md px-8"
// - icon: "h-9 w-9"

// Props needed: variant, size, className, disabled, onClick, type, children, asChild (optional)
// Animation: CSS active:scale-[0.98] transition instead of motion/react
```

### 1.2 WidgetInput.tsx

**Must match EXACTLY:** `src/components/ui/input.tsx`

```tsx
// EXACT class requirements:
// "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm 
//  transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium 
//  file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none 
//  focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

// Size variants used in widget:
// - default: "h-9" (already in base)
// - sm: "h-8 text-xs"

// Props needed: type, placeholder, value, onChange, disabled, className, name, required, autoComplete
```

### 1.3 WidgetTextarea.tsx

**Must match EXACTLY:** `src/components/ui/textarea.tsx`

```tsx
// EXACT class requirements:
// "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base 
//  shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 
//  focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

// Props needed: placeholder, value, onChange, disabled, className, rows, name, required
```

### 1.4 WidgetSelect.tsx

**NATIVE SELECT** - Replaces heavy Radix Select (~20KB savings)

```tsx
// Use native <select> element styled to match app Select appearance
// EXACT styling to match:
// "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input 
//  bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground 
//  focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

// Props needed: value, onValueChange, placeholder, children (WidgetSelectItem), disabled, className
// WidgetSelectItem: value, children

// NOTE: Native select has slightly different appearance but is acceptable trade-off for 20KB savings
// Widget only uses Select in ContactForm for simple option lists
```

### 1.5 WidgetAvatar.tsx

**Must match EXACTLY:** `src/components/ui/avatar.tsx`

```tsx
// Compound component pattern with React Context for image load state
// Avatar (container), AvatarImage (img with onLoad/onError), AvatarFallback (shown when image fails)

// EXACT class requirements:
// Avatar: "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"
// AvatarImage: "aspect-square h-full w-full"
// AvatarFallback: "flex h-full w-full items-center justify-center rounded-full bg-muted"

// Props needed:
// - Avatar: className, children
// - AvatarImage: src, alt, className
// - AvatarFallback: className, children

// Behavior: Show fallback initially, hide when image loads successfully
```

### 1.6 WidgetBadge.tsx

**Must match EXACTLY:** `src/components/ui/badge.tsx`

```tsx
// EXACT class requirements:
// Base: "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold 
//        transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

// Variants used in widget:
// - default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80"
// - secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
// - outline: "text-foreground"

// Props needed: variant, className, children
```

### 1.7 WidgetCard.tsx

**Must match EXACTLY:** `src/components/ui/card.tsx`

```tsx
// Simple div wrappers with exact classes

// Card: "rounded-xl border bg-card text-card-foreground shadow"
// CardHeader: "flex flex-col space-y-1.5 p-6"
// CardTitle: "font-semibold leading-none tracking-tight"
// CardDescription: "text-sm text-muted-foreground"
// CardContent: "p-6 pt-0"
// CardFooter: "flex items-center p-6 pt-0"

// Props needed: className, children for all
```

### 1.8 WidgetChatBubbleIcon.tsx

**Pure SVG** - Replaces import from main app

```tsx
// Copy exact SVG from src/components/agents/ChatBubbleIcon.tsx
// No dependencies needed - just returns SVG element
// Props: className, size (default 24)
```

### 1.9 WidgetSpinner.tsx

**Pure CSS spinner** for button loading states

```tsx
// Simple SVG spinner with CSS animation
// Used in WidgetButton when loading prop is true
// Props: className, size (default 16)
```

### 1.10 index.ts

Barrel export for all widget UI components.

---

## Phase 2: Fix Icon Tree-Shaking

### Current (BROKEN - bundles entire library ~80KB):
```tsx
// src/widget/icons.tsx
export { X, XClose, ChevronRight, ChevronLeft } from '@untitledui/icons';
export { Send01, MessageChatCircle } from '@untitledui/icons';
// ... etc
```

### Fixed (CORRECT - ~0.5KB per icon):
```tsx
// src/widget/icons.tsx
import { X } from '@untitledui/icons/react/icons/X';
import { XClose } from '@untitledui/icons/react/icons/XClose';
import { ChevronRight } from '@untitledui/icons/react/icons/ChevronRight';
import { ChevronLeft } from '@untitledui/icons/react/icons/ChevronLeft';
import { Send01 } from '@untitledui/icons/react/icons/Send01';
import { MessageChatCircle } from '@untitledui/icons/react/icons/MessageChatCircle';
import { Microphone01 } from '@untitledui/icons/react/icons/Microphone01';
import { Attachment01 } from '@untitledui/icons/react/icons/Attachment01';
import { VolumeMax } from '@untitledui/icons/react/icons/VolumeMax';
import { VolumeX } from '@untitledui/icons/react/icons/VolumeX';
import { ThumbsUp } from '@untitledui/icons/react/icons/ThumbsUp';
import { ThumbsDown } from '@untitledui/icons/react/icons/ThumbsDown';
import { CheckCircle } from '@untitledui/icons/react/icons/CheckCircle';
import { Phone01 } from '@untitledui/icons/react/icons/Phone01';
import { MarkerPin01 } from '@untitledui/icons/react/icons/MarkerPin01';
import { Calendar } from '@untitledui/icons/react/icons/Calendar';
import { Star01 } from '@untitledui/icons/react/icons/Star01';
import { BookOpen01 } from '@untitledui/icons/react/icons/BookOpen01';
import { Zap } from '@untitledui/icons/react/icons/Zap';
// Add missing icons used in MessageBubble:
import { Check } from '@untitledui/icons/react/icons/Check';
import { Clock } from '@untitledui/icons/react/icons/Clock';
import { AlertCircle } from '@untitledui/icons/react/icons/AlertCircle';
import { Download01 } from '@untitledui/icons/react/icons/Download01';

export {
  X, XClose, ChevronRight, ChevronLeft,
  Send01, MessageChatCircle,
  Microphone01, Attachment01, VolumeMax, VolumeX,
  ThumbsUp, ThumbsDown, CheckCircle,
  Phone01, MarkerPin01, Calendar, Star01, BookOpen01, Zap,
  Check, Clock, AlertCircle, Download01
};
```

### Also update MessageBubble.tsx:
Change direct imports to use widget icons.tsx:
```tsx
// FROM:
import { Check, Clock, AlertCircle } from '@untitledui/icons/react/icons';

// TO:
import { Check, Clock, AlertCircle } from '../icons';
```

---

## Phase 3: Update Widget Files

### 3.1 ChatWidget.tsx
- Remove: `import { TooltipProvider } from '@/components/ui/tooltip'`
- Remove: `<TooltipProvider>` wrapper
- No other changes needed (doesn't import Button/Input directly)

### 3.2 ContactForm.tsx
```tsx
// FROM:
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// TO:
import { WidgetButton, WidgetInput, WidgetTextarea, WidgetSelect, WidgetSelectItem } from '../ui';
```

### 3.3 MessageBubble.tsx
```tsx
// FROM:
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Clock, AlertCircle } from '@untitledui/icons/react/icons';

// TO:
import { WidgetAvatar, WidgetAvatarImage, WidgetAvatarFallback } from '../ui';
import { Check, Clock, AlertCircle } from '../icons';
// Replace <Tooltip> with native title attribute on status icons
```

### 3.4 MessageInput.tsx
```tsx
// FROM:
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// TO:
import { WidgetButton, WidgetTextarea } from '../ui';
```

### 3.5 WidgetHeader.tsx
```tsx
// FROM:
import { Button } from '@/components/ui/button';

// TO:
import { WidgetButton } from '../ui';
```

### 3.6 TakeoverBanner.tsx
```tsx
// FROM:
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// TO:
import { WidgetAvatar, WidgetAvatarImage, WidgetAvatarFallback } from '../ui';
```

### 3.7 TypingIndicator.tsx
```tsx
// FROM:
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// TO:
import { WidgetAvatar, WidgetAvatarImage, WidgetAvatarFallback } from '../ui';
```

### 3.8 HomeView.tsx
```tsx
// FROM:
import { Button } from '@/components/ui/button';

// TO:
import { WidgetButton } from '../ui';
```

### 3.9 HelpView.tsx
```tsx
// FROM:
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// TO:
import { WidgetButton, WidgetInput, WidgetTextarea, WidgetBadge } from '../ui';
```

### 3.10 MessagesView.tsx
```tsx
// FROM:
import { Button } from '@/components/ui/button';

// TO:
import { WidgetButton } from '../ui';
```

### 3.11 NewsView.tsx
```tsx
// FROM:
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// TO:
import { WidgetAvatar, WidgetAvatarImage, WidgetAvatarFallback } from '../ui';
```

### 3.12 SatisfactionRating.tsx
```tsx
// FROM:
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// TO:
import { WidgetButton, WidgetTextarea } from '../ui';
```

### 3.13 FloatingButton.tsx
```tsx
// FROM:
import ChatBubbleIcon from '@/components/agents/ChatBubbleIcon';

// TO:
import { WidgetChatBubbleIcon } from '../ui';
```

### 3.14 QuickReplies.tsx
```tsx
// FROM:
import { Button } from '@/components/ui/button';

// TO:
import { WidgetButton } from '../ui';
```

---

## Phase 4: Remove Tooltip Dependencies

### MessageBubble.tsx - Replace Tooltip with native title

```tsx
// FROM:
<Tooltip>
  <TooltipTrigger asChild>
    <span className="...">
      <Check size={12} />
    </span>
  </TooltipTrigger>
  <TooltipContent>Delivered</TooltipContent>
</Tooltip>

// TO:
<span className="..." title="Delivered">
  <Check size={12} />
</span>
```

### ChatWidget.tsx - Remove TooltipProvider

```tsx
// FROM:
import { TooltipProvider } from '@/components/ui/tooltip';
// ...
return (
  <TooltipProvider>
    <div className="...">
      {/* content */}
    </div>
  </TooltipProvider>
);

// TO:
return (
  <div className="...">
    {/* content */}
  </div>
);
```

---

## Phase 5: Verify Other Imports

### Files importing from main app that need verification:

1. **LinkPreviewCard.tsx** - Check if it imports motion/react
2. **FileTypeIcon** usage - Check if it imports heavy dependencies
3. **CSSBubbleBackground** - Already CSS-only, should be fine

### Action: Read these files and verify they don't introduce bloat

---

## Phase 6: Testing Checklist

### Visual Regression Testing
- [ ] ContactForm renders identically
- [ ] MessageBubble renders identically (user and agent messages)
- [ ] Avatar shows image or fallback correctly
- [ ] All button variants look correct
- [ ] Input focus states work
- [ ] Select dropdown opens and selects correctly
- [ ] Badge styling matches
- [ ] Chat bubble icon matches original

### Functional Testing
- [ ] Contact form submission works
- [ ] Message sending works
- [ ] Voice recording works
- [ ] File attachments work
- [ ] Quick replies work
- [ ] Navigation between views works
- [ ] Satisfaction rating works
- [ ] Location picker works
- [ ] Booking flow works

### Accessibility Testing (WCAG 2.2)
- [ ] All buttons have visible focus rings (2px minimum)
- [ ] All inputs have visible focus rings
- [ ] Disabled states are visually distinct
- [ ] Touch targets are 44x44px minimum
- [ ] ARIA labels present where needed
- [ ] Keyboard navigation works

### Bundle Size Verification
```bash
# Build widget
npm run build

# Check widget bundle size
ls -la dist/assets/widget-*.js
gzip -c dist/assets/widget-*.js | wc -c

# Target: ~45-60KB gzipped (down from ~200-250KB)
```

---

## Phase 7: Documentation Update

After implementation, update `docs/WIDGET_ARCHITECTURE.md`:
- Add section on widget-specific UI components
- Document why widget uses separate UI layer
- Update bundle size estimates
- Add tree-shaking requirements for icons

---

## Implementation Order

1. **Create src/widget/ui/ directory and all 10 components** (Phase 1)
2. **Fix icons.tsx** (Phase 2)
3. **Update all 14 widget files** (Phase 3)
4. **Remove Tooltip usage** (Phase 4)
5. **Verify other imports** (Phase 5)
6. **Test everything** (Phase 6)
7. **Update docs** (Phase 7)

---

## Success Criteria

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Bundle Size (gzipped) | ~200-250KB | ~45-60KB | ⏳ |
| motion/react | Included | Removed | ⏳ |
| @radix-ui packages | 4 packages | 0 packages | ⏳ |
| Icon library | Full (~80KB) | Tree-shaken (~10KB) | ⏳ |
| Visual parity | N/A | 100% match | ⏳ |
| Functional parity | N/A | 100% match | ⏳ |
| WCAG 2.2 compliance | Yes | Yes | ⏳ |

---

## CRITICAL REMINDERS

1. **DO NOT MODIFY** the 28 clean files listed above
2. **EXACT CLASS MATCH** - Copy Tailwind classes verbatim from originals
3. **TEST AFTER EACH PHASE** - Don't batch all changes
4. **NATIVE SELECT IS OK** - Slight visual difference acceptable for 20KB savings
5. **NO NEW FEATURES** - Only optimization, no functionality changes
