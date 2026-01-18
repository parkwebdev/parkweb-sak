# Article Editor Implementation Guide

> Full-page, Craft-inspired article editor for the Platform Help Center.

## Overview

Transform the platform Help Center article editing from a Sheet-based approach to a dedicated full-page editor experience. The editor features a three-panel layout with real-time table of contents, inline formatting toolbar, and block insertion panel.

---

## Visual Reference

The design is inspired by **Craft** (craft.do), featuring:
- Clean, distraction-free writing environment
- Left sidebar with live Table of Contents
- Right sidebar with draggable/insertable blocks
- Floating inline toolbar on text selection
- Collapsible metadata panel

---

## Route Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/knowledge` | `AdminKnowledge` | List page (existing) |
| `/admin/knowledge/new` | `ArticleEditorPage` | Create new article |
| `/admin/knowledge/:articleId` | `ArticleEditorPage` | Edit existing article |

---

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  TopBar                                                                          │
│  [← Knowledge] / Article Title (inline editable)         [Draft/Published] [⚙]  │
├─────────────┬────────────────────────────────────────────┬──────────────────────┤
│             │                                            │                      │
│  LEFT       │           CENTER                           │    RIGHT             │
│  SIDEBAR    │           MAIN EDITOR                      │    SIDEBAR           │
│             │                                            │                      │
│  ┌────────┐ │  ┌──────────────────────────────────────┐  │  ┌────────────────┐  │
│  │ Table  │ │  │                                      │  │  │    Insert      │  │
│  │ of     │ │  │     TipTap Rich Text Editor          │  │  │                │  │
│  │Contents│ │  │                                      │  │  │  📝 Text       │  │
│  │        │ │  │     - WYSIWYG editing                │  │  │  📄 Page       │  │
│  │ • H1   │ │  │     - Floating toolbar on select     │  │  │  🗂 Card       │  │
│  │   • H2 │ │  │     - Auto-save (2s debounce)        │  │  │  📎 Attachment │  │
│  │   • H2 │ │  │     - Keyboard shortcuts             │  │  │  🖼 Image      │  │
│  │ • H1   │ │  │                                      │  │  │  🌄 Unsplash   │  │
│  │   • H3 │ │  │                                      │  │  │  </> Code      │  │
│  │        │ │  │                                      │  │  │  🎨 Whiteboard │  │
│  └────────┘ │  └──────────────────────────────────────┘  │  │  √x Formula    │  │
│             │                                            │  │                │  │
│             │  ┌──────────────────────────────────────┐  │  │  ─── Lines ─── │  │
│             │  │ Floating Toolbar (on text select)    │  │  │  · · ·  ······ │  │
│             │  │ [✏ ▾][B][I][S][</>][🔗][√x][@][😊]  │  │  │  ___    ───    │  │
│             │  └──────────────────────────────────────┘  │  │                │  │
│             │                                            │  │  Page Break    │  │
│             │                                            │  │  ┌──────────┐  │  │
│             │                                            │  │  │          │  │  │
│             │                                            │  │  └──────────┘  │  │
│             │                                            │  │                │  │
│             │                                            │  │  Insert Table  │  │
│             │                                            │  │  ┌─┬─┬─┬─┬─┐  │  │
│             │                                            │  │  ├─┼─┼─┼─┼─┤  │  │
│             │                                            │  │  └─┴─┴─┴─┴─┘  │  │
│             │                                            │  └────────────────┘  │
├─────────────┴────────────────────────────────────────────┴──────────────────────┤
│  Metadata Panel (Collapsible)                                                    │
│  [▼ Article Settings]  Slug: _______  Category: [▼]  Order: ___  Description    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Files to Create

| File | Description |
|------|-------------|
| `src/pages/admin/ArticleEditorPage.tsx` | Main page component with three-panel layout |
| `src/components/admin/knowledge/EditorInsertPanel.tsx` | Right sidebar block inserter |
| `src/components/admin/knowledge/EditorFloatingToolbar.tsx` | BubbleMenu toolbar on text selection |
| `src/components/admin/knowledge/EditorMetadataPanel.tsx` | Collapsible metadata section |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add new routes |
| `src/pages/admin/index.ts` | Export new page |
| `src/pages/admin/AdminKnowledge.tsx` | Row click → navigate to editor |
| `src/components/admin/knowledge/PlatformArticlesTable.tsx` | Add `onRowClick` prop |

### Existing Components to Reuse

