
# Plan: Fix Field Mapping Not Appearing

## Problem Identified

The Field Mapping step is being **skipped entirely** because `fetchSamplePost()` always returns `null`. Here's why:

**Timeline during endpoint confirmation:**

1. User clicks "Continue" on endpoint mapping step
2. `handleConfirmMapping()` calls `saveEndpointMappings(communityEp, propertyEp)`
3. `saveEndpointMappings` saves endpoints to database
4. `saveEndpointMappings` calls `fetchSamplePost()` to get sample data
5. `fetchSamplePost` checks: `if (!agent?.id || !storedSiteUrl) return null;`
6. **`storedSiteUrl` is empty!** Because it comes from `wordpressConfig?.site_url` which derives from `agent.deployment_config` - the agent hasn't been refetched yet
7. Both `communitySample` and `propertySample` are `null`
8. Code evaluates: `if (communitySample || propertySample)` → **false**
9. Goes directly to `'connected'` step, skipping field mapping entirely

The URL was saved during `connectWithDiscovery`, but the hook's `agent` prop still has the old config.

## Root Cause

```typescript
// In fetchSamplePost (line 552)
if (!agent?.id || !storedSiteUrl) return null;  // storedSiteUrl is "" !!

// storedSiteUrl comes from:
const storedSiteUrl = wordpressConfig?.site_url || '';  // agent not refreshed yet
```

## Solution

Track the connected URL locally within the hook during the connection flow, independent of the agent config refresh timing.

### Changes to `useWordPressConnection.ts`

**1. Add local URL state (around line 76):**
```typescript
const [connectionStep, setConnectionStep] = useState<ConnectionStep>('url');
const [connectedUrl, setConnectedUrl] = useState<string>('');  // NEW: Track URL locally
```

**2. Set the URL in `connectWithDiscovery` (around line 530):**
```typescript
if (data.success) {
  const endpoints: DiscoveredEndpoints = { ... };
  setDiscoveredEndpoints(endpoints);
  setConnectedUrl(url.trim());  // NEW: Store URL immediately
  setConnectionStep('mapping');
  return { success: true, endpoints };
}
```

**3. Use `connectedUrl` in `fetchSamplePost` (line 552):**
```typescript
const fetchSamplePost = useCallback(async (
  endpoint: string,
  type: 'community' | 'property'
): Promise<SamplePostResult | null> => {
  const siteUrlToUse = connectedUrl || storedSiteUrl;  // NEW: Prefer local URL
  if (!agent?.id || !siteUrlToUse) return null;

  // ... rest of function uses siteUrlToUse instead of storedSiteUrl
}, [agent?.id, storedSiteUrl, connectedUrl]);  // Add connectedUrl to deps
```

**4. Reset `connectedUrl` in `resetConnectionFlow` (around line 730):**
```typescript
const resetConnectionFlow = useCallback(() => {
  setConnectionStep('url');
  setDiscoveredEndpoints(null);
  setSamplePostData({ community: null, property: null });
  setCommunityFieldMappings({});
  setPropertyFieldMappings({});
  setConnectedUrl('');  // NEW: Clear local URL
}, []);
```

**5. Also reset in `disconnect` function (around line 475):**
```typescript
toast.success('WordPress disconnected', ...);
setConnectedUrl('');  // NEW: Clear local URL on disconnect
onSyncComplete?.();
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useWordPressConnection.ts` | Add `connectedUrl` state, set it in `connectWithDiscovery`, use it in `fetchSamplePost`, reset it in `resetConnectionFlow` and `disconnect` |

## Expected Flow After Fix

```text
1. URL Entry → User enters "example.com"
2. Discovering → connectWithDiscovery saves URL, sets connectedUrl = "example.com"
3. Endpoint Mapping → User selects endpoints
4. Field Mapping → fetchSamplePost uses connectedUrl (not empty!), returns data
   - Shows community field mapping first
   - Then property field mapping
5. Connected → User saves mappings
```

## Why This Works

By storing the URL locally in `connectedUrl` immediately when the connection succeeds, we have access to it before the React Query cache updates with the refetched agent data. This eliminates the race condition entirely.
