# Database-First Migration Plan: Help Center Content Management

> **Document Version**: 1.0  
> **Last Updated**: 2026-01-18  
> **Status**: Planning  

---

## Executive Summary

Migrate the Help Center from TSX-based articles (`src/data/help-center/**/*.tsx`) to a fully database-driven system using the existing `platform_hc_articles` and `platform_hc_categories` tables. This makes the database the single source of truth for all Help Center content, enabling full CRUD via the admin editor.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Phase 1: Extend TipTap Editor](#phase-1-extend-tiptap-editor-with-custom-components)
3. [Phase 2: Content Rendering Components](#phase-2-create-content-rendering-components)
4. [Phase 3: Migrate TSX Content to Database](#phase-3-migrate-tsx-content-to-database)
5. [Phase 4: Update User-Facing Help Center](#phase-4-update-user-facing-help-center)
6. [Phase 5: Update Widget Help View](#phase-5-update-widget-help-view)
7. [Phase 6: Cleanup and Deprecation](#phase-6-cleanup-and-deprecation)
8. [Phase 7: Testing and Verification](#phase-7-testing-and-verification)
9. [File Inventory](#file-inventory)
10. [Database Changes](#database-changes)
11. [Estimated Effort](#estimated-effort)
12. [Risks and Mitigations](#risks-and-mitigations)
13. [Success Criteria](#success-criteria)

---

## Current State Analysis

### Two Separate Systems Exist

#### System A: User-Facing Help Center (TSX-Based)
| Aspect | Details |
|--------|---------|
| **Location** | `src/data/help-center/**/*.tsx` (31 article files across 7 categories) |
| **Config** | `src/config/help-center-config.ts` defines `HC_CATEGORIES` array |
| **Page** | `src/pages/HelpCenter.tsx` renders via lazy-loaded React components |
| **Features** | Rich interactive components (`HCCallout`, `HCFeatureCard`, `HCFeatureGrid`, `HCStepByStep`, `HCArticleLink`, `HCRelatedArticles`) |
| **Rendering** | Uses `<ArticleComponent />` which renders the TSX component directly |

#### System B: Admin Platform Knowledge Editor (Database-Based)
| Aspect | Details |
|--------|---------|
| **Tables** | `platform_hc_articles`, `platform_hc_categories` |
| **Admin Pages** | `/admin/knowledge`, `/admin/knowledge/:articleId` |
| **Editor** | TipTap WYSIWYG with `CalloutNode` extension |
| **Hooks** | `usePlatformHCArticles()`, `usePlatformHCCategories()` |
| **Rendering** | HTML content stored in `content` column |

### The Core Problem

- User-facing Help Center reads from TSX files (System A)
- Admin editor writes to database (System B)
- **They are completely disconnected** — admin edits don't appear in Help Center

### Article Inventory (31 Total Articles)

| Category | Count | Articles |
|----------|-------|----------|
| Getting Started | 4 | Welcome, Quick Start, Navigation, Dashboard |
| Ari | 15 | Overview, System Prompt, Appearance, Welcome Messages, Lead Capture, Knowledge Sources, Locations, Help Articles, Announcements, News, Custom Tools, Webhooks, Integrations, API Access, Installation |
| Inbox | 2 | Overview, Takeover |
| Leads | 2 | Overview, Stages |
| Planner | 1 | Overview |
| Analytics | 2 | Overview, Report Builder |
| Settings | 7 | General, Profile, Team, Billing, Usage, Notifications, Sessions |

---

## Phase 1: Extend TipTap Editor with Custom Components

**Estimated Time**: 2-3 hours

The current editor only has `CalloutNode`. We need to add TipTap extensions for all custom HC components.

### 1.1 Create `StepByStepNode` TipTap Extension

**File**: `src/components/admin/knowledge/StepByStepNode.ts`

| Requirement | Implementation |
|-------------|----------------|
| HTML Output | `<div data-stepbystep>` with ordered `<div data-step>` children |
| Step Structure | title (required), description (optional), screenshot (optional) |
| Attributes | `steps` array stored as JSON |
| Parseability | HTML output must be parseable back into editable form |
| Styling | CSS classes using semantic tokens matching `HCStepByStep` |

```typescript
// Example HTML output:
<div data-stepbystep>
  <div data-step data-step-number=\"1\">
    <div data-step-title>Step Title</div>
    <div data-step-description>Description here</div>
    <img data-step-screenshot src=\"...\" alt=\"...\" />
  </div>
  <!-- more steps -->
</div>
```

### 1.2 Create `FeatureCardNode` TipTap Extension

**File**: `src/components/admin/knowledge/FeatureCardNode.ts`

| Requirement | Implementation |
|-------------|----------------|
| Card HTML | `<div data-feature-card>` |
| Attributes | `title`, `description`, `iconName` (UntitledUI icon name) |
| Grid Wrapper | `<div data-feature-grid columns=\"2|3\">` for grouping cards |

```typescript
// Example HTML output:
<div data-feature-grid data-columns=\"3\">
  <div data-feature-card>
    <span data-feature-icon>Bot</span>
    <h4 data-feature-title>Feature Title</h4>
    <p data-feature-description>Description here</p>
  </div>
  <!-- more cards -->
</div>
```

### 1.3 Create `RelatedArticlesNode` TipTap Extension

**File**: `src/components/admin/knowledge/RelatedArticlesNode.ts`

| Requirement | Implementation |
|-------------|----------------|
| HTML Output | `<div data-related-articles>` |
| Data Storage | Array of `{categoryId, articleSlug, title}` as JSON attribute |
| Rendering | Converts to clickable links on display |

```typescript
// Example HTML output:
<div data-related-articles data-articles='[{\\\"categoryId\\\":\\\"ari\\\",\\\"articleSlug\\\":\\\"overview\\\",\\\"title\\\":\\\"Ari Overview\\\"}]'>
  <a href=\"/help-center?category=ari&article=overview\">Ari Overview</a>
</div>
```

### 1.4 Create `ArticleLinkNode` TipTap Extension (Inline)

**File**: `src/components/admin/knowledge/ArticleLinkNode.ts`

| Requirement | Implementation |
|-------------|----------------|
| Type | Mark extension (inline, not block) |
| Attributes | `categoryId`, `articleSlug` |
| HTML Output | `<a data-article-link href=\"/help-center?category=X&article=Y\">` |
| Purpose | Replaces `HCArticleLink` in content |

### 1.5 Update `EditorInsertPanel.tsx`

**File**: `src/components/admin/knowledge/EditorInsertPanel.tsx`

Add new block options to the insert panel:

| Block Type | Action |
|------------|--------|
| \"Step-by-Step Guide\" | Inserts empty `StepByStepNode` |
| \"Feature Card\" | Inserts single `FeatureCardNode` |
| \"Feature Grid (2 col)\" | Inserts `FeatureGridNode` with 2 empty cards |
| \"Feature Grid (3 col)\" | Inserts `FeatureGridNode` with 3 empty cards |
| \"Related Articles\" | Opens modal to select articles, inserts `RelatedArticlesNode` |
| \"Article Link\" | Floating toolbar command (inline link to other article) |

### 1.6 Update `ArticleEditor.tsx` Extensions Array

**File**: `src/components/admin/knowledge/ArticleEditor.tsx`

```typescript
import { StepByStepNode } from './StepByStepNode';
import { FeatureCardNode, FeatureGridNode } from './FeatureCardNode';
import { RelatedArticlesNode } from './RelatedArticlesNode';
import { ArticleLinkMark } from './ArticleLinkNode';

const extensions = [
  // ... existing extensions
  StepByStepNode,
  FeatureCardNode,
  FeatureGridNode,
  RelatedArticlesNode,
  ArticleLinkMark,
];
```

### 1.7 Update `EditorFloatingToolbar.tsx` for Article Links

**File**: `src/components/admin/knowledge/EditorFloatingToolbar.tsx`

| Feature | Implementation |
|---------|----------------|
| New Button | \"Link to Article\" button in toolbar |
| Action | Opens dropdown/modal to search and select other articles |
| Result | Inserts `ArticleLinkMark` on selected text |

---

## Phase 2: Create Content Rendering Components

**Estimated Time**: 1-2 hours

The database stores HTML. The user-facing Help Center needs to render this HTML with proper styling for custom blocks.

### 2.1 Create `HCDatabaseArticleRenderer` Component

**File**: `src/components/help-center/HCDatabaseArticleRenderer.tsx`

```typescript
interface Props {
  content: string; // HTML from database
  className?: string;
}

export function HCDatabaseArticleRenderer({ content, className }: Props) {
  // Implementation steps:
  // 1. Sanitize HTML with DOMPurify
  // 2. Parse custom data-* attributes into React components
  // 3. Handle mapping:
  //    - data-callout → render HCCallout
  //    - data-stepbystep → render HCStepByStep
  //    - data-feature-grid → render HCFeatureGrid
  //    - data-feature-card → render HCFeatureCard
  //    - data-related-articles → render HCRelatedArticles
  //    - data-article-link → render HCArticleLink
  // 4. Use react-html-parser or custom DOM parser
}
```

### 2.2 CSS-Only Fallback Approach

If React hydration is too complex, use CSS-only styling:

```css
/* Callouts */
.article-content [data-callout] {
  border-radius: 0.5rem;
  border-left-width: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.article-content [data-callout-type="info"] {
  background: hsl(var(--primary) / 0.1);
  border-color: hsl(var(--primary) / 0.3);
}

/* Step-by-step */
.article-content [data-stepbystep] { /* styles */ }
.article-content [data-step] { /* styles */ }

/* Feature cards */
.article-content [data-feature-grid] { /* grid layout */ }
.article-content [data-feature-card] { /* card styles */ }
```

### 2.3 Update ALLOWED_TAGS in Widget HelpView

**File**: `src/widget/views/HelpView.tsx`

```typescript
const ALLOWED_TAGS = [
  ...existingTags,
  'div', 'section', // For custom blocks
];

const ALLOWED_ATTR = [
  ...existingAttrs,
  'data-callout', 'data-callout-type',
  'data-stepbystep', 'data-step', 'data-step-number',
  'data-step-title', 'data-step-description', 'data-step-screenshot',
  'data-feature-grid', 'data-columns',
  'data-feature-card', 'data-feature-icon', 'data-feature-title', 'data-feature-description',
  'data-related-articles', 'data-articles',
  'data-article-link',
];
```

---

## Phase 3: Migrate TSX Content to Database

**Estimated Time**: 2-3 hours

### 3.1 Create Migration Script

**File**: `scripts/migrate-hc-articles.ts` (run once, manually)

```typescript
// Migration algorithm:
// For each category in HC_CATEGORIES:
//   1. Ensure category exists in platform_hc_categories
//   2. For each article:
//      a. Render TSX to HTML string (using ReactDOMServer)
//      b. Convert HCCallout/HCFeatureCard/etc to data-* HTML
//      c. Insert into platform_hc_articles with:
//         - category_id, slug, title, description
//         - content (converted HTML)
//         - is_published: true
//         - order_index: preserve current order
```

### 3.2 Manual Content Conversion (Alternative)

If automated conversion is too fragile:

1. Open each TSX article file
2. Copy content structure
3. Manually recreate in admin editor at `/admin/knowledge/new`
4. Use TipTap's block insertion to add callouts, steps, etc.
5. Publish each article

### 3.3 Category Seeding

Ensure `platform_hc_categories` has all 7 categories:

| id | label | color | icon_name | order_index |
|----|-------|-------|-----------|-------------|
| getting-started | Getting Started | bg-info | Flag01 | 0 |
| ari | Ari (Your AI Agent) | bg-accent-purple | Bot | 1 |
| inbox | Inbox | bg-success | MessageSquare01 | 2 |
| leads | Leads | bg-warning | Users01 | 3 |
| planner | Planner | bg-status-active | Calendar | 4 |
| analytics | Analytics | bg-destructive | BarChart01 | 5 |
| settings | Settings & Team | bg-muted-foreground | Settings01 | 6 |

---

## Phase 4: Update User-Facing Help Center

**Estimated Time**: 2-3 hours

### 4.1 Create `usePlatformHCPublished` Hook

**File**: `src/hooks/usePlatformHCPublished.ts`

```typescript
/**
 * Fetches ONLY published articles (is_published = true)
 * Does NOT require admin auth - uses public RLS policy
 * Includes category info joined
 */
export function usePlatformHCPublished() {
  return useQuery({
    queryKey: ['platform-hc-published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_hc_articles')
        .select(`
          id, slug, title, description, content, icon_name, order_index,
          category:platform_hc_categories!fk_platform_hc_articles_category(
            id, label, color, icon_name, order_index
          )
        `)
        .eq('is_published', true)
        .order('order_index');
      
      if (error) throw error;
      
      // Group by category
      const categoriesMap = new Map();
      for (const article of data) {
        const cat = article.category;
        if (!categoriesMap.has(cat.id)) {
          categoriesMap.set(cat.id, { ...cat, articles: [] });
        }
        categoriesMap.get(cat.id).articles.push({
          id: article.id,
          slug: article.slug,
          title: article.title,
          description: article.description,
          content: article.content,
          iconName: article.icon_name,
        });
      }
      
      return Array.from(categoriesMap.values()).sort((a, b) => 
        a.order_index - b.order_index
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
```

### 4.2 Update `HelpCenter.tsx` Page

**File**: `src/pages/HelpCenter.tsx`

#### Remove:
```typescript
// DELETE these imports
import { HC_CATEGORIES, getHCCategoryById, ... } from '@/config/help-center-config';
```

#### Add:
```typescript
import { usePlatformHCPublished } from '@/hooks/usePlatformHCPublished';
import { HCDatabaseArticleRenderer } from '@/components/help-center/HCDatabaseArticleRenderer';
```

#### Replace:
- All references to `HC_CATEGORIES` → use `categories` from hook
- All `article.component` renders → use `<HCDatabaseArticleRenderer content={article.content} />`

### 4.3 Update `HCArticleView.tsx`

**File**: `src/components/help-center/HCArticleView.tsx`

#### Current (renders TSX component):
```tsx
const ArticleComponent = article.component;
<ArticleComponent />
```

#### New (renders HTML from database):
```tsx
// Transitional: support both legacy TSX and new database content
{article.component ? (
  <ArticleComponent />
) : (
  <HCDatabaseArticleRenderer content={article.content} />
)}

// After full migration:
<HCDatabaseArticleRenderer content={article.content} />
```

### 4.4 Update `HCSidebar.tsx` Props

**File**: `src/components/help-center/HCSidebar.tsx`

- Update types to accept database-sourced categories
- Categories now have `label` property from database

### 4.5 Update `HCCategoryView.tsx`

**File**: `src/components/help-center/HCCategoryView.tsx`

- Accept database article structure
- Render article cards from database content

### 4.6 Update/Remove Helper Functions

**File**: `src/config/help-center-config.ts`

| Function | Action |
|----------|--------|
| `getHCCategoryById` | Remove - query from hook data instead |
| `getHCArticle` | Remove - query from hook data instead |
| `getHCArticleBySlug` | Remove - query from hook data instead |
| `getFirstHCArticle` | Remove - derive from hook data |
| `getAdjacentArticles` | Remove - derive from hook data |

---

## Phase 5: Update Widget Help View

**Estimated Time**: 1 hour

### 5.1 Verify Widget Database Integration

The widget's `HelpView.tsx` already receives `helpArticles` from props and renders HTML via `dangerouslySetInnerHTML`. The data comes from `EmbedPreviewPanel.tsx` which calls `useHelpArticles(agentId)`.

**Verification Checklist**:
- [ ] Custom blocks render with proper CSS
- [ ] Links work (`data-article-link`)
- [ ] Callouts display styled
- [ ] Images load correctly

### 5.2 Add CSS for Custom Blocks in Widget

**File**: `src/widget/widget.css`

```css
/* Callout styles */
.article-content [data-callout] {
  border-radius: 0.5rem;
  border-left-width: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.article-content [data-callout-type="info"] {
  background: rgba(var(--primary-rgb), 0.1);
  border-color: rgba(var(--primary-rgb), 0.3);
}

.article-content [data-callout-type="warning"] {
  background: rgba(var(--warning-rgb), 0.1);
  border-color: rgba(var(--warning-rgb), 0.3);
}

.article-content [data-callout-type="success"] {
  background: rgba(var(--success-rgb), 0.1);
  border-color: rgba(var(--success-rgb), 0.3);
}

.article-content [data-callout-type="error"] {
  background: rgba(var(--destructive-rgb), 0.1);
  border-color: rgba(var(--destructive-rgb), 0.3);
}

/* Step-by-step styles */
.article-content [data-stepbystep] {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.article-content [data-step] {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(var(--muted-rgb), 0.5);
  border-radius: 0.5rem;
}

.article-content [data-step]::before {
  content: attr(data-step-number);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

/* Feature card styles */
.article-content [data-feature-grid] {
  display: grid;
  gap: 1rem;
}

.article-content [data-feature-grid][data-columns="2"] {
  grid-template-columns: repeat(2, 1fr);
}

.article-content [data-feature-grid][data-columns="3"] {
  grid-template-columns: repeat(3, 1fr);
}

.article-content [data-feature-card] {
  padding: 1rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
}

/* Related articles */
.article-content [data-related-articles] {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(var(--muted-rgb), 0.5);
  border-radius: 0.5rem;
  margin-top: 2rem;
}

.article-content [data-related-articles] a {
  color: var(--primary);
  text-decoration: underline;
}

/* Article links */
.article-content [data-article-link] {
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
}
```

---

## Phase 6: Cleanup and Deprecation

**Estimated Time**: 1 hour

### 6.1 Delete TSX Article Files

After successful migration and verification:

```bash
rm -rf src/data/help-center/
```

**Files to Delete** (31 total):
- `src/data/help-center/getting-started/*.tsx`
- `src/data/help-center/ari/*.tsx`
- `src/data/help-center/inbox/*.tsx`
- `src/data/help-center/leads/*.tsx`
- `src/data/help-center/planner/*.tsx`
- `src/data/help-center/analytics/*.tsx`
- `src/data/help-center/settings/*.tsx`

### 6.2 Remove Static Config

**File**: `src/config/help-center-config.ts`

Options:
1. Delete `HC_CATEGORIES` array entirely
2. Delete all lazy imports
3. Keep only types if needed for backwards compatibility
4. Or delete entire file if unused

### 6.3 Update TypeScript Types

**File**: `src/types/platform-hc.ts`

Add any missing fields:

```typescript
export interface PlatformHCArticlePublic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string; // HTML
  icon_name: string | null;
  order_index: number;
  category: {
    id: string;
    label: string;
    color: string;
    icon_name: string;
  };
}

export interface PlatformHCCategoryWithArticles {
  id: string;
  label: string;
  color: string;
  icon_name: string;
  order_index: number;
  articles: PlatformHCArticlePublic[];
}
```

### 6.4 Update Component Exports

**File**: `src/components/help-center/index.ts`

```typescript
export { HCDatabaseArticleRenderer } from './HCDatabaseArticleRenderer';
```

---

## Phase 7: Testing and Verification

**Estimated Time**: 1-2 hours

### 7.1 Admin Editor Tests

| Test | Expected Result |
|------|-----------------|
| Create new article via `/admin/knowledge/new` | Article saved to database |
| Insert each block type (callout, steps, feature cards, related articles) | Blocks render in editor |
| Save as draft | Content persists, `is_published = false` |
| Publish | `is_published = true` in database |
| Edit existing article | All blocks render correctly in editor |
| Unpublish | Reverts to draft (`is_published = false`) |

### 7.2 User-Facing Help Center Tests

| Test | Expected Result |
|------|-----------------|
| Navigate to `/help-center` | All categories display |
| Click into each category | Articles list renders |
| Open each article | Content renders correctly |
| Callouts styled properly | Colored background, border |
| Step-by-step numbered correctly | Sequential numbers display |
| Feature cards in grid | Grid layout with proper columns |
| Related articles clickable | Navigate to linked article |
| Article links navigate correctly | Inline links work |
| Prev/next navigation | Navigate between articles |
| Search functionality | Find articles by title/content |
| ToC generation from headings | Headings extracted, clickable |

### 7.3 Widget Tests

| Test | Expected Result |
|------|-----------------|
| Open widget preview | Widget loads |
| Navigate to Help tab | Categories and articles display |
| Open article | HTML renders with proper styling |
| Custom blocks display | Callouts, steps, cards styled |

### 7.4 RLS Policy Verification

```sql
-- As unauthenticated user:
SELECT * FROM platform_hc_articles WHERE is_published = true;
-- Expected: Returns published articles ✓

SELECT * FROM platform_hc_categories;
-- Expected: Returns all categories ✓

INSERT INTO platform_hc_articles (title, content, ...) VALUES (...);
-- Expected: FAILS (super admin only) ✗
```

---

## File Inventory

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/knowledge/StepByStepNode.ts` | TipTap extension for step-by-step guides |
| `src/components/admin/knowledge/FeatureCardNode.ts` | TipTap extension for feature cards/grids |
| `src/components/admin/knowledge/RelatedArticlesNode.ts` | TipTap extension for related articles block |
| `src/components/admin/knowledge/ArticleLinkNode.ts` | TipTap mark for inline article links |
| `src/components/help-center/HCDatabaseArticleRenderer.tsx` | Renders HTML content with custom block hydration |
| `src/hooks/usePlatformHCPublished.ts` | Fetches published articles for user-facing HC |
| `scripts/migrate-hc-articles.ts` (optional) | One-time migration script |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/knowledge/ArticleEditor.tsx` | Add new TipTap extensions |
| `src/components/admin/knowledge/EditorInsertPanel.tsx` | Add new block insertion options |
| `src/components/admin/knowledge/EditorFloatingToolbar.tsx` | Add article link button |
| `src/pages/HelpCenter.tsx` | Use database hook instead of static config |
| `src/components/help-center/HCArticleView.tsx` | Render HTML instead of component |
| `src/components/help-center/HCSidebar.tsx` | Accept database-sourced props |
| `src/components/help-center/HCCategoryView.tsx` | Accept database article structure |
| `src/widget/views/HelpView.tsx` | Update ALLOWED_TAGS for custom blocks |
| `src/widget/widget.css` | Add styles for custom blocks |
| `src/components/help-center/index.ts` | Export new components |

### Files to Delete (After Migration)

| Path | Reason |
|------|--------|
| `src/data/help-center/**/*.tsx` | All 31 article files replaced by database |
| `src/config/help-center-config.ts` | Static config no longer needed |

---

## Database Changes

### Add `featured_image` Column (Optional)

```sql
ALTER TABLE platform_hc_articles 
ADD COLUMN featured_image TEXT DEFAULT NULL;
```

### Seed Categories (If Not Already Seeded)

```sql
INSERT INTO platform_hc_categories (id, label, color, icon_name, order_index) VALUES
('getting-started', 'Getting Started', 'bg-info', 'Flag01', 0),
('ari', 'Ari (Your AI Agent)', 'bg-accent-purple', 'Bot', 1),
('inbox', 'Inbox', 'bg-success', 'MessageSquare01', 2),
('leads', 'Leads', 'bg-warning', 'Users01', 3),
('planner', 'Planner', 'bg-status-active', 'Calendar', 4),
('analytics', 'Analytics', 'bg-destructive', 'BarChart01', 5),
('settings', 'Settings & Team', 'bg-muted-foreground', 'Settings01', 6)
ON CONFLICT (id) DO NOTHING;
```

### RLS Policy for Public Read Access

```sql
-- Allow anyone to read published articles
CREATE POLICY "Anyone can read published articles"
ON platform_hc_articles
FOR SELECT
USING (is_published = true);

-- Allow anyone to read categories
CREATE POLICY "Anyone can read categories"
ON platform_hc_categories
FOR SELECT
USING (true);
```

---

## Estimated Effort

| Phase | Time | Description |
|-------|------|-------------|
| Phase 1 | 2-3 hours | TipTap Extensions |
| Phase 2 | 1-2 hours | Content Renderer |
| Phase 3 | 2-3 hours | Content Migration |
| Phase 4 | 2-3 hours | Help Center Update |
| Phase 5 | 1 hour | Widget Update |
| Phase 6 | 1 hour | Cleanup |
| Phase 7 | 1-2 hours | Testing |
| **TOTAL** | **10-15 hours** | |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Content loss during migration | Medium | High | Keep TSX files until migration verified |
| Complex TSX not converting to HTML | Medium | Medium | Manual recreation in editor for complex articles |
| Widget performance with large HTML | Low | Medium | Add content length limits, lazy-load DOMPurify (already done) |
| Broken internal links | Medium | Medium | Validate all `data-article-link` hrefs post-migration |
| Missing styles for custom blocks | Low | High | Comprehensive CSS review before launch |
| TipTap extension bugs | Medium | High | Thorough testing of each extension in isolation |
| RLS policy misconfiguration | Low | High | Test all policies before deploying |

---

## Success Criteria

### Functional Requirements

- [ ] Admin can create, edit, publish articles via `/admin/knowledge`
- [ ] Published articles appear in `/help-center` immediately
- [ ] All custom blocks (callouts, steps, feature cards) render correctly
- [ ] Article links navigate correctly between articles
- [ ] Widget Help tab displays database content
- [ ] Drafts do NOT appear to users
- [ ] Search works across all articles

### Technical Requirements

- [ ] No TSX files remain in `src/data/help-center/`
- [ ] All content sourced from `platform_hc_articles` table
- [ ] TipTap editor supports all custom block types
- [ ] HTML content properly sanitized before rendering
- [ ] RLS policies correctly restrict write access

### Performance Requirements

- [ ] Help Center page loads in < 2 seconds
- [ ] Article content renders without visible delay
- [ ] Widget Help tab remains responsive

---

## Appendix: Component Mapping

### TSX Component → TipTap Node → HTML Output

| TSX Component | TipTap Extension | HTML Data Attribute |
|---------------|------------------|---------------------|
| `HCCallout` | `CalloutNode` (exists) | `data-callout`, `data-callout-type` |
| `HCStepByStep` | `StepByStepNode` | `data-stepbystep`, `data-step` |
| `HCFeatureCard` | `FeatureCardNode` | `data-feature-card` |
| `HCFeatureGrid` | `FeatureGridNode` | `data-feature-grid` |
| `HCRelatedArticles` | `RelatedArticlesNode` | `data-related-articles` |
| `HCArticleLink` | `ArticleLinkMark` | `data-article-link` |

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-18 | 1.0 | Initial plan created |
| 2026-01-18 | 1.1 | Full component parity approach confirmed - includes all TipTap extensions for StepByStep, FeatureCard, RelatedArticles, ArticleLink |

---

## Content Safety Guarantee

This migration is designed with multiple layers of content protection:

1. **Git History Preservation** - All TSX files remain in Git history even after deletion, allowing recovery at any time via `git checkout`
2. **Staged Migration** - TSX files are only deleted AFTER all content is verified in the database
3. **Supabase PITR Backups** - Database content is continuously backed up via Point-in-Time Recovery
4. **Incremental Verification** - Each phase includes verification steps before proceeding to the next
5. **Dual-Mode Support** - Phase 4 includes transitional code that supports both TSX and database content during migration
