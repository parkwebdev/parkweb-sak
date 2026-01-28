

# Fix: Complete AI Extraction Schema for Communities

## Problem

The Claude AI extraction function for communities is **missing two fields** in both the system prompt and tool schema:
- `age_category` - Type of community (55+, All Ages, Family, etc.)
- `utilities_included` - Water/trash/electric inclusion details

The interface defines them, the sync function tries to read them, but Claude is never instructed to extract them.

## Solution

Update `supabase/functions/_shared/ai/wordpress-extraction.ts`:

### 1. Update System Prompt (add 2 fields)

Add to the extraction instructions (after line 215):
```
- age_category: Type of community (55+, All Ages, Family, Senior, etc.)
- utilities_included: Which utilities are included (water, trash, electric)
```

### 2. Update Tool Schema Properties (add 2 fields)

Add to the schema `properties` object (after line 234):
```typescript
age_category: { type: 'string', description: 'Community age restriction (55+, All Ages, Family, Senior, etc.)' },
utilities_included: { 
  type: 'object', 
  properties: {
    water: { type: 'boolean', description: 'Water included' },
    trash: { type: 'boolean', description: 'Trash included' },
    electric: { type: 'boolean', description: 'Electric included' },
  },
  description: 'Which utilities are included in lot rent' 
},
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/ai/wordpress-extraction.ts` | Add `age_category` and `utilities_included` to community system prompt and tool schema |

## Verification

After this fix, the AI extraction for communities will be 100% aligned with:
1. The `ExtractedCommunityData` TypeScript interface
2. The sync function's AI data reading logic
3. The database schema

## Current Status After Fix

| Component | Status |
|-----------|--------|
| Database Migration | ✅ Complete |
| Supabase Types | ✅ Complete |
| Parsing Utilities (5 files) | ✅ Complete |
| Properties Sync Function | ✅ Complete |
| Communities Sync Function | ✅ Complete |
| AI Extraction - Properties | ✅ Complete |
| AI Extraction - Communities | ✅ Complete (after this fix) |
| Frontend Field Mapper | ✅ Complete |

