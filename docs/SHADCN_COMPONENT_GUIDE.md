# shadcn/ui Component Builder Assistant Guide

Senior UI/UX Engineer guidelines for ReactJS, TypeScript, component design systems, and accessibility. Build, extend, and customize shadcn/ui components with Radix UI primitives and Tailwind CSS.

## Table of Contents
- [Core Responsibilities](#core-responsibilities)
- [Technology Stack](#technology-stack-focus)
- [Code Implementation Rules](#code-implementation-rules)
- [ChatPad Design System](#chatpad-design-system)
- [ChatPad Component Library](#chatpad-component-library)
- [Motion Integration](#motion-integration)
- [Form Patterns](#form-patterns)
- [Data Table Patterns](#data-table-patterns)
- [Related Documentation](#related-documentation)

---

## Core Responsibilities
- Follow user requirements precisely and to the letter
- Think step-by-step: describe component architecture plan in detailed pseudocode first
- Write correct, best practice, DRY, bug-free, fully functional components
- Prioritize accessibility and user experience over complexity
- Implement all requested functionality completely
- Leave NO todos, placeholders, or missing pieces

## Technology Stack Focus
- **shadcn/ui**: Component patterns, theming, and customization
- **Radix UI**: Primitive components and accessibility patterns
- **TypeScript**: Strict typing with component props and variants
- **Tailwind CSS**: Utility-first styling with shadcn design tokens
- **Class Variance Authority (CVA)**: Component variant management
- **React**: Modern patterns with hooks and composition
- **motion/react**: Animation library for fluid transitions

---

## Code Implementation Rules

### Component Architecture
- Use forwardRef for all interactive components
- Implement proper TypeScript interfaces for all props
- Use CVA for variant management and conditional styling
- Follow shadcn/ui naming conventions and file structure
- Create compound components when appropriate (Card.Header, Card.Content)
- Export components with proper display names

### Styling Guidelines
- Always use Tailwind classes with shadcn design tokens
- Use CSS variables for theme-aware styling (hsl(var(--primary)))
- Implement proper focus states and accessibility indicators
- Follow shadcn/ui spacing and typography scales
- Use conditional classes with cn() utility function
- Support dark mode through CSS variables

### Accessibility Standards
- Implement ARIA labels, roles, and properties correctly
- Ensure keyboard navigation works properly
- Provide proper focus management and visual indicators
- Include screen reader support with appropriate announcements
- Test with assistive technologies in mind
- Follow WCAG 2.1 AA guidelines

### shadcn/ui Specific
- Extend existing shadcn components rather than rebuilding from scratch
- Use Radix UI primitives as the foundation when building new components
- Follow the shadcn/ui component API patterns and conventions
- Implement proper variant systems with sensible defaults
- Support theming through CSS custom properties
- Create components that integrate seamlessly with existing shadcn components

### Component Patterns
- Use composition over complex prop drilling
- Implement proper error boundaries where needed
- Create reusable sub-components for complex UI patterns
- Use render props or compound components for flexible APIs
- Implement proper loading and error states
- Support controlled and uncontrolled component modes

---

## Button Sizing Standards

All buttons across the app MUST use consistent sizing via the `size` prop. **NEVER** override button height via className.

### Size Reference

| Size | Height | Padding | Use Case |
|------|--------|---------|----------|
| `default` / `sm` | 32px (h-8) | px-2.5 | Standard UI buttons, toolbars, tables |
| `lg` | 40px (h-10) | px-4 | Forms, prominent CTAs, auth pages |
| `icon` | 32px square | - | Icon-only buttons |

### Usage Examples

```tsx
// ✅ CORRECT - Use size prop
<Button size="sm">Standard</Button>
<Button size="lg">Form Submit</Button>
<Button size="icon"><Icon /></Button>

// ❌ WRONG - Never override height
<Button className="h-9">Custom Height</Button>
<Button className="h-11 px-4">Override</Button>
```

### When to Use Each Size

- **`sm` / `default`**: Toolbar buttons, table actions, dialog footers, navigation
- **`lg`**: Auth forms, hero CTAs, full-width form submits, prominent actions
- **`icon`**: Icon-only toggle buttons, compact action buttons

---

## ChatPad Design System

### Complete Color Token Reference

All colors are defined in `src/index.css` as HSL values. **Never use direct colors** like `text-white`, `bg-black`. Always use semantic tokens.

#### Core Tokens
```css
/* Light Mode (:root) */
--background: 0 0% 100%;           /* Main page background */
--foreground: 0 0% 3.9%;           /* Primary text color */
--card: 0 0% 100%;                 /* Card backgrounds */
--card-foreground: 0 0% 3.9%;      /* Card text */
--popover: 0 0% 100%;              /* Popover/dropdown backgrounds */
--popover-foreground: 0 0% 3.9%;   /* Popover text */
--primary: 0 0% 9%;                /* Brand/action color */
--primary-foreground: 0 0% 98%;    /* Text on primary surfaces */
--secondary: 0 0% 96.1%;           /* Secondary surfaces */
--secondary-foreground: 0 0% 9%;   /* Text on secondary */
--muted: 0 0% 96.1%;               /* Muted backgrounds */
--muted-foreground: 0 0% 45.1%;    /* Subtle/placeholder text */
--accent: 0 0% 96.1%;              /* Accent highlights */
--accent-foreground: 0 0% 9%;      /* Text on accent */
--border: 0 0% 89.8%;              /* Border color */
--input: 0 0% 89.8%;               /* Input borders */
--ring: 0 0% 3.9%;                 /* Focus ring color */
--radius: 0.5rem;                  /* Border radius base */

/* Dark Mode (.dark) - key differences */
--background: 0 0% 3.9%;
--foreground: 0 0% 98%;
--primary: 0 0% 98%;
--primary-foreground: 0 0% 9%;
--muted: 0 0% 9.4%;
--muted-foreground: 0 0% 63.9%;
--border: 0 0% 14.9%;
```

#### Status Colors
```css
/* Success - Teal green (harmonizes with destructive) */
--success: 146 59.1% 46.9%;
--success-foreground: 355 100% 97%;  /* Light: near-white */
--success-foreground: 144 61% 20%;   /* Dark: dark green */

/* Warning - Amber/orange */
--warning: 38 92% 50%;
--warning-foreground: 48 96% 5%;

/* Info - Blue */
--info: 221 83% 53%;                 /* Light */
--info: 217 91% 60%;                 /* Dark */
--info-foreground: 210 40% 98%;

/* Destructive - Deep crimson (sophisticated, not harsh) */
--destructive: 0 84.2% 60.2%;        /* Light */
--destructive: 355 59.1% 46.9%;      /* Dark */
--destructive-foreground: 0 0% 98%;
```

#### Surface Tokens
```css
/* Sidebar */
--sidebar: 0 0% 97%;               /* Light */
--sidebar: 0 0% 3.9%;              /* Dark */
--sidebar-foreground: 0 0% 3.9%;   /* Light */
--sidebar-foreground: 0 0% 98%;    /* Dark */

/* App Background (behind main content) */
--app-background: 0 0% 96%;        /* Light */
--app-background: 0 0% 3.9%;       /* Dark */
```

#### Chart Colors (for Recharts)
```css
/* Light Mode */
--chart-1: 12 76% 61%;   /* Coral */
--chart-2: 173 58% 39%;  /* Teal */
--chart-3: 197 37% 24%;  /* Dark blue */
--chart-4: 43 74% 66%;   /* Gold */
--chart-5: 27 87% 67%;   /* Orange */

/* Dark Mode */
--chart-1: 220 70% 50%;  /* Blue */
--chart-2: 160 60% 45%;  /* Green */
--chart-3: 30 80% 55%;   /* Orange */
--chart-4: 280 65% 60%;  /* Purple */
--chart-5: 340 75% 55%;  /* Pink */
```

### Usage in Tailwind
```tsx
// ✅ CORRECT - Use semantic tokens
<div className="bg-background text-foreground" />
<div className="bg-card border-border" />
<div className="text-muted-foreground" />
<Badge className="bg-success text-success-foreground" />

// ❌ WRONG - Direct colors
<div className="bg-white text-black" />
<div className="bg-gray-100" />
```

### Icon Usage
- **Always use UntitledUI Icons** (`@untitledui/icons`) - NOT Lucide Icons
- Import icons directly: `import { IconName } from "@untitledui/icons"`

---

## ChatPad Component Library

Custom components built for ChatPad following shadcn patterns.

### Layout Components

#### PageHeader (`src/components/ui/page-header.tsx`)
Page title with optional description and actions.
```tsx
<PageHeader
  title="Dashboard"
  description="Overview of your agents and conversations"
  showMenuButton={true}  // Shows sidebar toggle on mobile
>
  <Button>Create Agent</Button>
</PageHeader>
```

#### SectionHeader (`src/components/ui/section-header.tsx`)
Uppercase tracking section labels.
```tsx
<SectionHeader>Configuration</SectionHeader>
```

### Feedback Components

#### FeaturedIcon (`src/components/ui/featured-icon.tsx`)
Circular icon containers with color and size variants.
```tsx
import { AlertCircle } from "@untitledui/icons";

<FeaturedIcon size="lg" color="destructive">
  <AlertCircle />
</FeaturedIcon>
```

**Props:**
- `size`: `"sm" | "md" | "lg" | "xl"`
- `color`: `"gray" | "primary" | "success" | "warning" | "destructive"`
- `theme`: `"modern" | "light" | "dark"`

#### LoadingState (`src/components/ui/loading-state.tsx`)
Spinner with optional text and size variants.
```tsx
<LoadingState text="Loading conversations..." size="lg" />
```

#### EmptyState (`src/components/ui/empty-state.tsx`)
Standardized empty state pattern.
```tsx
<EmptyState
  icon={MessageSquare}
  title="No conversations yet"
  description="Start a conversation to see it here"
  action={<Button>Start Chat</Button>}
/>
```

#### Spinner (`src/components/ui/spinner.tsx`)
Standalone animated spinner.
```tsx
<Spinner size="sm" /> {/* sm, md, lg */}
```

### Form Components

#### ToggleSettingRow (`src/components/ui/toggle-setting-row.tsx`)
Switch with label, description, and auto-save indicator.
```tsx
<ToggleSettingRow
  label="Enable notifications"
  description="Receive alerts for new messages"
  checked={enabled}
  onCheckedChange={setEnabled}
  isPending={isSaving}
  showSavedIndicator={true}
/>
```

#### PhoneInput (`src/components/ui/phone-input.tsx`)
International phone formatting with country detection.
```tsx
<PhoneInput
  value={phone}
  onChange={setPhone}
  placeholder="Enter phone number"
/>
```
- Auto-formats based on detected country
- Shows country flag emoji
- Uses `libphonenumber-js`

#### RichTextEditor (`src/components/ui/rich-text-editor.tsx`)
Tiptap-based rich text editor.
```tsx
<RichTextEditor
  content={htmlContent}
  onChange={setHtmlContent}
  placeholder="Write your content..."
/>
```

#### SavedIndicator (`src/components/settings/SavedIndicator.tsx`)
Shows "Saved" text with checkmark for auto-save feedback.
```tsx
<SavedIndicator show={justSaved} />
```

### Data Display Components

#### DataTable (`src/components/data-table/DataTable.tsx`)
TanStack Table wrapper with motion integration.
See [Data Table Patterns](#data-table-patterns) section.

#### AnimatedTableRow (`src/components/ui/animated-table-row.tsx`)
Motion-integrated table rows with stagger animations.
```tsx
<AnimatedTableRow index={rowIndex}>
  <TableCell>...</TableCell>
</AnimatedTableRow>
```

### Creating New Components Template

Enhanced template with motion and reduced motion support:

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { fadeVariants, fadeReducedVariants, springs } from "@/lib/motion-variants";

const componentVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        default: "variant-default-classes",
        secondary: "variant-secondary-classes",
      },
      size: {
        default: "size-default-classes",
        sm: "size-sm-classes",
        lg: "size-lg-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  /** Enable entrance animation */
  animate?: boolean;
}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, animate = false, children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    
    const variants = prefersReducedMotion ? fadeReducedVariants : fadeVariants;
    
    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={cn(componentVariants({ variant, size, className }))}
          variants={variants}
          initial="hidden"
          animate="visible"
          transition={springs.snappy}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Component.displayName = "Component";

export { Component, componentVariants };
```

---

## Motion Integration

ChatPad uses `motion/react` (Framer Motion) for animations with accessibility support.

### Required Pattern: Reduced Motion Check

**Every animated component MUST check user preferences:**

```tsx
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { fadeVariants, fadeReducedVariants } from "@/lib/motion-variants";

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? fadeReducedVariants : fadeVariants;
  
  return (
    <motion.div variants={variants} initial="hidden" animate="visible">
      Content
    </motion.div>
  );
}
```

### Available Motion Variants (`src/lib/motion-variants.ts`)

```tsx
// Basic transitions
import {
  fadeVariants,
  fadeReducedVariants,
  scaleVariants,
  scaleReducedVariants,
  slideUpVariants,
  slideDownVariants,
} from "@/lib/motion-variants";

// Stagger animations for lists
import {
  staggerContainerVariants,
  staggerItemVariants,
  staggerItemReducedVariants,
} from "@/lib/motion-variants";

// Spring physics presets
import { springs } from "@/lib/motion-variants";
// springs.snappy, springs.smooth, springs.bouncy
```

### Content Transitions with AnimatePresence

```tsx
import { AnimatePresence, motion } from "motion/react";

function ContentTransition({ activeTab, children }) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -10 }}
        transition={prefersReducedMotion ? { duration: 0 } : springs.snappy}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Stagger List Pattern

```tsx
function AnimatedList({ items }) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          variants={prefersReducedMotion ? staggerItemReducedVariants : staggerItemVariants}
          custom={index}
        >
          {item.content}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Widget-Specific Animation Optimizations

For the embedded chat widget, prioritize performance:

- Use CSS animations instead of Framer Motion where possible (smaller bundle)
- Lazy-load heavy animation components (BubbleBackground, etc.)
- Use CSSAnimatedList/CSSAnimatedItem for stagger effects
- Keep animation bundle under 50KB gzipped

### Animation Design Principles

- Follow 12 principles of animation (timing, spacing, anticipation, etc.)
- Create meaningful motion that supports user understanding
- Use appropriate easing curves (ease-out for entrances, ease-in for exits)
- Implement proper animation sequences and choreography
- Design motion that feels natural and physics-based
- Create consistent animation vocabulary across the application

### Performance Standards

- Prioritize transform and opacity animations for GPU acceleration
- Use will-change CSS property judiciously and clean up after animations
- Implement proper animation cleanup with useEffect dependencies
- Optimize re-renders with useCallback for motion handlers
- Implement intersection observers for scroll-triggered animations
- Target 60fps for all animations

---

## Form Patterns

ChatPad uses React Hook Form + Zod for form management with auto-save patterns.

### Standard Form Setup

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof formSchema>;

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Auto-Save with Debounce Pattern

Used throughout settings pages:

```tsx
import { useCallback, useEffect, useState } from "react";

function AutoSaveField({ value, onSave }) {
  const [localValue, setLocalValue] = useState(value);
  const [justSaved, setJustSaved] = useState(false);
  
  // Debounced save
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localValue !== value) {
        onSave(localValue, { silent: true }); // silent: true prevents toast
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timeout);
  }, [localValue]);
  
  return (
    <div>
      <Input value={localValue} onChange={(e) => setLocalValue(e.target.value)} />
      <SavedIndicator show={justSaved} />
    </div>
  );
}
```

### Silent Toast Pattern

When auto-saving, use `silent: true` to prevent toast notifications:

```tsx
// From useLeads, useAgents, etc.
updateMutation.mutate(data, {
  onSuccess: () => {
    if (!options?.silent) {
      toast.success("Changes saved");
    }
  }
});
```

---

## Data Table Patterns

ChatPad uses TanStack Table with motion integration for all data tables.

### Architecture Overview

```
src/components/data-table/
├── DataTable.tsx           # Main wrapper with motion
├── DataTableToolbar.tsx    # Search, filters, actions
├── DataTablePagination.tsx # Page controls
├── DataTableColumnHeader.tsx
├── DataTableRowActions.tsx
├── DataTableViewOptions.tsx
└── columns/
    ├── index.ts
    ├── conversations-columns.tsx
    ├── leads-columns.tsx
    ├── team-columns.tsx
    └── landing-pages-columns.tsx
```

### Creating Column Definitions

```tsx
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";

export function createMyColumns(): ColumnDef<MyType>[] {
  return [
    // Selection checkbox
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    // Sortable column
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    // Custom cell
    {
      accessorKey: "status",
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
  ];
}
```

### Using DataTable

```tsx
import { DataTable } from "@/components/data-table";
import { createMyColumns } from "@/components/data-table/columns/my-columns";

function MyPage() {
  const columns = useMemo(() => createMyColumns(), []);
  
  return (
    <DataTable
      columns={columns}
      data={items}
      searchColumn="name"
      searchPlaceholder="Search items..."
    />
  );
}
```

See **[DATA_TABLE_DASHBOARD_GUIDE.md](./DATA_TABLE_DASHBOARD_GUIDE.md)** for complete table documentation.

---

## Typography System

ChatPad uses a refined typography system built on Geist fonts with carefully tuned letter-spacing for optimal readability.

### Font Families

```css
/* Primary - loaded via Google Fonts with preload optimization */
font-family: 'Geist', system-ui, -apple-system, sans-serif;

/* Monospace - for code and technical content */
font-family: 'Geist Mono', ui-monospace, monospace;
```

**Tailwind Usage:**
```tsx
<p className="font-sans">Body text (Geist)</p>
<code className="font-mono">Code text (Geist Mono)</code>
```

### Type Scale

ChatPad uses a compact, information-dense type scale:

| Element | Size | Weight | Letter-Spacing | Line-Height | Class |
|---------|------|--------|----------------|-------------|-------|
| H1 | 16px | 600 | -0.022em | 1.25 | `text-base font-semibold` |
| H2 | 14px | 600 | -0.022em | 1.3 | `text-sm font-semibold` |
| H3 | 14px | 500 | -0.022em | 1.4 | `text-sm font-medium` |
| H4 | 12px | 500 | -0.022em | 1.4 | `text-xs font-medium` |
| Body | 14px | 400 | -0.011em | 1.6 | `text-sm` |
| Small | 12px | 400 | -0.011em | 1.5 | `text-xs` |
| Caption | 12px | 400 | -0.011em | 1.5 | `text-xs text-muted-foreground` |

### Letter-Spacing System

Negative letter-spacing is applied globally for a refined, modern appearance:

| Element | Letter-Spacing | Purpose |
|---------|----------------|---------|
| Body text | -0.011em | Subtle tightening for readability |
| Headings | -0.022em | Tighter for visual weight |
| Buttons | -0.01em | Consistent with body |
| Inputs | -0.009em | Slightly looser for typing |
| Code | -0.01em | Balanced for monospace |
| Labels | -0.01em | Match button styling |

### Code Typography

```tsx
// Inline code
<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
  inline code
</code>

// Code blocks
<pre className="font-mono text-xs bg-muted p-3 rounded-lg overflow-x-auto">
  {codeContent}
</pre>
```

**Styling from index.css:**
```css
code {
  @apply font-mono text-xs bg-muted px-1.5 py-0.5 rounded;
  letter-spacing: -0.01em;
}

pre {
  @apply font-mono text-xs bg-muted p-3 rounded-lg overflow-x-auto;
  letter-spacing: -0.01em;
}
```

### Font Loading Strategy

Fonts are optimized for performance in `index.html`:

```html
<!-- Preconnect for faster DNS resolution -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Preload critical font files -->
<link rel="preload" as="font" type="font/woff2" crossorigin 
  href="https://fonts.gstatic.com/s/geist/..." />

<!-- Load fonts with swap for progressive rendering -->
<link rel="stylesheet" 
  href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" />

<!-- Fallback for JS-disabled browsers -->
<noscript>
  <link rel="stylesheet" href="..." />
</noscript>
```

### Typography Usage Examples

```tsx
// ✅ CORRECT - Use semantic heading elements
<h1>Page Title</h1>           {/* 16px semibold, auto letter-spacing */}
<h2>Section Title</h2>        {/* 14px semibold */}
<h3>Subsection</h3>           {/* 14px medium */}
<p>Body text content</p>      {/* 14px regular */}
<span className="text-xs text-muted-foreground">Caption</span>

// ✅ CORRECT - Muted foreground for secondary text
<p className="text-muted-foreground">Secondary information</p>

// ✅ CORRECT - Using PageHeader component
<PageHeader 
  title="Settings"
  description="Manage your account preferences"
/>

// ✅ CORRECT - Section headers with SectionHeader component
<SectionHeader>Configuration</SectionHeader>

// ❌ WRONG - Don't override the type system arbitrarily
<h1 className="text-3xl">Too large for ChatPad's compact design</h1>
<p style={{ letterSpacing: '0.1em' }}>Don't override letter-spacing</p>
```

### Responsive Typography

Widget uses slightly larger text on mobile for touch readability:

```css
/* Widget mobile optimization (≤480px) */
@media (max-width: 480px) {
  .widget-message {
    font-size: 15px; /* 14px → 15px for mobile readability */
  }
}
```

---

## Icon System (UntitledUI Icons)

ChatPad uses UntitledUI icons exclusively. **Never use Lucide icons.**

### Import Pattern

```tsx
import { Search01, Settings01, User01 } from '@untitledui/icons';
```

### Icon Sizing Guidelines

| Size Prop | Pixels | Use Case |
|-----------|--------|----------|
| `size={14}` | 14px | Navigation items, sidebar icons, dense UI |
| `size={16}` | 16px | Buttons, menu items, inline with text (most common) |
| `size={18}` | 18px | Header actions, standalone icon buttons |
| `size={20}` | 20px | Mobile menu triggers, larger touch targets |
| `size={24}` | 24px | Avatar fallbacks, large empty states |

**Alternative Tailwind Sizing:**
```tsx
<Search01 className="w-4 h-4" />  {/* 16px - equivalent to size={16} */}
<Search01 className="w-5 h-5" />  {/* 20px */}
<Search01 className="w-6 h-6" />  {/* 24px */}
```

### Icon Color Conventions

| State | Class | Usage |
|-------|-------|-------|
| Default | `text-muted-foreground` | Inactive icons, secondary actions |
| Active/Hover | `text-foreground` | Active nav items, hover states |
| Brand | `text-primary` | Primary actions, brand emphasis |
| Delete | `text-destructive` | Delete buttons, error states |
| Success | `text-success` | Success indicators, confirmations |
| Warning | `text-warning` | Warning states, caution indicators |

### FeaturedIcon Component

Container component for prominent icons with semantic backgrounds:

```tsx
import { FeaturedIcon } from '@/components/ui/featured-icon';
import { AlertCircle, CheckCircle } from '@untitledui/icons';

// Size variants (auto-scales child icon)
<FeaturedIcon size="sm">  {/* 32px container, 16px icon */}
  <AlertCircle />
</FeaturedIcon>

<FeaturedIcon size="md">  {/* 40px container, 20px icon (default) */}
  <AlertCircle />
</FeaturedIcon>

<FeaturedIcon size="lg">  {/* 48px container, 24px icon */}
  <AlertCircle />
</FeaturedIcon>

<FeaturedIcon size="xl">  {/* 56px container, 28px icon */}
  <AlertCircle />
</FeaturedIcon>

// Color variants (semantic backgrounds)
<FeaturedIcon color="gray">...</FeaturedIcon>        {/* Muted background */}
<FeaturedIcon color="primary">...</FeaturedIcon>     {/* Primary/10 background */}
<FeaturedIcon color="success">...</FeaturedIcon>     {/* Success/10 background */}
<FeaturedIcon color="warning">...</FeaturedIcon>     {/* Warning/10 background */}
<FeaturedIcon color="destructive">...</FeaturedIcon> {/* Destructive/10 background */}
```

### Icon Usage Examples

```tsx
// ✅ CORRECT - Button with icon
<Button variant="outline" size="sm">
  <Plus size={16} className="mr-1.5" />
  Add Item
</Button>

// ✅ CORRECT - Icon-only button
<Button variant="ghost" size="icon">
  <Settings01 size={18} />
</Button>

// ✅ CORRECT - Navigation item
<NavLink to="/settings">
  <Settings01 size={16} className="text-muted-foreground" />
  <span>Settings</span>
</NavLink>

// ✅ CORRECT - Empty state with FeaturedIcon
<EmptyState
  icon={<FeaturedIcon size="lg" color="primary"><Search01 /></FeaturedIcon>}
  title="No results found"
  description="Try adjusting your search"
/>

// ❌ WRONG - Don't use Lucide icons
import { Search } from 'lucide-react';  // Never use this

// ❌ WRONG - Don't mix sizing approaches
<Search01 size={16} className="w-5 h-5" />  // Conflicting sizes
```

---

## Spacing & Layout System

ChatPad follows a consistent spacing scale derived from Tailwind's default 4px base unit.

### Page Layout Padding

```tsx
// Standard page container
<main className="px-4 pt-4 pb-12 lg:px-8 lg:pt-8">
  {/* Mobile: 16px horizontal, 16px top, 48px bottom */}
  {/* Desktop: 32px horizontal, 32px top, 48px bottom */}
</main>

// Full-height page with sidebar
<div className="flex min-h-screen w-full">
  <Sidebar />
  <main className="flex-1 px-4 lg:px-8 pt-4 lg:pt-8 pb-12">
    {content}
  </main>
</div>
```

### Gap Scale

| Class | Value | Use Case |
|-------|-------|----------|
| `gap-1` | 4px | Icon + text inline, badge groups |
| `gap-1.5` | 6px | Tight button groups, chip clusters |
| `gap-2` | 8px | Related form fields, input + button |
| `gap-2.5` | 10px | Navigation items, menu options |
| `gap-3` | 12px | Card content items, list items |
| `gap-4` | 16px | Form sections, related card groups |
| `gap-6` | 24px | Major page sections, card grids |
| `gap-8` | 32px | Page-level section dividers |

### Component Spacing

**Card Components:**
```tsx
<Card>
  <CardHeader className="p-6">        {/* 24px all sides */}
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">  {/* 24px sides/bottom, 0 top */}
    {content}
  </CardContent>
  <CardFooter className="p-6 pt-0">   {/* 24px sides/bottom, 0 top */}
    {actions}
  </CardFooter>
</Card>
```

**Section Dividers:**
```tsx
// Horizontal divider between sections
<div className="border-t border-border pt-4 mt-4">
  {/* 16px spacing above and below the border */}
</div>

// With more breathing room
<div className="border-t border-border pt-6 mt-6">
  {/* 24px spacing */}
</div>
```

**Sidebar Dimensions:**
- Collapsed: `w-[72px]` (72px)
- Expanded: `w-60` (240px)
- Settings sidebar: `w-64` (256px)

### Button & Input Heights

| Size | Height | Use Case |
|------|--------|----------|
| Default | `h-8` (32px) | Standard buttons, inputs |
| Large | `h-10` (40px) | Primary CTAs, mobile touch targets |
| Icon | `h-8 w-8` | Icon-only buttons |
| Icon Large | `h-10 w-10` | Mobile icon buttons |

### Common Layout Patterns

```tsx
// Two-column settings layout
<div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
  <nav className="w-full lg:w-64 shrink-0">
    {/* Settings navigation */}
  </nav>
  <main className="flex-1 min-w-0">
    {/* Settings content */}
  </main>
</div>

// Grid of cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

// Form with sections
<form className="space-y-6">
  <div className="space-y-4">
    <Label>Field 1</Label>
    <Input />
  </div>
  <div className="space-y-4">
    <Label>Field 2</Label>
    <Input />
  </div>
  <div className="flex gap-2 pt-4">
    <Button type="submit">Save</Button>
    <Button variant="outline">Cancel</Button>
  </div>
</form>

// Header with actions
<div className="flex items-center justify-between gap-4">
  <div>
    <h1>Page Title</h1>
    <p className="text-muted-foreground">Description</p>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="outline">Secondary</Button>
    <Button>Primary</Button>
  </div>
</div>
```

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small mobile adjustments |
| `md` | 768px | Tablet, 2-column grids |
| `lg` | 1024px | Desktop, sidebar visible (primary) |
| `xl` | 1280px | Large desktop, wider content |

**Common Responsive Patterns:**
```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Stack on mobile, row on desktop
<div className="flex flex-col lg:flex-row gap-4">...</div>

// Single column mobile, multi-column desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">...</div>

// Adjust padding responsively
<div className="px-4 lg:px-8 py-4 lg:py-8">...</div>
```

---

## Related Documentation

- **[ANIMATION_MOTION_GUIDE.md](./ANIMATION_MOTION_GUIDE.md)** - Complete motion/animation patterns
- **[DATA_TABLE_DASHBOARD_GUIDE.md](./DATA_TABLE_DASHBOARD_GUIDE.md)** - TanStack Table implementation
- **[AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)** - AI integration patterns
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Supabase schema reference
- **[WIDGET_ARCHITECTURE.md](./WIDGET_ARCHITECTURE.md)** - Embedded widget patterns

---

## Response Protocol

1. If uncertain about shadcn/ui patterns, state so explicitly
2. If you don't know a specific Radix primitive, admit it rather than guessing
3. Search for latest shadcn/ui and Radix documentation when needed
4. Provide component usage examples only when requested
5. Stay focused on component implementation over general explanations
