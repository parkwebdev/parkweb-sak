# Component Patterns Guide

> **Last Updated**: December 2025  
> **Status**: Active  
> **Related**: [Design System](./DESIGN_SYSTEM.md), [Hooks Reference](./HOOKS_REFERENCE.md), [Architecture](./ARCHITECTURE.md)

Senior UI/UX Engineer guidelines for ReactJS, TypeScript, component design systems, accessibility, and data tables. Build, extend, and customize shadcn/ui components with Radix UI primitives and Tailwind CSS.

---

## Table of Contents

1. [Core Responsibilities](#core-responsibilities)
2. [Code Implementation Rules](#code-implementation-rules)
3. [Accessibility Standards](#accessibility-standards)
4. [Button & Input Standards](#button--input-standards)
5. [ChatPad Component Library](#chatpad-component-library)
6. [Motion Integration](#motion-integration)
7. [Form Patterns](#form-patterns)
8. [Data Table Patterns](#data-table-patterns)
9. [Typography System](#typography-system)
10. [Icon System](#icon-system)
11. [Spacing & Layout System](#spacing--layout-system)

---

## Core Responsibilities

- Follow user requirements precisely and to the letter
- Think step-by-step: describe component architecture plan in detailed pseudocode first
- Write correct, best practice, DRY, bug-free, fully functional components
- Prioritize accessibility and user experience over complexity
- Implement all requested functionality completely
- Leave NO todos, placeholders, or missing pieces

### Technology Stack Focus

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

## Accessibility Standards

### WCAG 2.2 AA Required

#### Required ARIA Attributes

- **Icon buttons**: Must use `IconButton` component with required `label` prop (enforces `aria-label`)
- **Form fields with hints**: Link helper text using `aria-describedby` pointing to `FormHint` `id`
- **Loading states**: Must include `role="status"` and `aria-live="polite"`
- **Interactive elements**: Must have clear accessible names
- **Icons inside interactive elements**: Add `aria-hidden="true"` to decorative icons

#### Focus Management

- All interactive elements MUST have visible focus rings (`focus-visible:ring-2`)
- Focus ring must use `ring-ring` color token with `ring-offset-2`
- Never override or hide focus indicators

#### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Use proper focus order (avoid positive `tabIndex`)
- Implement keyboard shortcuts with visible hints

#### Target Size (WCAG 2.5.8)

- Minimum 24x24px for all touch/click targets
- Icon buttons default to 32x32px (`size="icon"`)
- Form inputs minimum 32px height (`size="sm"`)

#### Screen Reader Support

- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- Announce dynamic content with `aria-live` regions
- Provide context for complex interactions

#### Implementation Examples

```tsx
// ✅ Icon button with required accessibility
<IconButton label="Delete item" variant="ghost">
  <Trash01 className="h-4 w-4" aria-hidden="true" />
</IconButton>

// ✅ Form field with accessible hint
<Input id="email" aria-describedby="email-hint" />
<FormHint id="email-hint">We'll never share your email.</FormHint>

// ✅ Loading state with aria-live
<div role="status" aria-live="polite" aria-label="Loading">
  <Spinner />
</div>

// ❌ WRONG - Missing accessibility
<Button size="icon"><Trash01 /></Button>  // No aria-label!
<Input /><p className="text-xs">Hint</p>  // Not linked!
<div>Loading...</div>                      // No aria-live!
```

---

## Button & Input Standards

### Button Sizing

All buttons MUST use consistent sizing via the `size` prop. **NEVER** override button height via className.

| Size | Height | Padding | Use Case |
|------|--------|---------|----------|
| `default` / `sm` | 32px (h-8) | px-2.5 | Standard UI buttons, toolbars, tables |
| `lg` | 40px (h-10) | px-4 | Forms, prominent CTAs, auth pages |
| `icon` | 32px square | - | Icon-only buttons |

```tsx
// ✅ CORRECT - Use size prop
<Button size="sm">Standard</Button>
<Button size="lg">Form Submit</Button>
<Button size="icon"><Icon /></Button>

// ❌ WRONG - Never override height
<Button className="h-9">Custom Height</Button>
```

**When to Use Each Size:**

- **`sm` / `default`**: Toolbar buttons, table actions, dialog footers, navigation
- **`lg`**: Auth forms, hero CTAs, full-width form submits, prominent actions
- **`icon`**: Icon-only toggle buttons, compact action buttons

### Form Input Sizing

All form inputs MUST use consistent sizing via the `size` prop.

| Size | Height | Use Case |
|------|--------|----------|
| `default` | 40px (h-10) | Standard form inputs, dialogs, settings, auth pages |
| `sm` | 32px (h-8) | Data tables, toolbars, compact UIs, popovers |

**Components Affected:**
- `Input` — supports `size="default"` (40px) and `size="sm"` (32px)
- `SelectTrigger` — supports `size="default"` (40px) and `size="sm"` (32px)
- `PhoneInputField` — inherits Input sizing

```tsx
// ✅ CORRECT
<Input placeholder="Email" />                 // 40px default
<Input size="sm" placeholder="Search" />      // 32px compact

// ❌ WRONG - Never override height via className
<Input className="h-9" />
```

### Textarea Sizing

| Size | Min Height | Padding | Font Size |
|------|------------|---------|-----------|
| `default` | 80px | px-3 py-2 | text-sm |
| `sm` | 60px | px-2.5 py-1.5 | text-xs |
| `lg` | 120px | px-4 py-3 | text-base |

### Badge Size Variants

| Size | Padding | Font Size |
|------|---------|-----------|
| `default` | px-2.5 py-0.5 | text-xs (12px) |
| `sm` | px-2 py-0.5 | text-[10px] |
| `lg` | px-3 py-1 | text-sm (14px) |

---

## ChatPad Component Library

Custom components built for ChatPad following shadcn patterns.

### Layout Components

#### PageHeader (`src/components/ui/page-header.tsx`)
```tsx
<PageHeader
  title="Dashboard"
  description="Overview of your agents and conversations"
  showMenuButton={true}
>
  <Button>Create Agent</Button>
</PageHeader>
```

#### SectionHeader (`src/components/ui/section-header.tsx`)
```tsx
<SectionHeader>Configuration</SectionHeader>
```

### Feedback Components

#### FeaturedIcon (`src/components/ui/featured-icon.tsx`)
```tsx
<FeaturedIcon size="lg" color="destructive">
  <AlertCircle />
</FeaturedIcon>
```

**Props:**
- `size`: `"sm" | "md" | "lg" | "xl"`
- `color`: `"gray" | "primary" | "success" | "warning" | "destructive"`
- `theme`: `"modern" | "light" | "dark"`

#### LoadingState (`src/components/ui/loading-state.tsx`)
```tsx
<LoadingState text="Loading conversations..." size="lg" />
```

#### EmptyState (`src/components/ui/empty-state.tsx`)
```tsx
<EmptyState
  icon={MessageSquare}
  title="No conversations yet"
  description="Start a conversation to see it here"
  action={<Button>Start Chat</Button>}
/>
```

### Form Components

#### ToggleSettingRow (`src/components/ui/toggle-setting-row.tsx`)
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
```tsx
<PhoneInput
  value={phone}
  onChange={setPhone}
  placeholder="Enter phone number"
/>
```

#### RichTextEditor (`src/components/ui/rich-text-editor.tsx`)
```tsx
<RichTextEditor
  content={htmlContent}
  onChange={setHtmlContent}
  placeholder="Write your content..."
/>
```

#### FormHint (`src/components/ui/form-hint.tsx`)
```tsx
<Input id="email" aria-describedby="email-hint" />
<FormHint id="email-hint">We'll never share your email.</FormHint>
```

#### IconButton (`src/components/ui/icon-button.tsx`)
```tsx
<IconButton label="Delete item" variant="ghost" size="sm">
  <Trash01 className="h-4 w-4" aria-hidden="true" />
</IconButton>
```

**Props:**
- `label: string` — **Required** — Maps to `aria-label`
- All standard Button props (variant, size, disabled, etc.)

### Brand Color Tokens

| Token | Usage |
|-------|-------|
| `text-wordpress` | WordPress icons/badges |
| `text-facebook` | Facebook channel icons |
| `text-instagram` | Instagram channel icons |
| `text-twitter` | Twitter/X channel icons |

```tsx
// ✅ CORRECT
<WordPressIcon className="text-wordpress" />

// ❌ WRONG
<WordPressIcon className="text-[#21759b]" />
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
  fadeVariants, fadeReducedVariants,
  scaleVariants, scaleReducedVariants,
  slideUpVariants, slideDownVariants,
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

### Stagger List Pattern

```tsx
function AnimatedList({ items }) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div variants={staggerContainerVariants} initial="hidden" animate="visible">
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

### Performance Standards

- Prioritize transform and opacity animations for GPU acceleration
- Use will-change CSS property judiciously
- Implement proper animation cleanup with useEffect dependencies
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

```tsx
function AutoSaveField({ value, onSave }) {
  const [localValue, setLocalValue] = useState(value);
  const [justSaved, setJustSaved] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localValue !== value) {
        onSave(localValue, { silent: true });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
    }, 1000);
    
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

### Component Hierarchy

```
DataTable (generic wrapper)
├── TableHeader
│   └── DataTableColumnHeader (sortable headers)
├── motion.tbody (stagger container)
│   └── AnimatedTableRow (motion-enabled rows)
│       └── TableCell
├── DataTableToolbar (search + filters)
├── DataTablePagination (page controls)
└── DataTableRowActions (row action dropdown)
```

### Core Components

#### DataTable (`src/components/data-table/DataTable.tsx`)

```tsx
import { DataTable } from '@/components/data-table';

<DataTable
  table={table}           // TanStack table instance
  columns={columns}       // Column definitions
  onRowClick={handleClick} // Optional row click handler
  emptyMessage="No data." // Empty state message
  isLoading={false}       // Loading state
/>
```

**Features:**
- Accepts TanStack table instance
- Animated rows via `AnimatedTableRow`
- Staggered enter animations via `motion.tbody`
- Respects reduced motion preferences
- Loading skeleton state

#### DataTableColumnHeader

```tsx
{
  accessorKey: 'name',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Name" />
  ),
}
```

#### DataTableToolbar

```tsx
<DataTableToolbar
  table={table}
  searchPlaceholder="Search..."
  searchColumn="name"
  globalFilter={true}
/>
```

#### DataTablePagination

```tsx
<DataTablePagination
  table={table}
  pageSizeOptions={[10, 25, 50, 100]}
  showRowsPerPage={true}
  showSelectedCount={true}
/>
```

#### DataTableRowActions

```tsx
<DataTableRowActions
  onView={() => handleView(row)}
  onEdit={() => handleEdit(row)}
  onDelete={() => handleDelete(row)}
/>
```

### Creating Column Definitions

#### Factory Pattern (Recommended)

```tsx
export function createLeadsColumns(options: {
  onView: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
}): ColumnDef<Lead>[] {
  return [
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
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: 'status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions onView={() => options.onView(row.original)} />
      ),
    },
  ];
}
```

### Table Implementation Example

```tsx
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { DataTable, DataTableToolbar, DataTablePagination } from '@/components/data-table';
import { createLeadsColumns } from '@/components/data-table/columns';

export function LeadsTable({ leads, onView, onStatusChange }) {
  const [sorting, setSorting] = React.useState([]);

  const columns = useMemo(
    () => createLeadsColumns({ onView, onStatusChange }),
    [onView, onStatusChange]
  );

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} searchColumn="name" />
      <DataTable table={table} columns={columns} onRowClick={onView} />
      <DataTablePagination table={table} />
    </div>
  );
}
```

### Available Column Definitions

| File | Columns |
|------|---------|
| `conversations-columns.tsx` | Selection, Agent/Lead, Messages, Duration, % of Total, Status, Actions |
| `leads-columns.tsx` | Selection, Name, Email, Phone, Company, Status, Actions |
| `team-columns.tsx` | Member (avatar + name), Role, Actions |
| `landing-pages-columns.tsx` | Page URL, Views, Avg Duration, Conversions, Agent |
| `analytics-columns.tsx` | Conversations, Leads, Agent performance, Usage metrics |

### AnimatedTableRow (`src/components/ui/animated-table-row.tsx`)

```tsx
<AnimatedTableRow
  index={rowIndex}
  onClick={() => handleClick(row)}
  data-state={row.getIsSelected() ? 'selected' : undefined}
>
  {cells}
</AnimatedTableRow>
```

**Features:**
- Fade + slide-up enter animation
- Exit animation via AnimatePresence
- Index-based stagger delay
- Hover/tap feedback
- Respects `useReducedMotion`

### Best Practices

1. **Type Safety**: Always define proper TypeScript interfaces for row data
2. **Memoization**: Memoize column definitions to prevent unnecessary re-renders
3. **Motion**: Use `AnimatedTableRow` for consistent animations
4. **Reduced Motion**: Always check `useReducedMotion` for accessibility
5. **Loading States**: Show skeleton loaders during data fetching
6. **Empty States**: Provide meaningful empty state messages
7. **Responsive**: Test tables on mobile viewports

---

## Typography System

ChatPad uses a refined typography system built on Geist fonts.

### Font Families

```tsx
<p className="font-sans">Body text (Geist)</p>
<code className="font-mono">Code text (Geist Mono)</code>
```

### Type Scale

| Element | Size | Weight | Letter-Spacing | Class |
|---------|------|--------|----------------|-------|
| H1 | 16px | 600 | -0.022em | `text-base font-semibold` |
| H2 | 14px | 600 | -0.022em | `text-sm font-semibold` |
| H3 | 14px | 500 | -0.022em | `text-sm font-medium` |
| H4 | 12px | 500 | -0.022em | `text-xs font-medium` |
| Body | 14px | 400 | -0.011em | `text-sm` |
| Small | 12px | 400 | -0.011em | `text-xs` |
| Caption | 12px | 400 | -0.011em | `text-xs text-muted-foreground` |

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

### Typography Usage

```tsx
// ✅ CORRECT
<h1>Page Title</h1>
<h2>Section Title</h2>
<p>Body text content</p>
<span className="text-xs text-muted-foreground">Caption</span>
<PageHeader title="Settings" description="Manage preferences" />

// ❌ WRONG
<h1 className="text-3xl">Too large for ChatPad's compact design</h1>
```

---

## Icon System

ChatPad uses UntitledUI icons exclusively. **Never use Lucide icons.**

### Import Pattern

```tsx
import { Search01, Settings01, User01 } from '@untitledui/icons';
```

### Icon Sizing Guidelines

| Size Prop | Pixels | Use Case |
|-----------|--------|----------|
| `size={14}` | 14px | Navigation, sidebar icons |
| `size={16}` | 16px | Buttons, menu items (most common) |
| `size={18}` | 18px | Header actions, standalone buttons |
| `size={20}` | 20px | Mobile menu triggers |
| `size={24}` | 24px | Avatar fallbacks, empty states |

### Icon Color Conventions

| State | Class | Usage |
|-------|-------|-------|
| Default | `text-muted-foreground` | Inactive icons |
| Active | `text-foreground` | Active nav items |
| Brand | `text-primary` | Primary actions |
| Delete | `text-destructive` | Delete buttons |
| Success | `text-success` | Success indicators |

### FeaturedIcon Component

```tsx
<FeaturedIcon size="sm">...</FeaturedIcon>   {/* 32px container */}
<FeaturedIcon size="md">...</FeaturedIcon>   {/* 40px container (default) */}
<FeaturedIcon size="lg">...</FeaturedIcon>   {/* 48px container */}
<FeaturedIcon size="xl">...</FeaturedIcon>   {/* 56px container */}

<FeaturedIcon color="primary">...</FeaturedIcon>
<FeaturedIcon color="success">...</FeaturedIcon>
<FeaturedIcon color="warning">...</FeaturedIcon>
<FeaturedIcon color="destructive">...</FeaturedIcon>
```

### Usage Examples

```tsx
// ✅ CORRECT
<Button variant="outline" size="sm">
  <Plus size={16} className="mr-1.5" />
  Add Item
</Button>

<Button variant="ghost" size="icon">
  <Settings01 size={18} />
</Button>

<EmptyState
  icon={<FeaturedIcon size="lg" color="primary"><Search01 /></FeaturedIcon>}
  title="No results found"
/>

// ❌ WRONG
import { Search } from 'lucide-react';  // Never use Lucide
<Search01 size={16} className="w-5 h-5" />  // Conflicting sizes
```

---

## Spacing & Layout System

### Page Layout Padding

```tsx
// Standard page container
<main className="px-4 pt-4 pb-12 lg:px-8 lg:pt-8">
  {/* Mobile: 16px horizontal, 16px top, 48px bottom */}
  {/* Desktop: 32px horizontal, 32px top, 48px bottom */}
</main>
```

### Gap Scale

| Class | Value | Use Case |
|-------|-------|----------|
| `gap-1` | 4px | Icon + text inline, badge groups |
| `gap-1.5` | 6px | Tight button groups |
| `gap-2` | 8px | Related form fields |
| `gap-3` | 12px | Card content items |
| `gap-4` | 16px | Form sections |
| `gap-6` | 24px | Major page sections |
| `gap-8` | 32px | Page-level dividers |

### Component Spacing

**Card Components:**
```tsx
<Card>
  <CardHeader className="p-6">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    {content}
  </CardContent>
</Card>
```

**Sidebar Dimensions:**
- Collapsed: `w-[72px]` (72px)
- Expanded: `w-60` (240px)
- Settings sidebar: `w-64` (256px)

### Common Layout Patterns

```tsx
// Two-column settings layout
<div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
  <nav className="w-full lg:w-64 shrink-0">{/* Navigation */}</nav>
  <main className="flex-1 min-w-0">{/* Content */}</main>
</div>

// Grid of cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  <Card>...</Card>
</div>

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

```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Stack on mobile, row on desktop
<div className="flex flex-col lg:flex-row gap-4">...</div>

// Single column mobile, multi-column desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">...</div>
```

---

## Creating New Components Template

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

## Related Documentation

- [Design System](./DESIGN_SYSTEM.md) - Colors, typography tokens, spacing
- [Hooks Reference](./HOOKS_REFERENCE.md) - Data fetching hooks
- [Architecture](./ARCHITECTURE.md) - Overall system architecture
- [Database Schema](./DATABASE_SCHEMA.md) - Table reference
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget patterns
