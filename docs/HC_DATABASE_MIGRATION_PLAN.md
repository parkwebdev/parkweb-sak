# Database-First Migration Plan: Help Center Content Management

> **Document Version**: 1.2  
> **Last Updated**: 2026-01-19  
> **Status**: Complete ✓  

---

## Executive Summary

Migrate the Help Center from TSX-based articles (`src/data/help-center/**/*.tsx`) to a fully database-driven system using the existing `platform_hc_articles` and `platform_hc_categories` tables. This makes the database the single source of truth for all Help Center content, enabling full CRUD via the admin editor.

---

## Migration Complete ✓

All phases have been completed as of 2026-01-19:

| Phase | Status | Completion Date |
|-------|--------|-----------------|
| Phase 1: TipTap Extensions | ✓ Complete | 2026-01-18 |
| Phase 2: Content Rendering | ✓ Complete | 2026-01-18 |
| Phase 3: Content Migration | ✓ Complete | 2026-01-18 |
| Phase 4: Help Center Update | ✓ Complete | 2026-01-18 |
| Phase 5: Widget Update | ✓ Complete | 2026-01-18 |
| Phase 6: Cleanup | ✓ Complete | 2026-01-19 |
| Phase 7: Testing | ✓ Complete | 2026-01-19 |

---

## Completion Summary

### Files Deleted

| Path | Count | Status |
|------|-------|--------|
| `src/data/help-center/getting-started/*.tsx` | 4 | ✓ Deleted |
| `src/data/help-center/ari/*.tsx` | 15 | ✓ Deleted |
| `src/data/help-center/inbox/*.tsx` | 2 | ✓ Deleted |
| `src/data/help-center/leads/*.tsx` | 2 | ✓ Deleted |
| `src/data/help-center/planner/*.tsx` | 1 | ✓ Deleted |
| `src/data/help-center/analytics/*.tsx` | 2 | ✓ Deleted |
| `src/data/help-center/settings/*.tsx` | 7 | ✓ Deleted |
| `src/config/help-center-config.ts` | 1 | ✓ Deleted |
| **Total** | **34** | **✓** |

### Files Modified

| File | Changes |
|------|---------|
| `src/hooks/useSearchData.ts` | Updated to query database instead of HC_CATEGORIES |
| `src/hooks/useHCArticleViews.ts` | Updated to use database-driven article lookup |
| `src/components/help-center/HCPopularArticles.tsx` | Updated types for DB-sourced articles |

### Database Migrations Applied

| Migration | Description |
|-----------|-------------|
| `20260119032809_e27d5f6a-...` | Fixed related articles HTML structure |

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SINGLE SOURCE OF TRUTH                       │
│                                                                       │
│   ┌───────────────────────────────────────────────────────────────┐  │
│   │                    Supabase Database                           │  │
│   │   ┌─────────────────────┐  ┌─────────────────────────────┐   │  │
│   │   │platform_hc_categories│  │   platform_hc_articles      │   │  │
│   │   │• id                  │  │• id, slug, title, content  │   │  │
│   │   │• label               │←─│• category_id (FK)           │   │  │
│   │   │• color, icon_name    │  │• is_published               │   │  │
│   │   │• order_index         │  │• order_index                │   │  │
│   │   └─────────────────────┘  └─────────────────────────────┘   │  │
│   └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Admin Editor      │  │  User Help Center   │  │   Widget Help Tab   │
│  /admin/knowledge   │  │    /help-center     │  │   Embedded Widget   │
│                     │  │                     │  │                     │
│  usePlatformHC      │  │ usePlatformHelpCenter│ │  useHelpArticles    │
│  Articles/Categories│  │                     │  │                     │
│                     │  │ HCDatabaseArticle   │  │  HTML rendering     │
│  TipTap WYSIWYG     │  │   Renderer          │  │  with CSS styling   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

## Key Components

### Hooks

| Hook | Purpose |
|------|---------|
| `usePlatformHelpCenter` | Fetches categories + published articles for Help Center |
| `usePlatformHCCategories` | Admin: fetches categories for editing |
| `usePlatformHCArticles` | Admin: fetches articles for editing |
| `useHelpArticles` | Widget: fetches articles for agent's help tab |
| `useHCArticleViews` | Tracks article views, fetches popular articles |

### Rendering

| Component | Purpose |
|-----------|---------|
| `HCDatabaseArticleRenderer` | Renders HTML content with custom block styling |
| `HCDatabaseArticleRenderer.css` | CSS-only styling for custom blocks |

### Custom Blocks (TipTap)

| Extension | HTML Output |
|-----------|-------------|
| `CalloutNode` | `<div data-callout data-callout-type="info|warning|tip|error">` |
| `StepByStepNode` | `<div data-stepbystep>` with `<div data-step>` children |
| `FeatureCardNode` | `<div data-feature-card>` |
| `FeatureGridNode` | `<div data-feature-grid data-columns="2|3">` |
| `RelatedArticlesNode` | `<div data-related-articles>` with anchor links |
| `ArticleLinkMark` | `<a data-article-link href="...">` |

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-18 | 1.0 | Initial plan created |
| 2026-01-18 | 1.1 | Phases 1-5 completed |
| 2026-01-19 | 1.2 | **Migration Complete** - Phase 6 cleanup executed, all TSX files deleted, useSearchData updated to use database |

---

## Archive: Original Plan Phases

<details>
<summary>View original planning phases (for reference)</summary>

### Phase 1: Extend TipTap Editor with Custom Components
Created TipTap extensions for all custom HC components.

### Phase 2: Create Content Rendering Components
Created HCDatabaseArticleRenderer with CSS-only styling for custom blocks.

### Phase 3: Migrate TSX Content to Database
All 33 articles migrated to platform_hc_articles table via SQL.

### Phase 4: Update User-Facing Help Center
HelpCenter.tsx now uses usePlatformHelpCenter hook.

### Phase 5: Update Widget Help View
Widget renders database content with proper styling.

### Phase 6: Cleanup and Deprecation
- Deleted all 33 TSX article files
- Deleted help-center-config.ts
- Updated useSearchData.ts to query database
- Updated useHCArticleViews.ts for database lookups

### Phase 7: Testing and Verification
- Admin editor verified
- User-facing Help Center verified
- Widget Help tab verified
- Search functionality verified

</details>
