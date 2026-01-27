
# Plan: Fix WordPress Integration Flow Race Condition

## Problem

When a user enters a WordPress URL and the scan completes, there's a brief delay (1-2 seconds) where the "connected" static view (green dot + URL with edit/delete buttons) is shown before the endpoint mapping flow appears.

## Root Cause

The conditional rendering logic on line 406 of `WordPressIntegrationSheet.tsx` has a race condition:

```tsx
{isConnected && !isEditing && connectionStep !== 'mapping' ? (
```

**Timeline during connection:**
1. User clicks "Connect"
2. `connectWithDiscovery()` sets `connectionStep = 'discovering'`
3. Edge function saves URL to database
4. `onSyncComplete()` triggers agent refetch
5. Agent updates → `isConnected` becomes `true` (from `!!siteUrl`)
6. **Race window**: `isConnected = true` but `connectionStep` is still `'discovering'`
7. Edge function returns → `connectionStep = 'mapping'`

During step 6, the condition evaluates:
- `isConnected` = true
- `!isEditing` = true  
- `connectionStep !== 'mapping'` = true (it's `'discovering'`)

This causes the "connected" view to briefly flash before the mapping UI renders.

## Solution

Update the conditional to explicitly check that we're NOT in any in-progress step:

**Line 406 change:**
```tsx
// BEFORE
{isConnected && !isEditing && connectionStep !== 'mapping' ? (

// AFTER  
{isConnected && !isEditing && connectionStep !== 'mapping' && connectionStep !== 'discovering' && connectionStep !== 'field-mapping' ? (
```

This ensures the "connected" view only shows when:
- Site is connected
- Not editing
- Not in discovering/mapping/field-mapping flow

**Line 641 also needs update** to exclude `'field-mapping'`:
```tsx
// BEFORE
{isConnected && !isEditing && connectionStep !== 'mapping' && connectionStep !== 'discovering' && (

// AFTER
{isConnected && !isEditing && connectionStep !== 'mapping' && connectionStep !== 'discovering' && connectionStep !== 'field-mapping' && (
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/agents/locations/WordPressIntegrationSheet.tsx` | Fix conditional rendering to exclude all in-progress steps |

## Technical Details

The fix adds additional step exclusions to two conditions:

1. **Connected view condition (line 406)**: Currently only excludes `'mapping'`. Need to also exclude `'discovering'` and `'field-mapping'`.

2. **Sync sections condition (line 641)**: Currently excludes `'mapping'` and `'discovering'`. Need to also exclude `'field-mapping'`.

This is a minimal, targeted fix that addresses the race condition without restructuring the component or hook logic.
