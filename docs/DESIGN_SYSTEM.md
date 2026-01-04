# Pilot Design System

> **Last Updated**: January 2026  
> **Status**: Active  
> **Related**: [Component Patterns](./COMPONENT_PATTERNS.md), [Architecture](./ARCHITECTURE.md)

Comprehensive design system documentation for consistent UI development.

---

## Table of Contents

1. [Typography](#typography)
2. [Color System](#color-system)
3. [Spacing & Layout](#spacing--layout)
4. [Component Sizing](#component-sizing)
5. [Shadows & Effects](#shadows--effects)
6. [Border Radius](#border-radius)
7. [Animations](#animations)
8. [Icon System](#icon-system)
9. [Usage Examples](#usage-examples)
10. [Accessibility (ARIA)](#accessibility-aria)
11. [WCAG 2.2 Compliance](#wcag-22-compliance)
12. [Type Conventions](#type-conventions-jsonb-metadata)
13. [Coding Standards](#coding-standards)
    - [Component Declaration Pattern](#component-declaration-pattern)
    - [Error Handling Pattern](#error-handling-pattern)

---

## Typography

### Font Family

Pilot uses **Geist** as the primary font family with **Geist Mono** for code.

```css
/* Primary font */
font-family: 'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Monospace font */
font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, 
             Consolas, 'Liberation Mono', 'Courier New', monospace;
```

### Font Loading

Geist is loaded via Google Fonts in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type Scale

| Element | Tailwind Class | Size | Line Height | Letter Spacing |
|---------|---------------|------|-------------|----------------|
| Body | `text-sm` | 14px | 1.25rem | -0.01em |
| H1 | `text-base font-bold` | 16px | 1.5rem | -0.02em |
| H2 | `text-sm font-bold` | 14px | 1.25rem | -0.02em |
| H3 | `text-sm font-semibold` | 14px | 1.25rem | -0.02em |
| H4 | `text-xs font-medium` | 12px | 1rem | -0.02em |
| Caption | `text-xs` | 12px | 1rem | -0.01em |
| Micro | `text-2xs` | 10px | 0.875rem | -0.01em |
| Micro-XS | `text-3xs` | 8px | 0.75rem | -0.01em |
| Code | `text-xs font-mono` | 12px | 1rem | -0.01em |

> **Note**: `text-2xs` (10px) is for micro-text like badges and overflow counts. `text-3xs` (8px) is reserved for extremely constrained contexts like 16x16px avatar fallbacks. Avoid arbitrary values like `text-[10px]` or `text-[8px]`.

### Font Weights

| Weight | Tailwind Class | Usage |
|--------|---------------|-------|
| Regular (400) | `font-normal` | Body text, descriptions |
| Medium (500) | `font-medium` | Labels, subtitles |
| Semibold (600) | `font-semibold` | Headings, buttons |
| Bold (700) | `font-bold` | Emphasis, important content |

### Heading Hierarchy (WCAG AAA Compliance)

Proper heading hierarchy ensures accessibility and SEO compliance. **Never skip heading levels**.

| Component | Semantic Level | Visual Class | Notes |
|-----------|---------------|--------------|-------|
| `PageHeader` | `<h1>` | `text-base font-semibold` | One per page |
| `CardTitle` | `<h2>` or `<h3>` | `text-2xl font-semibold` | Use `as="h2"` prop when top-level |
| `SectionHeader` | `<h3>` | `text-xs uppercase` | Section labels within cards |
| `AlertTitle` | `<h4>` | `font-medium` | Alert headings |
| Dialog sections | `<h3>` | `text-xs uppercase` | Section labels inside dialogs |

#### CardTitle `as` Prop

CardTitle supports a dynamic `as` prop for semantic heading level:

```tsx
// In a card that's a top-level section
<CardTitle as="h2">Dashboard Overview</CardTitle>

// In a nested card or secondary context (default)
<CardTitle as="h3">Recent Activity</CardTitle>
<CardTitle>Widget Settings</CardTitle> {/* defaults to h3 */}
```

### Usage Examples

```tsx
// ✅ Correct - semantic heading styles with proper hierarchy
<h1 className="text-base font-semibold">Page Title</h1>
<h2 className="text-sm font-semibold">Section Title</h2>
<h3 className="text-xs font-medium uppercase">Subsection</h3>
<p className="text-sm text-muted-foreground">Description text</p>

// ❌ Wrong - skipping levels (h1 → h3)
<h1>Page</h1>
<h3>Should be h2</h3>

// ❌ Wrong - arbitrary sizes that don't match semantics
<h1 className="text-2xl font-bold">Too large</h1>
```

---

## Color System

All colors are defined as HSL values in CSS custom properties for theme flexibility.

### Core Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | `0 0% 100%` | `0 0% 3.9%` | Page background |
| `--foreground` | `0 0% 3.9%` | `0 0% 98%` | Primary text |
| `--card` | `0 0% 100%` | `0 0% 3.9%` | Card backgrounds |
| `--card-foreground` | `0 0% 3.9%` | `0 0% 98%` | Card text |
| `--popover` | `0 0% 100%` | `0 0% 3.9%` | Popover backgrounds |
| `--popover-foreground` | `0 0% 3.9%` | `0 0% 98%` | Popover text |

### Interactive Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--primary` | `0 0% 9%` | `0 0% 98%` | Primary buttons, links |
| `--primary-foreground` | `0 0% 98%` | `0 0% 9%` | Text on primary |
| `--secondary` | `0 0% 96.1%` | `0 0% 14.9%` | Secondary buttons |
| `--secondary-foreground` | `0 0% 9%` | `0 0% 98%` | Text on secondary |
| `--muted` | `0 0% 96.1%` | `0 0% 9.4%` | Muted backgrounds |
| `--muted-foreground` | `0 0% 45.1%` | `0 0% 63.9%` | Muted text |
| `--accent` | `0 0% 96.1%` | `0 0% 14.9%` | Accent highlights |
| `--accent-foreground` | `0 0% 9%` | `0 0% 98%` | Text on accent |

### Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--destructive` | Light: `0 84.2% 60.2%` / Dark: `355 59.1% 46.9%` | Errors, delete actions |
| `--destructive-foreground` | `0 0% 98%` | Text on destructive |
| `--success` | `146 59.1% 46.9%` | Success states, positive trends |
| `--success-foreground` | Light: `355 100% 97%` / Dark: `144 61% 20%` | Text on success |
| `--warning` | `38 92% 50%` | Warnings, caution states |
| `--warning-foreground` | `48 96% 5%` | Text on warning |
| `--info` | Light: `221 83% 53%` / Dark: `217 91% 60%` | Informational |
| `--info-foreground` | Light: `210 40% 98%` / Dark: `222 84% 5%` | Text on info |
| `--rating` | Light: `45 93% 47%` / Dark: `45 93% 50%` | Star ratings, review scores |

### Status Badge Colors

Semantic tokens for status badges with light/dark mode support:

| Token | Usage | Example |
|-------|-------|---------|
| `--status-active` | Active items, online status, success indicators | `bg-status-active/10 text-status-active-foreground` |
| `--status-inactive` | Inactive items, offline status | `bg-status-inactive/10 text-status-inactive-foreground` |
| `--status-published` | Published content | `bg-status-published/10 text-status-published-foreground` |
| `--status-draft` | Draft content | `bg-status-draft/10 text-status-draft-foreground` |
| `--status-paused` | Paused states | `bg-status-paused/10 text-status-paused-foreground` |

### Priority Colors (Centralized)

> **Source of Truth**: `src/lib/priority-config.ts`  
> **Verified**: 2026-01-03

Priority styling is centralized in a shared configuration used by:
- `LeadDetailsSheet` (dropdown)
- `ConversationMetadataPanel` (dropdown)
- `LeadsKanbanBoard` (badges via `PriorityBadge`)
- `LeadActivityPanel` (activity badges via `PriorityBadge`)

| Priority | Dot Color | Badge Classes |
|----------|-----------|---------------|
| `none` | `bg-muted` | `bg-muted text-muted-foreground border-border` |
| `low` | `bg-muted-foreground` | `bg-muted text-muted-foreground border-border` |
| `normal` | `bg-info` | `bg-info/10 text-info border-info/20` |
| `high` | `bg-warning` | `bg-warning/10 text-warning border-warning/20` |
| `urgent` | `bg-destructive` | `bg-destructive/10 text-destructive border-destructive/20` |

**Usage:**
```tsx
// For badges - use the shared component
import { PriorityBadge } from '@/components/ui/priority-badge';
<PriorityBadge priority="high" />
<PriorityBadge priority={metadata.priority} size="sm" />

// For dropdowns - use the shared options
import { PRIORITY_OPTIONS } from '@/lib/priority-config';
{PRIORITY_OPTIONS.map((option) => (
  <SelectItem key={option.value} value={option.value}>
    <span className={`w-2 h-2 rounded-full ${option.dotColor}`} />
    {option.label}
  </SelectItem>
))}
```

### Accent Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-purple` | Light: `271 91% 65%` / Dark: `271 81% 70%` | AI/Agent-related icons, notifications |

**Usage:**
```tsx
// ✅ AI-related icons
<Zap className="text-accent-purple" />
<Bot className="text-accent-purple" />
```

**Usage Pattern:**
```tsx
// ✅ Correct - semantic status badge
<span className={item.isActive 
  ? 'bg-status-active/10 text-status-active-foreground dark:bg-status-active/20 dark:text-status-active' 
  : 'bg-status-inactive/10 text-status-inactive-foreground dark:bg-status-inactive/20 dark:text-status-inactive'
}>
  {item.isActive ? 'Active' : 'Inactive'}
</span>

// ❌ Wrong - raw Tailwind colors
<span className="bg-green-100 text-green-700">Active</span>
```

### Border & Input Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--border` | `0 0% 89.8%` | `0 0% 14%` | Borders, dividers |
| `--input` | `0 0% 89.8%` | `0 0% 14%` | Input borders |
| `--ring` | `0 0% 3.9%` | `0 0% 83.1%` | Focus rings |

### Chart Colors

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--chart-1` | `12 76% 61%` | `220 70% 50%` |
| `--chart-2` | `173 58% 39%` | `160 60% 45%` |
| `--chart-3` | `197 37% 24%` | `30 80% 55%` |
| `--chart-4` | `43 74% 66%` | `280 65% 60%` |
| `--chart-5` | `27 87% 67%` | `340 75% 55%` |

### Sidebar Colors

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--sidebar` | `0 0% 97%` | `0 0% 3.9%` |
| `--sidebar-foreground` | `0 0% 3.9%` | `0 0% 98%` |
| `--app-background` | `0 0% 96%` | `0 0% 3.9%` |

### Usage Examples

```tsx
// ✅ Correct - use semantic color tokens
<div className="bg-background text-foreground">
  <Card className="bg-card border-border">
    <p className="text-muted-foreground">Description</p>
    <Button className="bg-primary text-primary-foreground">Action</Button>
  </Card>
</div>

// ✅ Correct - status colors
<Badge className="bg-success text-success-foreground">Active</Badge>
<Badge className="bg-destructive text-destructive-foreground">Error</Badge>

// ❌ Wrong - direct color values
<div className="bg-white text-black border-gray-200">
<Button className="bg-black text-white">
```

---

## Spacing & Layout

### Spacing Scale

Based on Tailwind's default 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `0.5` | 2px | Micro gaps |
| `1` | 4px | Icon padding |
| `1.5` | 6px | Tight spacing |
| `2` | 8px | Small gaps |
| `3` | 12px | Compact content |
| `4` | 16px | Standard card padding |
| `5` | 20px | Medium spacing |
| `6` | 24px | Large card padding |
| `8` | 32px | Section spacing |
| `10` | 40px | Large section spacing |
| `12` | 48px | Page sections |

### Standard Patterns

| Pattern | Classes | Usage |
|---------|---------|-------|
| Card Padding | `p-4` or `p-6` | Card content areas |
| Card Header | `py-3 px-4` | Compact card headers |
| Section Gap | `gap-4` or `gap-6` | Between cards/sections |
| Item Gap | `gap-2` | Between list items |
| Form Fields | `space-y-4` | Between form inputs |
| Button Group | `gap-2` | Between buttons |

### Container Max Widths

| Screen | Class | Width |
|--------|-------|-------|
| Default | `container` | 100% with 2rem padding |
| 2xl | `max-w-[1400px]` | 1400px |

### Breakpoints

| Breakpoint | Size | Usage |
|------------|------|-------|
| `xs` | 475px | Small mobile |
| `sm` | 640px | Mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

### Compact Mode

Enable with `compact-mode` class on body. Reduces all spacing proportionally:

```css
body.compact-mode {
  --spacing-xs: 0.25rem;   /* 4px → 4px */
  --spacing-sm: 0.375rem;  /* 8px → 6px */
  --spacing-md: 0.5rem;    /* 12px → 8px */
  --spacing-lg: 0.75rem;   /* 16px → 12px */
  --spacing-xl: 1rem;      /* 24px → 16px */
}
```

### Intentional Arbitrary Heights

The following arbitrary height values (`h-[*px]`) are **intentionally used** and should not be converted to spacing tokens:

| Pattern | Usage | Rationale |
|---------|-------|-----------|
| `h-[300px]`, `h-[400px]`, `h-[500px]` | Modal/dialog content areas | Fixed viewport-relative heights for scrollable content |
| `max-h-[80vh]`, `max-h-[90vh]` | Sheet/modal containers | Viewport-relative max heights |
| `h-[200px]`, `h-[250px]` | Chart containers | Fixed heights for Recharts visualizations |
| `h-[calc(...)]` | Layout calculations | Complex responsive calculations |
| `min-h-[*px]` | Minimum content heights | Ensuring minimum interactive areas |

These heights are layout-specific and cannot be meaningfully tokenized without losing semantic meaning. They should remain as arbitrary values.

---

## Component Sizing

### Buttons

| Size | Height | Padding | Class | Usage |
|------|--------|---------|-------|-------|
| Default | 40px (`h-10`) | `px-4 py-2` | `size="default"` | Standard buttons |
| Extra Small | 24px (`h-6`) | `px-2` | `size="xs"` | Compact inline actions, activity panels |
| Small | 32px (`h-8`) | `px-2.5` | `size="sm"` | Compact areas, toolbars, filters |
| Large | 44px (`h-11`) | `px-6` | `size="lg"` | Hero CTAs |
| Icon | 40px (`h-10 w-10`) | `p-0` | `size="icon"` | Icon-only default size |
| Icon Small | 32px (`h-8 w-8`) | `p-0` | `size="icon-sm"` | Icon-only compact size |

### Button Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary actions, CTAs |
| `secondary` | Secondary actions |
| `outline` | Tertiary actions, filters, toggles |
| `ghost` | Minimal emphasis, icon buttons, inline actions |
| `destructive` | Dangerous/delete actions |
| `link` | Inline text links with underline |
| `linkPlain` | Collapsible triggers, minimal links without underline |

### IconButton Component

Use `<IconButton>` (not `<Button>`) for icon-only buttons. It provides proper accessibility via the required `label` prop:

```tsx
// ✅ Correct - Use IconButton for icon-only buttons
<IconButton label="Close dialog" variant="ghost" size="icon-sm">
  <XClose size={16} />
</IconButton>

// ❌ Incorrect - Avoid manual sizing on Button
<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
  <XClose size={16} />
</Button>
```

| Size | Height/Width | Usage |
|------|--------------|-------|
| `icon` (default) | 40px | Standard icon buttons |
| `icon-sm` | 32px | Compact icon buttons |

### Inputs

| Size | Height | Text | Usage |
|------|--------|------|-------|
| Default | 40px (`h-10`) | `text-base md:text-sm` | Standard inputs |
| Small | 32px (`h-8`) | `text-xs` | Compact forms, filters |

**Usage:**
```tsx
// Default (40px)
<Input placeholder="Enter email..." />

// Compact (32px)
<Input size="sm" placeholder="Filter..." />
```

### Selects

| Size | Height | Text | Usage |
|------|--------|------|-------|
| Default | 40px (`h-10`) | `text-sm` | Standard selects |
| Small | 32px (`h-8`) | `text-xs` | Compact forms, filters |

**Usage:**
```tsx
// Default (40px)
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option..." />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>

// Compact (32px)
<Select>
  <SelectTrigger size="sm">
    <SelectValue placeholder="Filter..." />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
```

### Textareas

| Size | Min Height | Text | Usage |
|------|------------|------|-------|
| Default | 80px | `text-sm` | Standard text areas |
| Small | 60px | `text-xs` | Compact text areas |
| Large | 120px | `text-base` | Extended content |

**Usage:**
```tsx
// Default
<Textarea placeholder="Enter message..." />

// Compact
<Textarea size="sm" placeholder="Quick note..." />

// Extended
<Textarea size="lg" placeholder="Detailed description..." />
```

### Avatars

| Size | Class | Usage |
|------|-------|-------|
| Small | `h-6 w-6` | Inline mentions |
| Default | `h-8 w-8` | Lists, cards |
| Medium | `h-10 w-10` | Profile headers |
| Large | `h-12 w-12` | Profile pages |
| XL | `h-16 w-16` | Hero profiles |

### Icons

| Size | Class | Usage |
|------|-------|-------|
| XS | `h-3 w-3` | Badges, inline |
| Small | `h-4 w-4` | Buttons, inputs |
| Default | `h-5 w-5` | Navigation, cards |
| Large | `h-6 w-6` | Headers, heroes |

### Toolbar Uniformity Rule

When interactive elements (buttons, filters, dropdowns, selects) are placed adjacent to a search input in a toolbar, **all elements MUST share the same height**.

| Toolbar Context | Input Size | Button Size | Height |
|----------------|------------|-------------|--------|
| Compact (tables, filters) | `size="sm"` | `size="sm"` | 32px |
| Standard (page headers) | default | default | 40px |

**Examples:**
- DataTable toolbars: All elements use `size="sm"` (32px)
- Page-level search: All elements use default (40px)

```tsx
// ✅ Correct - uniform 32px height
<div className="flex items-center gap-2">
  <Input size="sm" placeholder="Search..." />
  <Button size="sm" variant="outline">Filter</Button>
  <Button size="sm">Add</Button>
</div>

// ❌ Wrong - mixed heights
<div className="flex items-center gap-2">
  <Input placeholder="Search..." />  {/* 40px */}
  <Button size="sm">Filter</Button>  {/* 32px */}
</div>
```

### Badges

| Size | Classes | Usage |
|------|---------|-------|
| Default | `size="default"` | `px-2.5 py-0.5 text-xs` | Standard badges |
| Small | `size="sm"` | `px-2 py-0.5 text-2xs` | Compact badges |
| Large | `size="lg"` | `px-3 py-1 text-sm` | Prominent badges |
| Counter | `size="counter"` | `h-5 px-1.5 text-xs` | Inline count badges (filters, tabs) |
| Dot | `size="dot"` | `h-5 w-5 p-0 rounded-full` | Notification dots |
| Micro | `size="micro"` | `h-4 px-1.5 py-0 text-2xs` | Tiny inline labels (tags, model badges) |

**Usage:**
```tsx
// Filter count badge
<Button variant="outline">
  Filters
  <Badge variant="secondary" size="counter" className="ml-1">3</Badge>
</Button>

// Notification dot
<Badge variant="destructive" size="dot" className="absolute -top-1 -right-1">
  {unreadCount}
</Badge>

// Tab counter
<Badge variant="outline" size="counter">12</Badge>
```

### Skeleton Loading States

Use the pre-built skeleton components from `@/components/ui/skeleton` for consistent loading states:

| Component | Usage |
|-----------|-------|
| `Skeleton` | Base skeleton element |
| `SkeletonAvatar` | Avatar placeholders (sm/md/lg) |
| `SkeletonBadge` | Badge placeholders (rounded-md) |
| `SkeletonCard` | Card layouts |
| `SkeletonFormField` | Form input with label |
| `SkeletonTableRow` | Table row placeholder |
| `SkeletonKanbanColumn` | Kanban board column |

**Guidelines:**
- Always use `<Skeleton>` component instead of inline `animate-pulse` divs
- Badge skeletons use `rounded-md` to match Badge component
- Avatar skeletons use `rounded-full`
- Import specific skeleton variants for consistency

```tsx
// ✅ Correct - use Skeleton component
import { Skeleton, SkeletonKanbanColumn } from '@/components/ui/skeleton';

{loading && (
  <div className="space-y-2">
    <Skeleton className="h-12 rounded-lg" />
    <Skeleton className="h-12 rounded-lg" />
  </div>
)}

// ❌ Wrong - inline animate-pulse
{loading && (
  <div className="h-12 bg-muted animate-pulse rounded-lg" />
)}
```

---

## Shadows & Effects

### Shadow Scale

| Token | Class | Usage |
|-------|-------|-------|
| None | `shadow-none` | Flat elements |
| Small | `shadow-sm` | Subtle elevation |
| Default | `shadow` | Cards, dropdowns |
| Medium | `shadow-md` | Hover states, modals |
| Large | `shadow-lg` | Dialogs, popovers |
| XL | `shadow-xl` | Floating elements |

### Hover Effects

Standard hover pattern for interactive cards:

```tsx
// ✅ Standard card hover
<Card className="hover:shadow-md transition-shadow">
```

### Focus Rings (WCAG 2.2 Compliant)

Focus states use 2px rings for WCAG 2.2 Focus Appearance compliance (2.4.13):

```tsx
// ✅ Standard focus ring - 2px with offset for visibility
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// All form components use this pattern for WCAG 2.2 compliance
// The ring must be at least 2px thick with 3:1 contrast ratio
```

**WCAG 2.2 Requirements:**
- Minimum 2px outline thickness (not 1px)
- 3:1 contrast ratio against adjacent colors
- 2px offset to ensure visibility against element borders
- Use `ring-offset-background` for proper dark mode support

### Transitions

| Pattern | Class | Usage |
|---------|-------|-------|
| Default | `transition` | General transitions |
| Colors | `transition-colors` | Background/text changes |
| Shadow | `transition-shadow` | Elevation changes |
| Transform | `transition-transform` | Scale/translate |
| All | `transition-all` | Multiple properties |

Standard duration: 150ms (Tailwind default)

---

## Border Radius

| Token | Value | Class | Usage |
|-------|-------|-------|-------|
| `--radius` | 0.5rem (8px) | `rounded-lg` | Cards, buttons |
| `--radius - 2px` | 6px | `rounded-md` | Badges, inputs, smaller elements |
| `--radius - 4px` | 4px | `rounded-sm` | Small elements, chips |
| Full | 9999px | `rounded-full` | Avatars, pills |

### Common Patterns

```tsx
// Cards
<Card className="rounded-lg">

// Buttons
<Button className="rounded-md">

// Avatars
<Avatar className="rounded-full">

// Input fields
<Input className="rounded-md">
```

---

## Animations

### Keyframe Animations

| Animation | Class | Duration | Usage |
|-----------|-------|----------|-------|
| Fade In | `animate-fade-in` | 300ms | Page transitions |
| Accordion Down | `animate-accordion-down` | 200ms | Expand content |
| Accordion Up | `animate-accordion-up` | 200ms | Collapse content |
| Ping | `animate-ping` | 2s loop | Notification dots |
| Pulse Slow | `animate-pulse-slow` | 2.5s loop | Status indicators |
| Pulse Ring | `animate-pulse-ring` | 1.5s loop | Active states |
| Slide In Left | `animate-slide-in-left` | 200ms | List items |
| Slide In Right | `animate-slide-in-right` | 200ms | List items |
| Ripple | `animate-ripple` | 3s loop | Background effects |
| Slow Pulse | `animate-slow-pulse` | 3s loop | Subtle animations |

### Custom Animations

```css
/* Subtle ring animation for active indicators */
@keyframes subtle-ring {
  0%, 100% { transform: scale(1); opacity: 0; }
  50% { transform: scale(1.4); opacity: 0.3; }
}

/* Progress bar shimmer */
@keyframes progress-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Reduced Motion

Respect user preferences:

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

const Component = () => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
      Content
    </div>
  );
};
```

---

## Icon System

### UntitledUI Icons

Pilot uses **UntitledUI Icons** exclusively. Never use Lucide or other icon libraries.

```tsx
// ✅ Correct - UntitledUI Icons
import { Home01, Settings01, Users01 } from '@untitledui/icons';

// ❌ Wrong - Lucide Icons
import { Home, Settings, Users } from 'lucide-react';
```

### Icon Sizing

| Size | Class | Usage |
|------|-------|-------|
| XS | `size={12}` or `h-3 w-3` | Inline badges |
| Small | `size={16}` or `h-4 w-4` | Buttons, inputs |
| Default | `size={20}` or `h-5 w-5` | Navigation, cards |
| Large | `size={24}` or `h-6 w-6` | Headers |

### Icon Colors

Icons inherit text color by default:

```tsx
// ✅ Correct - inherit from parent
<Button className="text-muted-foreground hover:text-foreground">
  <Settings01 className="h-4 w-4" />
</Button>

// ✅ Correct - explicit semantic color
<AlertCircle className="h-5 w-5 text-destructive" />
<CheckCircle className="h-5 w-5 text-success" />
```

### Common Icon Mappings

| Usage | Icon |
|-------|------|
| Home | `Home01` |
| Settings | `Settings01` |
| Users | `Users01` |
| Search | `SearchMd` |
| Add | `Plus` |
| Close | `XClose` |
| Menu | `Menu01` |
| Notifications | `Bell01` |
| Analytics | `BarChart07` |
| Conversations | `MessageSquare01` |
| Leads | `UserPlus01` |
| Agents | `Bot` or custom `AriAgentsIcon` |
| Calendar | `Calendar` |
| Planner | `Calendar` |
| Help | `HelpCircle` |
| Knowledge | `BookOpen01` |
| Tools | `Tool01` |
| Webhooks | `Link04` |
| API | `Code01` |
| Locations | `MarkerPin01` |
| WordPress | Custom SVG (`text-wordpress` color) |
| Facebook | Custom SVG (`text-facebook` color) |
| Instagram | Custom SVG (`text-instagram` color) |

### Brand Color Tokens

Semantic tokens for external platform brand colors:

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| WordPress | `text-wordpress` | WordPress icons and badges |
| Facebook | `text-facebook` | Facebook channel icons |
| Instagram | `text-instagram` | Instagram channel icons |
| Twitter/X | `text-twitter` | Twitter/X channel icons |

```tsx
// ✅ Correct - use semantic brand tokens
<WordPressIcon className="text-wordpress" />

// ❌ Wrong - direct hex colors
<WordPressIcon className="text-[#21759b]" />
```

---

## Tooltips

Tooltips use standardized styling defined in the base component (`src/components/ui/tooltip.tsx`).

### Default Styles

| Property | Value | Notes |
|----------|-------|-------|
| Text Size | `text-xs` (12px) | Compact, readable |
| Padding | `px-3 py-1.5` | Tight but comfortable |
| Max Width | `max-w-xs` (320px) | Prevents overly wide tooltips |
| Border Radius | `rounded-md` | Matches design system |
| Animation | `fade-in zoom-in-95` | Subtle entrance |

### Content Patterns

```tsx
// ✅ Simple tooltip - plain text, no wrapper needed
<TooltipContent>
  Click to save changes
</TooltipContent>

// ✅ Complex tooltip - structured content
<TooltipContent>
  <div className="space-y-1">
    <p className="font-medium">Traffic Source</p>
    <p className="text-muted-foreground">
      <span className="text-foreground font-medium">1,234</span> visits
    </p>
  </div>
</TooltipContent>
```

### When to Override

Most tooltips should use defaults. Only override for special cases:

| Use Case | Override | Example |
|----------|----------|---------|
| Long URLs | `max-w-[400px]` | Sitemap child pages |
| Compact form labels | `max-w-[200px]` | Content section labels |
| Extra padding for lists | `p-3` | System prompt tips |

```tsx
// ❌ Wrong - redundant className overrides
<TooltipContent className="text-xs">  {/* text-xs is default */}
  Simple tooltip
</TooltipContent>

// ✅ Correct - no override needed
<TooltipContent>
  Simple tooltip
</TooltipContent>
```

---

## Usage Examples

### Card Component

```tsx
<Card className="p-6 hover:shadow-md transition-shadow">
  <CardHeader className="p-0 pb-4">
    <CardTitle className="text-sm font-semibold">Title</CardTitle>
    <CardDescription className="text-xs text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    <p className="text-sm">Content</p>
  </CardContent>
</Card>
```

### Form Layout

```tsx
<form className="space-y-4">
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">Field Label</Label>
    <Input className="h-10" placeholder="Enter value..." />
  </div>
  
  <div className="flex gap-2 justify-end">
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Save</Button>
  </div>
</form>
```

### Status Badge

```tsx
<Badge className="bg-success/10 text-success border-0">
  <CheckCircle className="h-3 w-3 mr-1" />
  Active
</Badge>
```

### Page Header

```tsx
<div className="flex items-center justify-between pb-6">
  <div className="space-y-1">
    <h1 className="text-base font-semibold">Page Title</h1>
    <p className="text-sm text-muted-foreground">Page description</p>
  </div>
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Add New
  </Button>
</div>
```

---

## Accessibility (ARIA)

All interactive components must be accessible to screen readers and keyboard users.

### Icon Buttons

Every icon-only button **must** have an accessible label. Use the `IconButton` component for enforced accessibility:

```tsx
// ✅ Best - IconButton enforces aria-label
import { IconButton } from '@/components/ui/icon-button';

<IconButton label="Delete item" variant="ghost">
  <Trash01 className="h-4 w-4" />
</IconButton>

// ✅ Also correct - manual aria-label
<Button size="icon" aria-label="Delete item">
  <Trash01 className="h-4 w-4" aria-hidden="true" />
</Button>

// ❌ Wrong - no accessible label
<Button size="icon">
  <Trash01 className="h-4 w-4" />
</Button>
```

### Form Field Hints

Use `FormHint` for helper text below form fields (outside React Hook Form contexts):

```tsx
import { FormHint } from '@/components/ui/form-hint';

// ✅ Correct - FormHint with aria-describedby linking
<Input id="email" aria-describedby="email-hint" />
<FormHint id="email-hint">We'll never share your email.</FormHint>

// For React Hook Form, use FormDescription instead:
<FormControl>
  <Input {...field} />
</FormControl>
<FormDescription>Enter your email address</FormDescription>
```

### Loading Spinners

Use `role="status"` for loading indicators:

```tsx
// ✅ Correct - Spinner component handles this automatically
<Spinner label="Loading data" />

// The component wraps the SVG:
<div role="status" aria-label="Loading data">
  <svg aria-hidden="true">...</svg>
  <span className="sr-only">Loading data</span>
</div>
```

### Status Badges

Use `role="status"` for dynamic badges that update:

```tsx
// ✅ Correct - notification count badge
<Badge role="status" aria-label="5 unread notifications">
  5
</Badge>

// No role needed for static descriptive badges
<Badge>Active</Badge>
```

### Navigation

Current page must be indicated with `aria-current`:

```tsx
// ✅ Correct
<nav aria-label="Main navigation">
  <Link to="/dashboard" aria-current={isActive ? 'page' : undefined}>
    Dashboard
  </Link>
</nav>
```

### Decorative Elements

Hide decorative icons and images from screen readers:

```tsx
// ✅ Correct - decorative icon
<div aria-hidden="true">
  <DecorationIcon className="h-12 w-12" />
</div>

// ✅ Correct - inline with button
<Button aria-label="Send message">
  <Send01 aria-hidden="true" />
</Button>
```

### Avatar Fallbacks

Avatar fallbacks should have meaningful labels:

```tsx
// ✅ Correct - AvatarFallback auto-generates label from children
<Avatar>
  <AvatarImage src="/avatar.jpg" alt="John Doe" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Custom aria-label for complex cases
<AvatarFallback aria-label="User John Doe initials">JD</AvatarFallback>
```

### Focus Management

Ensure focus states are always visible (handled via `--ring` token):

```tsx
// Focus ring is applied automatically via Tailwind
// Custom focus styling:
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### ARIA Checklist

Before shipping any component, verify:

- [ ] All icon buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Loading states use `role="status"`
- [ ] Dynamic count badges have `role="status"` and `aria-label`
- [ ] Navigation shows `aria-current="page"` for active routes
- [ ] Forms have proper `<label>` associations
- [ ] Dialogs trap focus and return focus on close
- [ ] Color alone is not used to convey information

---

## WCAG 2.2 Compliance

Pilot implements WCAG 2.2 AA compliance with the following key requirements:

### Focus Appearance (2.4.13)

All focusable elements have:
- **2px minimum outline** (not 1px)
- **3:1 contrast ratio** against adjacent colors
- **2px offset** to ensure visibility against element borders

```tsx
// ✅ WCAG 2.2 compliant focus
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// ❌ Wrong - 1px ring doesn't meet WCAG 2.2
className="focus-visible:ring-1 focus-visible:ring-ring/70"
```

### Focus Not Obscured (2.4.11)

Focused elements automatically scroll into view with proper margins:

```css
/* Applied globally in index.css */
*:focus-visible {
  scroll-margin-top: 80px;    /* Clears sticky headers */
  scroll-margin-bottom: 40px;
}
```

### Dragging Movements Alternatives (2.5.7)

All drag-and-drop functionality has keyboard alternatives:

| Feature | Drag Alternative | Implementation |
|---------|-----------------|----------------|
| Article reordering | Up/down arrow buttons | `SortableArticleItem` |
| Category moves | "Move to" dropdown | `DroppableCategoryCard` |
| Calendar events | "Reschedule" form | `ViewEventDialog` |

```tsx
// ✅ Correct - drag with keyboard alternative
<SortableArticleItem
  article={article}
  onMoveUp={(id) => handleReorder(id, 'up')}
  onMoveDown={(id) => handleReorder(id, 'down')}
  isFirst={index === 0}
  isLast={index === articles.length - 1}
/>

// ❌ Wrong - drag only, no keyboard alternative
<SortableArticleItem article={article} />
```

### Target Size (2.5.8)

All interactive elements meet minimum 24×24px target size:

| Component | Size | Status |
|-----------|------|--------|
| Icon buttons | 32×32px (`h-8 w-8`) | ✅ Compliant |
| Checkboxes | 16×16px with 24px touch target | ✅ Compliant |
| Links | Font-relative sizing | ✅ Compliant |

### WCAG 2.2 Checklist

Before shipping, verify:

- [ ] Focus rings are 2px thick with proper contrast
- [ ] All drag-and-drop has keyboard alternatives
- [ ] Interactive elements are minimum 24×24px
- [ ] Focused content is not obscured by sticky elements
- [ ] Consistent help placement across pages
- [ ] All icon buttons have aria-labels (use `IconButton` component)
- [ ] Form hints use `FormHint` component for consistency
- [ ] Password visibility toggles have aria-label and aria-pressed
- [ ] All images have descriptive alt text

---

## Type Conventions (JSONB Metadata)

All JSONB metadata types are centralized in `src/types/metadata.ts`. **Never create local interfaces** for metadata structures—import from the canonical source.

### Canonical Types

| Type | Description | Database Column |
|------|-------------|-----------------|
| `ConversationMetadata` | Visitor info, session data, priority, tags, notes | `conversations.metadata` |
| `MessageMetadata` | Sender info, reactions, link previews, attachments | `messages.metadata` |
| `KnowledgeSourceMetadata` | Processing state, sitemap hierarchy, file info | `knowledge_sources.metadata` |
| `AgentDeploymentConfig` | Widget config, API settings, deployment toggles | `agents.deployment_config` |
| `LeadData` | Custom form fields, source tracking | `leads.data` |
| `PlanLimits` | Usage quotas per plan | `plans.limits` |
| `PlanFeatures` | Feature flags per plan | `plans.features` |

### Usage

```typescript
// ✅ CORRECT: Import from canonical source
import type { ConversationMetadata, AgentDeploymentConfig } from '@/types/metadata';

const metadata = conversation.metadata as ConversationMetadata;

// ❌ WRONG: Don't create local interfaces
interface ConversationMetadata { ... } // Duplicates lead to type drift!
```

### Edge Functions

Edge functions can't import from `src/`, so they define **local interfaces** that mirror the canonical types. Keep these in sync when updating `src/types/metadata.ts`.

---

## Coding Standards

### Component Declaration Pattern

**Do NOT use `React.FC` or `FC` for component declarations.** Use direct function declarations with explicit props typing instead.

| Pattern | Status | Example |
|---------|--------|---------|
| Direct function | ✅ **Use this** | `function Button({ label }: ButtonProps) { ... }` |
| Arrow function | ✅ Acceptable | `const Button = ({ label }: ButtonProps) => { ... }` |
| `React.FC<Props>` | ❌ **Deprecated** | `const Button: React.FC<ButtonProps> = ({ label }) => { ... }` |
| `FC<Props>` | ❌ **Deprecated** | `const Button: FC<ButtonProps> = ({ label }) => { ... }` |

#### Why We Removed React.FC

1. **Unnecessary**: TypeScript infers return types correctly without it
2. **Implicit children**: `React.FC` implicitly includes a `children` prop, leading to confusing type errors
3. **Simpler code**: Direct declarations are cleaner and more readable
4. **Better inference**: TypeScript provides better type inference with direct declarations
5. **Modern convention**: The React community and TypeScript team recommend against `React.FC`

#### Correct Patterns

```tsx
// ✅ CORRECT - Direct function declaration (preferred)
interface ButtonProps {
  label: string;
  onClick?: () => void;
}

function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// ✅ CORRECT - Arrow function with explicit typing
const Button = ({ label, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{label}</button>;
};

// ✅ CORRECT - Component with children (explicit)
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

#### Incorrect Patterns

```tsx
// ❌ WRONG - Do not use React.FC
import React, { FC } from 'react';

const Button: React.FC<ButtonProps> = ({ label }) => {
  return <button>{label}</button>;
};

// ❌ WRONG - Do not use FC
const Card: FC<CardProps> = ({ title, children }) => {
  return <div>{title}{children}</div>;
};
```

#### Migration Notes

- All 96+ components in the codebase have been migrated to direct function declarations
- New components MUST follow this pattern
- If you encounter legacy `React.FC` usage, refactor it during your changes

---

### Error Handling Pattern

All catch blocks **MUST** use `unknown` error type and the `getErrorMessage()` utility for type-safe error handling.

#### The getErrorMessage Utility

Located in `src/types/errors.ts`, this utility safely extracts error messages from any error type:

```typescript
import { getErrorMessage } from '@/types/errors';

// ✅ CORRECT - Type-safe error handling
try {
  await riskyOperation();
} catch (error: unknown) {
  toast.error('Operation failed', { description: getErrorMessage(error) });
}

// ✅ CORRECT - With console logging
try {
  await fetchData();
} catch (error: unknown) {
  console.error('Fetch failed:', getErrorMessage(error));
  throw error;
}
```

#### Why This Pattern?

1. **Type Safety**: `catch (error: unknown)` prevents implicit `any` typing
2. **Graceful Fallbacks**: `getErrorMessage()` handles all error types (Error objects, strings, objects with message property, etc.)
3. **Consistent UX**: Users always see meaningful error messages, never raw error objects
4. **ESLint Enforced**: Rules `@typescript-eslint/no-unsafe-*` catch violations

#### Available Error Utilities

| Function | Purpose |
|----------|---------|
| `getErrorMessage(error: unknown)` | Extract string message from any error type |
| `hasErrorMessage(error: unknown)` | Type guard for errors with message property |
| `hasErrorCode(error: unknown)` | Type guard for errors with code property (e.g., Supabase) |

#### Incorrect Patterns

```typescript
// ❌ WRONG - Implicit any type
try {
  await operation();
} catch (error) {  // TypeScript infers 'any'
  console.error(error.message);  // Unsafe member access
}

// ❌ WRONG - Explicit any type
try {
  await operation();
} catch (error: any) {
  toast.error(error.message);  // No type safety
}

// ❌ WRONG - Assuming Error type without check
try {
  await operation();
} catch (error: unknown) {
  toast.error((error as Error).message);  // Unsafe cast
}
```

#### Migration Notes

- All 100+ catch blocks in the codebase have been migrated to this pattern
- ESLint rules enforce `unknown` error types going forward
- If you encounter legacy `catch (error: any)`, refactor during your changes

---

## Loading States & Status Indicators

| Pattern | Class/Component | Use Case |
|---------|-----------------|----------|
| Skeleton placeholder | `<Skeleton>` component | Content loading states |
| Pulse animation | `animate-pulse` | Active processing (retraining, syncing) |
| Pulse ring | `animate-pulse-ring` | Live presence indicators |
| Slow pulse | `animate-pulse-slow` | Online/availability status (widget) |

**Guidelines:**
- Use the `<Skeleton>` component for all loading placeholders
- Use `animate-pulse` directly ONLY for real-time status indicators (not loading states)
- Status indicators (syncing, processing) may pulse to indicate active operation
- Widget uses `animate-pulse-slow` for subtle online status indication

---

## Viewport-Relative Heights (Allowed Exceptions)

These patterns are intentional and do not violate the design system:

| Pattern | Use Case | Notes |
|---------|----------|-------|
| `max-h-[80vh]` | Compact dialogs | With overflow handling |
| `max-h-[85vh]` | Standard dialogs | Most common |
| `max-h-[90vh]` | Large dialogs | Maximum comfortable height |
| `h-[94vh]` | Full-height sheets | Lead details, conversation panels |
| `min-h-[280px]` | Video containers | Minimum visible height |
| `min-h-[400px]` | Charts/maps | Data visualization minimum |
| `h-[calc(100vh-Xpx)]` | Responsive layouts | Account for fixed headers |

**Guidelines:**
- Always pair `max-h-[*vh]` with `overflow-y-auto` or `overflow-hidden flex flex-col`
- Use calc() for layouts that need to account for fixed headers/footers
- Prefer token-based heights for fixed-size elements (buttons, inputs, avatars)

---

## Spacing Patterns

**Primary spacing tokens (preferred):**
- `space-y-2` / `gap-2` - Tight groupings (8px)
- `space-y-4` / `gap-4` - Standard sections (16px)
- `space-y-6` / `gap-6` - Major sections (24px)

**Contextual variations (allowed when visually appropriate):**
- `space-y-1` / `gap-1` - Very compact lists (4px)
- `space-y-1.5` - Label-to-input spacing (6px)
- `space-y-3` - Medium density content (12px)
- `space-y-5` - Between major card groups (20px)

**Form field patterns:**
- Label to input: `space-y-1.5` or `space-y-2`
- Between form fields: `space-y-4`
- Form sections: `space-y-6`

The system prefers even values (2, 4, 6) but allows intermediate values when visual balance requires it.

---

## Form Accessibility Patterns

**Required for all form inputs:**

```tsx
<Input 
  id="field-name"
  aria-describedby="field-name-hint" // Links to helper text
/>
<FormHint id="field-name-hint">Helper text explaining the field</FormHint>
```

**Current coverage (reference implementations):**
- `CreateToolDialog.tsx` - Full aria-describedby on all fields
- `EditToolDialog.tsx` - Full aria-describedby on all fields

**Files that would benefit from enhanced accessibility:**
- ProfileSettings form fields
- NotificationSettings form fields
- Agent personality/behavior configuration
- Lead capture form settings
- Webhook configuration forms

> **Note:** This is an enhancement to be applied incrementally. New forms should follow this pattern.

---

## Related Documentation

- [Component Patterns](./COMPONENT_PATTERNS.md) - Component patterns and motion
- [Architecture](./ARCHITECTURE.md) - Project structure
- [Hooks Reference](./HOOKS_REFERENCE.md) - Custom hook documentation