| Component | Usage |
|-----------|-------|
| `HCTableOfContents` | Left sidebar (adapt for editor context) |
| `RichTextEditor` | Main content editor |
| `RichTextToolbar` | Reference for toolbar buttons |
| `useAutoSave` | Debounced saving |
| `TopBar` + `TopBarPageContext` | Page header with navigation |
| `usePlatformHCArticles` | Article CRUD operations |
| `usePlatformHCCategories` | Category dropdown data |
| `Collapsible` | Metadata panel |
| `ScrollArea` | Sidebar scrolling |
| `IconButton` | Toolbar/panel buttons |
| `Input`, `Select`, `Textarea` | Metadata form fields |
| `Badge`, `Switch` | Publish status |

---

## Right Sidebar: Insert Panel

### Block Types

| Block | Icon | TipTap Command | Description |
|-------|------|----------------|-------------|
| Text | `Type01` | `setParagraph()` | Standard paragraph |
| Page | `File06` | Custom node | Nested page/section |
| Card | `LayoutAlt02` | Custom node | Card container |
| File Attachment | `Paperclip` | Custom node | Upload file |
| Image | `Image01` | `setImage()` | Upload image |
| Code Block | `CodeSnippet02` | `toggleCodeBlock()` | Syntax highlighted |
| Whiteboard | `PenTool02` | Custom node | Drawing canvas (future) |

### Line Types

| Type | Preview | Command |
|------|---------|---------|
| Dots | `· · ·` | `setHorizontalRule({ type: 'dots' })` |
| Dashes | `· · · · · · ·` | `setHorizontalRule({ type: 'dashes' })` |
| Light | `───────` | `setHorizontalRule({ type: 'light' })` |
| Heavy | `━━━━━━━` | `setHorizontalRule({ type: 'heavy' })` |

### Page Break

Insert visual page break separator.

### Table Grid

Interactive grid selector for inserting tables (like Word/Google Docs):
- Hover to select dimensions (e.g., 4×3)
- Click to insert table at cursor

---

## Floating Toolbar

Appears when text is selected. Uses TipTap's `BubbleMenu` extension.

### Toolbar Items

| Icon | Action | Shortcut |
|------|--------|----------|
| ✏️ ▾ | Text color picker | - |
| **B** | Bold | `Cmd+B` |
| *I* | Italic | `Cmd+I` |
| ~~S~~ | Strikethrough | `Cmd+Shift+S` |
| `</>` | Inline code | `Cmd+E` |
| 🔗 | Insert/edit link | `Cmd+K` |
| @ | Mention | - |
| 😊 | Emoji picker | - |

---

## Left Sidebar: Table of Contents

### Features

- **Real-time heading extraction** from editor content
- **Click-to-scroll** to heading position
- **Active state** highlighting based on scroll position
- **Hierarchy visualization** with indentation (H1 > H2 > H3)
- **Collapsible sections** for nested headings
- **Search/filter** headings (optional)

### Heading Extraction Logic

```typescript
const extractHeadings = (editor: Editor): Heading[] => {
  const headings: Heading[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        id: `heading-${pos}`,
        text: node.textContent,
        level: node.attrs.level,
      });
    }
  });
  return headings;
};
```

---

## Metadata Panel

Collapsible section at the bottom of the editor.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| Slug | `Input` | URL-friendly identifier (auto-generated from title) |
| Category | `Select` | Category dropdown from `usePlatformHCCategories` |
| Description | `Textarea` | Short description/excerpt |
| Order Index | `Input[number]` | Sort order within category |
| Icon | `Select` | Article icon (UntitledUI icon name) |

---

## TopBar Configuration

### Left Section

```
[← Back] / Knowledge / Article Title (inline editable)
```

- Back button: Navigate to `/admin/knowledge`
- Breadcrumb: Shows hierarchy
- Title: Inline editable input field

### Right Section

```
[Saved ✓] [Draft ▾] [Publish Toggle]
```

- Save indicator: Shows "Saving..." or "Saved ✓"
- Status badge: "Draft" or "Published"
- Publish toggle: Switch to toggle `is_published`

---

## Auto-Save

### Behavior

- **Debounce**: 2000ms after last change
- **Trigger**: Any content, title, metadata change
- **Indicator**: "Saving..." → "Saved ✓" in TopBar
- **Error handling**: Toast on save failure with retry option

### Implementation

```typescript
const { save, status } = useAutoSave({
  onSave: async (data) => {
    if (articleId !== 'new') {
      await updateArticle(articleId, data);
    }
  },
  debounceMs: 2000,
});

useEffect(() => {
  save({ title, content, slug, categoryId, description, orderIndex, isPublished });
}, [title, content, slug, categoryId, description, orderIndex, isPublished]);
```

---

## State Management

### ArticleEditorPage State

