
# Plan: Complete RowActions Pattern for All Remaining Tables

## Overview

You're right - several tables still use the old inline button pattern instead of the new Stripe-style hover actions + dropdown menu. This plan will update ALL remaining tables to use the consistent `RowActions` pattern.

---

## Tables Needing Update

| Table | Current Actions | Proposed Quick Actions | Proposed Menu |
|-------|-----------------|------------------------|---------------|
| `knowledge-columns.tsx` | Reprocess, Delete buttons | Reprocess, Delete | Reprocess Source, Delete Source |
| `help-articles-columns.tsx` | Move Up, Move Down, Edit, Delete | Edit, Delete | Edit, Move Up, Move Down, Delete |
| `export-history-columns.tsx` | Download, Delete | Download, Delete | Download Report, Delete Report |
| `locations-columns.tsx` | Delete only | Delete | View Details, Delete Location |
| `properties-columns.tsx` | External Link only | External Link | View Listing (external) |
| `sessions-columns.tsx` | "Remove" text button | Remove (destructive) | Revoke Session |
| `AuditLogTable.tsx` | Eye view button | View | View Details |

---

## Implementation Details

### 1. `knowledge-columns.tsx`

**Current:** Two inline icon buttons (Reprocess, Delete)  
**New:**
```typescript
const quickActions: QuickAction[] = [
  { icon: RefreshCcw01, label: 'Reprocess', onClick: () => onReprocess(source), disabled: isProcessing },
  { icon: Trash01, label: 'Delete', onClick: () => onDelete(source), variant: 'destructive' },
];

<RowActions
  quickActions={quickActions}
  menuContent={
    <>
      <DropdownMenuItem onClick={() => onReprocess(source)} disabled={isProcessing}>
        <RefreshCcw01 size={14} className="mr-2" />
        Reprocess Source
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onDelete(source)} className="text-destructive">
        <Trash01 size={14} className="mr-2" />
        Delete Source
      </DropdownMenuItem>
    </>
  }
/>
```

---

### 2. `help-articles-columns.tsx`

**Current:** Up/Down arrows + Delete buttons inline  
**New:** Edit & Delete as quick actions, reorder in menu
```typescript
const quickActions: QuickAction[] = [
  { icon: Edit05, label: 'Edit', onClick: () => onView(article) },
  { icon: Trash01, label: 'Delete', onClick: () => onDelete(article), variant: 'destructive' },
];

<RowActions
  quickActions={quickActions}
  menuContent={
    <>
      <DropdownMenuItem onClick={() => onView(article)}>
        <Edit05 size={14} className="mr-2" />
        Edit Article
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onMoveUp(article)} disabled={!canUp}>
        <ChevronUp size={14} className="mr-2" />
        Move Up
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onMoveDown(article)} disabled={!canDown}>
        <ChevronDown size={14} className="mr-2" />
        Move Down
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onDelete(article)} className="text-destructive">
        <Trash01 size={14} className="mr-2" />
        Delete Article
      </DropdownMenuItem>
    </>
  }
/>
```

---

### 3. `export-history-columns.tsx`

**Current:** Download + Delete icon buttons  
**New:**
```typescript
const quickActions: QuickAction[] = [
  { icon: Download01, label: 'Download', onClick: () => onDownload(exportItem) },
  { icon: Trash01, label: 'Delete', onClick: () => onDelete(exportItem), variant: 'destructive' },
];

<RowActions
  quickActions={quickActions}
  menuContent={...}
/>
```

---

### 4. `locations-columns.tsx`

**Current:** Single Delete button  
**New:**
```typescript
const quickActions: QuickAction[] = [
  { icon: Trash01, label: 'Delete', onClick: () => onDelete(location), variant: 'destructive' },
];

<RowActions
  quickActions={quickActions}
  menuContent={
    <>
      <DropdownMenuItem onClick={() => onView(location)}>
        <Eye size={14} className="mr-2" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onDelete(location)} className="text-destructive">
        <Trash01 size={14} className="mr-2" />
        Delete Location
      </DropdownMenuItem>
    </>
  }
/>
```

---

### 5. `properties-columns.tsx`

**Current:** External link button  
**Note:** Since this only has one action (view external listing), we'll keep it simpler but still add hover visibility
```typescript
const quickActions: QuickAction[] = [
  { icon: LinkExternal01, label: 'View Listing', onClick: () => window.open(listingUrl, '_blank') },
];

<RowActions quickActions={quickActions} />
```

---

### 6. `sessions-columns.tsx`

**Current:** "Remove" text button  
**New:**
```typescript
const quickActions: QuickAction[] = [
  { icon: Trash01, label: 'Revoke', onClick: () => onRevoke(session.id), variant: 'destructive' },
];

<RowActions
  quickActions={quickActions}
  menuContent={
    <DropdownMenuItem onClick={() => onRevoke(session.id)} className="text-destructive">
      <Trash01 size={14} className="mr-2" />
      Revoke Session
    </DropdownMenuItem>
  }
/>
```

---

### 7. `AuditLogTable.tsx`

**Current:** Eye icon button  
**New:**
```typescript
const quickActions: QuickAction[] = [
  { icon: Eye, label: 'View', onClick: () => setSelectedEntry(entry) },
];

<RowActions
  quickActions={quickActions}
  menuContent={
    <DropdownMenuItem onClick={() => setSelectedEntry(entry)}>
      <Eye size={14} className="mr-2" />
      View Details
    </DropdownMenuItem>
  }
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/data-table/columns/knowledge-columns.tsx` | Replace inline buttons with RowActions |
| `src/components/data-table/columns/help-articles-columns.tsx` | Replace inline buttons with RowActions |
| `src/components/data-table/columns/export-history-columns.tsx` | Replace IconButtons with RowActions |
| `src/components/data-table/columns/locations-columns.tsx` | Replace Delete button with RowActions |
| `src/components/data-table/columns/properties-columns.tsx` | Replace link button with RowActions |
| `src/components/data-table/columns/sessions-columns.tsx` | Replace Remove button with RowActions |
| `src/components/admin/audit/AuditLogTable.tsx` | Replace Eye button with RowActions |

---

## Consistency Benefits

After this update:
- **ALL tables** use the same interaction pattern
- Hover reveals quick action icons with tooltips
- Horizontal dots opens full dropdown menu
- "ACTIONS" header label in all menus
- Destructive actions consistently styled red

---

## Testing Checklist

After implementation:
- [ ] Knowledge sources table: hover shows Reprocess/Delete, menu works
- [ ] Help articles table: hover shows Edit/Delete, menu has reorder options
- [ ] Export history table: hover shows Download/Delete
- [ ] Locations table: hover shows Delete, menu has View/Delete
- [ ] Properties table: hover shows external link icon
- [ ] Sessions table: hover shows revoke icon
- [ ] Audit log table: hover shows view icon
