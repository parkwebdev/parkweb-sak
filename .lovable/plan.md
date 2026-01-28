
# Plan: Fix WordPress Endpoint Mapper Confidence Display

## Problem Summary

The WordPress Endpoint Mapper UI is showing the **same confidence score** for each endpoint in **both** the Communities and Properties sections. This creates confusion:

- The "home" endpoint (correctly classified as `home`) shows "High match" in the **Communities section** where it shouldn't
- The "community" endpoint (correctly classified as `community`) shows "Possible match" in the **Properties section** where it shouldn't

**Root Cause**: The UI displays raw classification confidence without adjusting it for the context of which section the endpoint is being shown in.

---

## Solution Overview

1. **Calculate context-aware confidence** - When displaying in the Communities section, boost community-classified endpoints and demote home-classified ones (and vice versa for Properties)
2. **Sort endpoints by relevance per section** - Show the most relevant endpoints first in each section
3. **Add visual indicators** - Optionally show a "Not recommended" badge for endpoints that are classified as the opposite type

---

## Implementation Details

### File: `src/components/agents/locations/WordPressEndpointMapper.tsx`

### Change 1: Add Context-Aware Confidence Calculation

Create a helper function that adjusts confidence based on which section an endpoint is being displayed in:

```typescript
/**
 * Calculate display confidence based on section context
 * - If endpoint classification matches section type → use raw confidence
 * - If endpoint classification is opposite → reduce to low confidence
 * - If unknown → moderate penalty
 */
function getContextualConfidence(
  endpoint: DiscoveredEndpoint, 
  sectionType: 'community' | 'property'
): number {
  const classification = endpoint.classification;
  const rawConfidence = endpoint.confidence || 0;
  
  // Matching classification - use raw confidence
  if (
    (sectionType === 'community' && classification === 'community') ||
    (sectionType === 'property' && classification === 'home')
  ) {
    return rawConfidence;
  }
  
  // Opposite classification - significantly reduce confidence
  if (
    (sectionType === 'community' && classification === 'home') ||
    (sectionType === 'property' && classification === 'community')
  ) {
    // Return inverse or very low confidence
    return Math.max(0.1, 0.3 - rawConfidence * 0.3);
  }
  
  // Unknown classification - moderate confidence
  return 0.35;
}
```

### Change 2: Update EndpointOption to Accept Context

Modify `EndpointOption` component to accept the section type and use contextual confidence:

```typescript
interface EndpointOptionProps {
  endpoint: DiscoveredEndpoint;
  isSelected: boolean;
  onSelect: () => void;
  radioValue: string;
  sectionType: 'community' | 'property';  // NEW
}

function EndpointOption({ endpoint, isSelected, onSelect, radioValue, sectionType }: EndpointOptionProps) {
  // Use contextual confidence instead of raw
  const contextualConfidence = getContextualConfidence(endpoint, sectionType);
  const confidence = getConfidenceStyle(contextualConfidence);
  
  // Check if this endpoint is the "wrong type" for this section
  const isWrongType = (
    (sectionType === 'community' && endpoint.classification === 'home') ||
    (sectionType === 'property' && endpoint.classification === 'community')
  );
  
  // ... rest of component with optional "wrong type" indicator
}
```

### Change 3: Sort Endpoints by Relevance Per Section

Instead of using the same `allEndpoints` order for both sections, sort each section's list by contextual confidence:

```typescript
// Sort endpoints by relevance for Communities section
const communityOrderedEndpoints = [...allEndpoints].sort((a, b) => {
  return getContextualConfidence(b, 'community') - getContextualConfidence(a, 'community');
});

// Sort endpoints by relevance for Properties section  
const propertyOrderedEndpoints = [...allEndpoints].sort((a, b) => {
  return getContextualConfidence(b, 'property') - getContextualConfidence(a, 'property');
});
```

### Change 4: Update Both Sections to Use Context-Aware Display

**Communities Section** (lines 173-180):
```typescript
{communityOrderedEndpoints.map((endpoint) => (
  <EndpointOption
    key={`community-${endpoint.rest_base}`}
    endpoint={endpoint}
    isSelected={effectiveCommunityEndpoint === endpoint.rest_base}
    onSelect={() => onCommunitySelect(endpoint.rest_base)}
    radioValue={`community-${endpoint.rest_base}`}
    sectionType="community"  // NEW
  />
))}
```

**Properties Section** (similar pattern):
```typescript
{propertyOrderedEndpoints.map((endpoint) => (
  <EndpointOption
    key={`property-${endpoint.rest_base}`}
    endpoint={endpoint}
    isSelected={effectivePropertyEndpoint === endpoint.rest_base}
    onSelect={() => onPropertySelect(endpoint.rest_base)}
    radioValue={`property-${endpoint.rest_base}`}
    sectionType="property"  // NEW
  />
))}
```

### Change 5: Update Tooltip to Show Context

Update the tooltip signals to clarify when an endpoint is shown in the "wrong" section:

```typescript
{endpoint.signals && endpoint.signals.length > 0 && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <p className={cn('text-xs mt-0.5 cursor-help', confidence.className)}>
          {confidence.label}
          {isWrongType && (
            <span className="text-muted-foreground ml-1">(classified as {endpoint.classification})</span>
          )}
        </p>
      </TooltipTrigger>
      <TooltipContent>
        {/* Show detection signals */}
        {isWrongType && (
          <p className="text-xs text-warning mb-1">
            This endpoint was classified as a {endpoint.classification === 'home' ? 'Property' : 'Community'} type
          </p>
        )}
        {/* ... existing signals list */}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

---

## Expected Behavior After Fix

### Communities (Locations) Section:
| Endpoint | Classification | Raw Confidence | Displayed Confidence |
|----------|---------------|----------------|---------------------|
| community | community | 0.5 | **Possible match (0.5)** |
| home | home | 0.85 | Low match (0.1) ⚠️ "classified as home" |

### Properties (Homes/Listings) Section:
| Endpoint | Classification | Raw Confidence | Displayed Confidence |
|----------|---------------|----------------|---------------------|
| home | home | 0.85 | **High match (0.85)** ✓ |
| community | community | 0.5 | Low match (0.1) ⚠️ "classified as community" |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/agents/locations/WordPressEndpointMapper.tsx` | Add `getContextualConfidence()` helper, update `EndpointOption` to use section-aware confidence, sort endpoints per section, add "wrong type" indicators |

---

## Visual Outcome

**Before**: "home" shows as "High match" in both Communities AND Properties sections (confusing)

**After**: 
- "home" shows as **"High match"** in Properties, **"Low match (classified as home)"** in Communities
- "community" shows as **"Possible match"** in Communities, **"Low match (classified as community)"** in Properties
- Endpoints are sorted with the most relevant at the top of each section
