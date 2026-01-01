# Centralization Audit Report

> **Last Audit Date**: January 2026  
> **Status**: ✅ PASS  
> **Auditor**: Automated + Manual Review

This document tracks the centralization of routing, navigation, and permission patterns across the Pilot codebase.

---

## Audit Summary

| Category | Status | Source of Truth |
|----------|--------|-----------------|
| App Routes | ✅ Pass | `src/config/routes.ts` → `ROUTE_CONFIG` |
| Settings Tabs | ✅ Pass | `src/config/routes.ts` → `SETTINGS_TABS` |
| Ari Sections | ✅ Pass | `src/config/routes.ts` → `ARI_SECTIONS` |
| Permission Checks | ✅ Pass | `src/hooks/useCanManage.ts` |
| Global Search | ✅ Pass | Uses `ROUTE_CONFIG` + `SETTINGS_TABS` |
| Sidebar Navigation | ✅ Pass | Uses `ROUTE_CONFIG` |

---

## Routes Audit

### Protected Routes in `App.tsx`

All protected routes MUST be either:
1. Guarded via `PermissionGuard` using `getGuardProps(routeId)` from `ROUTE_CONFIG`, OR
2. Explicitly DEV-only (inside `import.meta.env.DEV` block)

| Route | Guard Method | Status |
|-------|--------------|--------|
| `/` | `getGuardProps('get-set-up')` | ✅ |
| `/ari` | `getGuardProps('ari')` | ✅ |
| `/conversations` | `getGuardProps('conversations')` | ✅ |
| `/planner` | `getGuardProps('planner')` | ✅ |
| `/leads` | `getGuardProps('leads')` | ✅ |
| `/analytics` | `getGuardProps('analytics')` | ✅ |
| `/settings` | `getGuardProps('settings')` | ✅ |
| `/report-builder` | `getGuardProps('report-builder')` | ✅ |
| `/email-templates-test` | DEV-only | ✅ |
| `/booking-test` | DEV-only | ✅ |

### Public Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/login` | Authentication | ✅ Correct (no guard) |
| `/widget` | Embeddable widget | ✅ Correct (no guard) |

---

## Permission Pattern Audit

### Approved Pattern

All UI permission checks MUST use the `useCanManage` family of hooks:

```typescript
// Single permission
const canManage = useCanManage('manage_leads');

// Multiple permissions
const perms = useCanManageMultiple(['manage_leads', 'manage_team']);

// Dynamic permission (prop-based)
const canManage = useCanManageChecker();
const hasAccess = canManage(props.permission);
```

### Forbidden Pattern

The following pattern is FORBIDDEN outside of `src/hooks/useCanManage.ts`:

```typescript
// ❌ WRONG
const { hasPermission, isAdmin } = useRoleAuthorization();
const canManage = isAdmin || hasPermission('manage_leads');
```

### Scan Results

**Files with old pattern (expected: 0):**

```bash
# To verify, run:
grep -r "isAdmin || hasPermission" src/ --include="*.ts" --include="*.tsx" | grep -v "useCanManage.ts"
```

✅ **Result: 0 occurrences** (pass)

---

## Configuration Files Audit

### Single Source of Truth: `src/config/routes.ts`

This file exports:

| Export | Purpose | Consumers |
|--------|---------|-----------|
| `ROUTE_CONFIG` | All app routes with permissions | `App.tsx`, `Sidebar.tsx`, `GlobalSearch.tsx` |
| `SETTINGS_TABS` | Settings page tabs | `SettingsLayout.tsx`, `GlobalSearch.tsx` |
| `ARI_SECTIONS` | Ari configurator sections | `AriSectionMenu.tsx`, `AriConfigurator.tsx` |
| `getRouteById()` | Route lookup | `App.tsx` (via `getGuardProps`) |
| `getValidAriSectionIds()` | Section ID validation | `AriConfigurator.tsx` |

### Duplicate Detection

**Files with duplicate route/tab/section definitions (expected: 0):**

```bash
# To verify, run:
grep -r "VALID_SECTIONS\|SETTINGS_TABS\|ROUTE_CONFIG" src/ --include="*.ts" --include="*.tsx" | grep -v "routes.ts" | grep -v "import"
```

✅ **Result: 0 duplicates** (pass)

---

## Component Audit

### Components Using Centralized Config

| Component | Uses | Status |
|-----------|------|--------|
| `App.tsx` | `getRouteById()` | ✅ |
| `Sidebar.tsx` | `ROUTE_CONFIG` | ✅ |
| `GlobalSearch.tsx` | `ROUTE_CONFIG`, `SETTINGS_TABS` | ✅ |
| `SettingsLayout.tsx` | `SETTINGS_TABS`, `useCanManageChecker` | ✅ |
| `AriSectionMenu.tsx` | `ARI_SECTIONS`, `useCanManageChecker` | ✅ |
| `AriConfigurator.tsx` | `getValidAriSectionIds()` | ✅ |
| `PermissionButton.tsx` | `useCanManageChecker` | ✅ |
| `UserAccountCard.tsx` | `useCanManageChecker` | ✅ |
| `LeadStatusDropdown.tsx` | `useCanManage` | ✅ |
| `ChatHeader.tsx` | `useCanManage` | ✅ |
| `AriKnowledgeSection.tsx` | `useCanManage` | ✅ |

---

## Verification Commands

Run these commands to verify centralization:

```bash
# 1. Check for old permission pattern
grep -r "isAdmin || hasPermission" src/ --include="*.ts" --include="*.tsx" | grep -v "useCanManage.ts"
# Expected: No results

# 2. Check for duplicate config definitions
grep -rn "const ROUTE_CONFIG\|const SETTINGS_TABS\|const ARI_SECTIONS" src/
# Expected: Only src/config/routes.ts

# 3. Check all PermissionGuard usage derives from config
grep -rn "PermissionGuard" src/App.tsx
# Expected: All use getGuardProps()
```

---

## Guardrails

### CI Check (Recommended)

Add to CI pipeline:

```bash
# Fail if old pattern found
if grep -r "isAdmin || hasPermission" src/ --include="*.ts" --include="*.tsx" | grep -v "useCanManage.ts" | grep -q .; then
  echo "ERROR: Found forbidden permission pattern. Use useCanManage hooks instead."
  exit 1
fi
```

### Code Review Checklist

When reviewing PRs:

- [ ] New routes added to `ROUTE_CONFIG`
- [ ] New settings tabs added to `SETTINGS_TABS`
- [ ] New Ari sections added to `ARI_SECTIONS`
- [ ] Permission checks use `useCanManage*` hooks
- [ ] No `isAdmin || hasPermission` outside `useCanManage.ts`

---

## Related Documentation

- [HOOKS_REFERENCE.md](./HOOKS_REFERENCE.md) - `useCanManage` hook documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Centralized config architecture
- [SECURITY.md](./SECURITY.md) - Permission system overview
- [TEAM_SCOPING_STANDARD.md](./TEAM_SCOPING_STANDARD.md) - Permission guard patterns
