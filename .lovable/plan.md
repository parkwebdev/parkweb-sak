

# Plan: Fix WordPress Endpoint Mapper Issues

## Issues to Fix

### Issue 1: RadioGroup Key Collision (Critical)

**File:** `src/components/agents/locations/WordPressEndpointMapper.tsx`

**Problem:** Both RadioGroups use `endpoint.rest_base` as the `radioValue`, causing selection conflicts when the same endpoint appears in both lists.

**Fix:** Update the `EndpointOption` component calls to use prefixed values:

```tsx
// Line 168-176 - Communities section
<EndpointOption
  key={`community-${endpoint.rest_base}`}
  endpoint={endpoint}
  isSelected={effectiveCommunityEndpoint === endpoint.rest_base}
  onSelect={() => onCommunitySelect(endpoint.rest_base)}
  radioValue={`community-${endpoint.rest_base}`}  // ADD PREFIX
/>

// Line 210-218 - Properties section  
<EndpointOption
  key={`property-${endpoint.rest_base}`}
  endpoint={endpoint}
  isSelected={effectivePropertyEndpoint === endpoint.rest_base}
  onSelect={() => onPropertySelect(endpoint.rest_base)}
  radioValue={`property-${endpoint.rest_base}`}  // ADD PREFIX
/>
```

Also update the RadioGroup values:
```tsx
// Line 163
<RadioGroup
  value={effectiveCommunityEndpoint ? `community-${effectiveCommunityEndpoint}` : 'community-none'}
  onValueChange={(value) => onCommunitySelect(value === 'community-none' ? null : value.replace('community-', ''))}
>

// Line 205
<RadioGroup
  value={effectivePropertyEndpoint ? `property-${effectivePropertyEndpoint}` : 'property-none'}
  onValueChange={(value) => onPropertySelect(value === 'property-none' ? null : value.replace('property-', ''))}
>
```

Update the "None" options:
```tsx
// Line 186 - Community none
<RadioGroupItem value="community-none" id="community-none" />

// Line 228 - Property none
<RadioGroupItem value="property-none" id="property-none" />
```

---

### Issue 2: Missing Error Toast on Discovery Failure

**File:** `src/components/agents/locations/WordPressIntegrationSheet.tsx`

**Problem:** When `connectWithDiscovery` fails, no user-facing error is shown.

**Fix:** Add toast notification in `handleConnect` function (around line 300-309):

```tsx
const handleConnect = async () => {
  if (!urlInput.trim()) return;
  
  clearTestResult();
  const result = await connectWithDiscovery(urlInput.trim());
  
  if (!result.success) {
    toast.error('Failed to discover endpoints', {
      description: result.error || 'Could not connect to WordPress site'
    });
  }
};
```

---

### Issue 3: Edge Function Error Message Update (Minor)

**File:** `supabase/functions/sync-wordpress-communities/index.ts`

**Problem:** Error message doesn't list "connect" as a valid action.

**Fix:** Update line 831:
```tsx
return new Response(
  JSON.stringify({ error: 'Invalid action. Use "test", "connect", "sync", "save", "discover", or "disconnect"' }),
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/agents/locations/WordPressEndpointMapper.tsx` | Prefix RadioGroup values to prevent collision |
| `src/components/agents/locations/WordPressIntegrationSheet.tsx` | Add error toast for discovery failures |
| `supabase/functions/sync-wordpress-communities/index.ts` | Update error message to include "connect" action |

## Testing Checklist

After fixes:
1. Select "listings" for Communities → verify Properties doesn't auto-select
2. Select same endpoint for both → verify warning appears but both selections work
3. Enter invalid URL → verify error toast appears
4. Enter valid URL with no custom post types → verify appropriate message

