

# Plan: Complete WordPress Field Mapping Integration

## Summary

The WordPress Field Mapping feature is **partially implemented**. The backend `fetch-sample` action and `WordPressFieldMapper` component exist, but they're not wired into the connection flow. This plan completes the integration.

## What's Missing

| Component | Status | Issue |
|-----------|--------|-------|
| `fetch-sample` edge function action | Done | Never called from frontend |
| `WordPressFieldMapper.tsx` component | Done | Never rendered in the flow |
| `ConnectionStep` type | Partial | Missing `'field-mapping'` step |
| `fetchSamplePost()` hook function | Missing | Need to add |
| `saveFieldMappings()` for fields | Missing | Only endpoint mappings exist |
| State for available/suggested fields | Missing | Need to add |

## Implementation

### Phase 1: Update Hook (`useWordPressConnection.ts`)

**1.1 Add `'field-mapping'` to ConnectionStep:**
```typescript
export type ConnectionStep = 'url' | 'discovering' | 'mapping' | 'field-mapping' | 'connected';
```

**1.2 Add new state:**
```typescript
// Sample post data for field mapping
const [samplePostData, setSamplePostData] = useState<{
  community: SamplePostResult | null;
  property: SamplePostResult | null;
}>({ community: null, property: null });

// User's field mapping selections
const [communityFieldMappings, setCommunityFieldMappings] = useState<Record<string, string>>({});
const [propertyFieldMappings, setPropertyFieldMappings] = useState<Record<string, string>>({});
```

**1.3 Add `fetchSamplePost` function:**
```typescript
const fetchSamplePost = useCallback(async (
  endpoint: string,
  type: 'community' | 'property'
): Promise<SamplePostResult | null> => {
  const { data } = await supabase.functions.invoke('sync-wordpress-communities', {
    body: {
      action: 'fetch-sample',
      agentId: agent.id,
      siteUrl: siteUrl,
      endpoint,
      type,
    },
  });
  return data;
}, [agent?.id, siteUrl]);
```

**1.4 Add `saveAllMappings` function:**
```typescript
const saveAllMappings = useCallback(async (
  communityEndpoint: string | null,
  propertyEndpoint: string | null,
  communityFieldMappings: Record<string, string>,
  propertyFieldMappings: Record<string, string>
): Promise<boolean> => {
  // Saves both endpoint selections AND field mappings to agent config
}, []);
```

**1.5 Modify `saveEndpointMappings` to transition to field-mapping step:**
```typescript
// After saving endpoints, fetch sample posts and go to field-mapping step
if (communityEndpoint) {
  const communitySample = await fetchSamplePost(communityEndpoint, 'community');
  setSamplePostData(prev => ({ ...prev, community: communitySample }));
}
if (propertyEndpoint) {
  const propertySample = await fetchSamplePost(propertyEndpoint, 'property');
  setSamplePostData(prev => ({ ...prev, property: propertySample }));
}
setConnectionStep('field-mapping');
```

### Phase 2: Update Integration Sheet (`WordPressIntegrationSheet.tsx`)

**2.1 Import and add field mapping state:**
```typescript
import { WordPressFieldMapper } from './WordPressFieldMapper';

const [communityFieldMappings, setCommunityFieldMappings] = useState<Record<string, string>>({});
const [propertyFieldMappings, setPropertyFieldMappings] = useState<Record<string, string>>({});
const [fieldMappingType, setFieldMappingType] = useState<'community' | 'property'>('community');
```

**2.2 Add field mapping step to AnimatePresence:**
```tsx
) : connectionStep === 'field-mapping' && samplePostData ? (
  <motion.div key="field-mapping">
    <WordPressFieldMapper
      type={fieldMappingType}
      availableFields={
        fieldMappingType === 'community' 
          ? samplePostData.community?.availableFields || []
          : samplePostData.property?.availableFields || []
      }
      currentMappings={
        fieldMappingType === 'community' 
          ? communityFieldMappings 
          : propertyFieldMappings
      }
      suggestedMappings={
        fieldMappingType === 'community'
          ? samplePostData.community?.suggestedMappings || {}
          : samplePostData.property?.suggestedMappings || {}
      }
      onMappingsChange={(mappings) => {
        if (fieldMappingType === 'community') {
          setCommunityFieldMappings(mappings);
        } else {
          setPropertyFieldMappings(mappings);
        }
      }}
      onConfirm={handleFieldMappingConfirm}
      onBack={() => setConnectionStep('mapping')}
      samplePostTitle={
        fieldMappingType === 'community'
          ? samplePostData.community?.samplePost?.title
          : samplePostData.property?.samplePost?.title
      }
    />
  </motion.div>
```

**2.3 Add handler for field mapping confirmation:**
```typescript
const handleFieldMappingConfirm = async () => {
  // If we have both types, show property after community
  if (fieldMappingType === 'community' && selectedPropertyEndpoint && samplePostData.property) {
    setFieldMappingType('property');
    return;
  }
  
  // Save all mappings and complete connection
  await saveAllMappings(
    selectedCommunityEndpoint,
    selectedPropertyEndpoint,
    communityFieldMappings,
    propertyFieldMappings
  );
};
```

### Phase 3: Update Edge Function (`sync-wordpress-communities/index.ts`)

**3.1 Update save action to accept field mappings:**
```typescript
if (action === 'save') {
  const { 
    communityEndpoint, 
    homeEndpoint, 
    communityFieldMappings,  // NEW
    propertyFieldMappings,   // NEW
    // ...existing fields
  } = body;
  
  // Save to wordpress config
  const updatedConfig = {
    ...existingConfig,
    community_field_mappings: communityFieldMappings,
    property_field_mappings: propertyFieldMappings,
  };
}
```

### Phase 4: Add Skip Option

Allow users to skip field mapping (use auto-detection fallback):
- Add "Skip Field Mapping" button in the field mapper
- Saves endpoint mappings without field mappings
- Sync falls back to keyword-based extraction

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useWordPressConnection.ts` | Add `field-mapping` step, `fetchSamplePost()`, field mapping state |
| `src/components/agents/locations/WordPressIntegrationSheet.tsx` | Render `WordPressFieldMapper` in flow, add handlers |
| `supabase/functions/sync-wordpress-communities/index.ts` | Update save action to store field mappings |

## Connection Flow After Fix

```text
1. URL Entry
   ↓ [Connect button]
2. Discovering (loading)
   ↓ (auto-advance)
3. Endpoint Mapping
   - Select community endpoint
   - Select property endpoint
   ↓ [Continue button]
4. Field Mapping (NEW)
   - Map community fields (if endpoint selected)
   - Map property fields (if endpoint selected)
   ↓ [Save Mappings] or [Skip]
5. Connected
   - Show sync controls
   - Field mappings saved and used during sync
```

## Testing Checklist

After implementation:
1. Enter WordPress URL → endpoints discovered
2. Select endpoints → field mapping step appears
3. Sample post fetched → fields populated in dropdowns
4. Auto-suggestions pre-selected
5. Change mapping → state updates
6. Click "Save Mappings" → config saved with field mappings
7. Sync uses saved field mappings (check edge function logs)
8. "Skip" option works → falls back to auto-detection

