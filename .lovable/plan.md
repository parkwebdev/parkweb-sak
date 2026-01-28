
# Plan: Switch WordPress AI Extraction to Claude Haiku 4.5

## Overview
Migrate the WordPress AI extraction utility from Gemini 2.5 Flash to Claude Haiku 4.5 via OpenRouter for consistent model usage across the entire codebase.

## Current State
- **File**: `supabase/functions/_shared/ai/wordpress-extraction.ts`
- **Current Model**: `gemini-2.5-flash-preview-05-20` (direct Google API)
- **Used By**: 
  - `sync-wordpress-homes/index.ts` for property extraction
  - `sync-wordpress-communities/index.ts` for community extraction

## Changes Required

### 1. Update API Configuration

**Remove:**
```typescript
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
```

**Add:**
```typescript
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const EXTRACTION_MODEL = 'anthropic/claude-haiku-4.5';
```

### 2. Replace `callGemini` with `callClaude`

The key difference is using OpenRouter's API format with tool calling for structured output (Claude's approach vs Gemini's `responseSchema`).

```typescript
async function callClaude<T>(
  systemPrompt: string,
  userContent: string,
  toolSchema: Record<string, unknown>,
  toolName: string
): Promise<T | null> {
  if (!OPENROUTER_API_KEY) {
    console.error('No OpenRouter API key configured for AI extraction');
    return null;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EXTRACTION_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        tools: [{
          type: 'function',
          function: {
            name: toolName,
            description: `Extract structured ${toolName} data`,
            parameters: toolSchema,
          },
        }],
        tool_choice: { type: 'function', function: { name: toolName } },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in Claude response');
      return null;
    }

    return JSON.parse(toolCall.function.arguments) as T;
  } catch (error: unknown) {
    console.error('Error calling Claude for extraction:', error);
    return null;
  }
}
```

### 3. Update Schema Format

Claude's tool calling uses JSON Schema differently than Gemini's `responseSchema`. The schemas need minor adjustments:

**Before (Gemini style):**
```typescript
{ type: ['string', 'null'] }  // nullable
```

**After (Claude/OpenAI style):**
```typescript
{ type: 'string' }  // nullable via omission from required
```

### 4. Update Extraction Functions

Update `extractCommunityData()` and `extractPropertyData()` to:
- Use `callClaude` instead of `callGemini`
- Pass appropriate tool names (`extract_community`, `extract_property`)
- Use OpenAI-compatible JSON Schema format

### 5. Update Documentation

Change module docstring from "Uses Gemini 2.5 Flash" to "Uses Claude Haiku 4.5 via OpenRouter"

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/ai/wordpress-extraction.ts` | Replace Gemini with Claude Haiku 4.5 |

## Technical Notes

- **API Key**: Uses existing `OPENROUTER_API_KEY` secret (already configured)
- **Structured Output**: Uses tool calling (Claude's preferred method) instead of Gemini's `responseSchema`
- **Cost**: Claude Haiku 4.5 is cost-effective for extraction tasks
- **Consistency**: Now 100% Claude across the codebase

## Verification

After deployment:
1. Run a property sync with AI extraction enabled
2. Check logs for "✨ AI extracted property data for: ..."
3. Verify extracted data populates correctly in the database