```typescript
interface EditorState {
  // Content
  title: string;
  content: string; // HTML from TipTap
  
  // Metadata
  slug: string;
  categoryId: string;
  description: string;
  orderIndex: number;
  iconName: string;
  isPublished: boolean;
  
  // UI State
  headings: Heading[];
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isMetadataPanelOpen: boolean;
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+S` | Force save |
| `Cmd+B` | Toggle bold |
| `Cmd+I` | Toggle italic |
| `Cmd+U` | Toggle underline |
| `Cmd+E` | Toggle code |
| `Cmd+K` | Insert link |
| `Cmd+Shift+1` | Heading 1 |
| `Cmd+Shift+2` | Heading 2 |
| `Cmd+Shift+3` | Heading 3 |
| `Cmd+Shift+8` | Bullet list |
| `Cmd+Shift+9` | Numbered list |
| `Escape` | Deselect / close panels |

---

## Navigation Flow

```
┌──────────────────────┐
│  /admin/knowledge    │
│  (Article List)      │
└──────────┬───────────┘
           │
           │ Click row OR "Add Article" button
           ▼
┌──────────────────────────────────────┐
│  /admin/knowledge/:articleId         │
│  OR                                  │
│  /admin/knowledge/new                │
│  (Article Editor Page)               │
└──────────┬───────────────────────────┘
           │
           │ Click back button in TopBar
           ▼
┌──────────────────────┐
│  /admin/knowledge    │
│  (Article List)      │
└──────────────────────┘
```

---

## Database Schema Reference

### Table: `platform_hc_articles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `category_id` | `uuid` | FK to `platform_hc_categories` |
| `title` | `text` | Article title |
| `slug` | `text` | URL slug |
| `content` | `text` | HTML content |
| `description` | `text` | Short description |
| `icon_name` | `text` | UntitledUI icon name |
| `order_index` | `integer` | Sort order |
| `is_published` | `boolean` | Published status |
| `created_at` | `timestamp` | Creation time |
| `updated_at` | `timestamp` | Last update time |
| `created_by` | `uuid` | Creator user ID |
| `updated_by` | `uuid` | Last updater user ID |

---

## Implementation Order

| Phase | Task | Priority | Complexity |
|-------|------|----------|------------|
| 1 | Add routes in `App.tsx` | High | Low |
| 2 | Create `ArticleEditorPage.tsx` skeleton | High | Medium |
| 3 | Update table row click navigation | High | Low |
| 4 | Integrate `HCTableOfContents` with live headings | High | Medium |
| 5 | Create `EditorInsertPanel.tsx` | High | Medium |
| 6 | Create `EditorFloatingToolbar.tsx` | Medium | Medium |
| 7 | Create `EditorMetadataPanel.tsx` | Medium | Low |
| 8 | Wire up auto-save | Medium | Low |
| 9 | Add TopBar with inline title | Medium | Low |
| 10 | Add keyboard shortcuts | Low | Low |
| 11 | Add table insertion grid | Low | Medium |
| 12 | Add advanced block types | Low | High |

---

## Future Enhancements

- **Slash commands**: Type `/` to open block insertion menu
- **Drag and drop blocks**: Reorder blocks by dragging
- **Version history**: View and restore previous versions
- **Collaboration**: Real-time collaborative editing
- **AI writing assistant**: Generate/improve content with AI
- **Export options**: Export to PDF, Markdown, etc.
- **Templates**: Pre-built article templates
- **Comments**: Inline comments for review workflow

---

## Dependencies

No new dependencies required. Using existing TipTap extensions:
- `@tiptap/react` (installed)
- `@tiptap/starter-kit` (installed)
- `@tiptap/extension-image` (installed)
- `@tiptap/extension-link` (installed)
- `@tiptap/extension-placeholder` (installed)
- `@tiptap/extension-underline` (installed)

BubbleMenu is included in `@tiptap/react`.

---

## Component Reuse Summary

| Category | Reused | Created |
|----------|--------|---------|
| **Page** | - | `ArticleEditorPage` |
| **Sidebar** | `HCTableOfContents` | `EditorInsertPanel` |
| **Editor** | `RichTextEditor` | `EditorFloatingToolbar` |
| **Forms** | `Input`, `Select`, `Textarea`, `Label` | `EditorMetadataPanel` |
| **Layout** | `TopBar`, `ScrollArea`, `Collapsible` | - |
| **Buttons** | `IconButton`, `Button`, `Switch` | - |
| **Hooks** | `useAutoSave`, `usePlatformHCArticles`, `usePlatformHCCategories` | - |

**Reuse ratio: ~75% existing components**
