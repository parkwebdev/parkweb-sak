/**
 * Semantic Memory Module
 * Memory search, extraction, and storage for conversation context.
 * 
 * @module _shared/memory/semantic-memory
 * @description Long-term memory using vector embeddings for recall.
 * 
 * @example
 * ```typescript
 * import { 
 *   searchSemanticMemories, 
 *   extractAndStoreMemories, 
 *   formatMemoriesForPrompt,
 *   type SemanticMemory 
 * } from "../_shared/memory/semantic-memory.ts";
 * 
 * const memories = await searchSemanticMemories(supabase, agentId, leadId, convId, embedding);
 * const promptSection = formatMemoriesForPrompt(memories);
 * 
 * // Fire-and-forget memory extraction after response
 * extractAndStoreMemories(supabase, agentId, leadId, convId, userMsg, response, apiKey);
 * ```
 */

import { generateEmbedding } from '../ai/embeddings.ts';
import { MODEL_TIERS } from '../ai/model-routing.ts';

// ============================================
// TYPES
// ============================================

export interface SemanticMemory {
  memory_id: string;
  memory_type: string;
  content: string;
  confidence: number;
  similarity: number;
}

// ============================================
// MEMORY SEARCH
// ============================================

/**
 * Search for relevant memories based on the current query.
 * Retrieves memories for this agent (and optionally lead) that are semantically similar.
 * 
 * @param supabase - Supabase client
 * @param agentId - Agent UUID
 * @param leadId - Lead UUID (optional)
 * @param conversationId - Conversation UUID (optional)
 * @param queryEmbedding - Query embedding vector
 * @param matchThreshold - Minimum similarity threshold (default: 0.6)
 * @param matchCount - Maximum memories to return (default: 5)
 * @returns Array of matching memories
 */
export async function searchSemanticMemories(
  supabase: any,
  agentId: string,
  leadId: string | null,
  conversationId: string | null,
  queryEmbedding: number[],
  matchThreshold: number = 0.6,
  matchCount: number = 5
): Promise<SemanticMemory[]> {
  const embeddingVector = `[${queryEmbedding.join(',')}]`;
  
  const { data, error } = await supabase.rpc('search_conversation_memories', {
    p_agent_id: agentId,
    p_lead_id: leadId,
    p_query_embedding: embeddingVector,
    p_match_threshold: matchThreshold,
    p_match_count: matchCount,
    p_conversation_id: conversationId,
  });
  
  if (error) {
    console.error('Error searching semantic memories:', error);
    return [];
  }
  
  // Update access stats for retrieved memories (fire-and-forget)
  if (data && data.length > 0) {
    const memoryIds = data.map((m: SemanticMemory) => m.memory_id);
    supabase
      .from('conversation_memories')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: supabase.rpc('increment', { x: 1 })
      })
      .in('id', memoryIds)
      .then(() => {})
      .catch(() => {});
  }
  
  return data || [];
}

// ============================================
// MEMORY EXTRACTION & STORAGE
// ============================================

/**
 * Extract memories from a conversation exchange using the AI model.
 * Called after generating a response to persist important information.
 * 
 * @param supabase - Supabase client
 * @param agentId - Agent UUID
 * @param leadId - Lead UUID (optional)
 * @param conversationId - Conversation UUID
 * @param userMessage - The user's message
 * @param assistantResponse - The assistant's response
 * @param apiKey - OpenRouter API key
 */
export async function extractAndStoreMemories(
  supabase: any,
  agentId: string,
  leadId: string | null,
  conversationId: string,
  userMessage: string,
  assistantResponse: string,
  apiKey: string
): Promise<void> {
  try {
    // Use a fast model for extraction
    const extractionPrompt = `Analyze this conversation exchange and extract any important facts, preferences, or information that should be remembered for future conversations.

USER MESSAGE: "${userMessage}"

ASSISTANT RESPONSE: "${assistantResponse}"

Extract ONLY if there's genuinely memorable information. Output JSON array of memories:
[
  {
    "type": "fact" | "preference" | "entity" | "context" | "goal",
    "content": "concise statement of the memory",
    "confidence": 0.0-1.0
  }
]

Types:
- fact: Specific information stated by user (e.g., "User has 3 children", "User lives in Florida")
- preference: User preferences or likes/dislikes (e.g., "User prefers 2-bedroom homes", "User wants a quiet neighborhood")
- entity: Named entities important to user (e.g., "User's dog is named Max", "User works at ABC Corp")
- context: Situational context (e.g., "User is relocating for work", "User is a first-time buyer")
- goal: User's objectives or intentions (e.g., "User wants to schedule a tour this week", "User is comparing 3 communities")

Rules:
- Only extract genuinely useful, specific information
- Skip greetings, pleasantries, generic questions
- Skip information already implied by the conversation flow
- Confidence: 1.0 = explicitly stated, 0.7 = strongly implied, 0.5 = somewhat inferred
- Return empty array [] if nothing memorable

Output ONLY valid JSON array, no other text.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://getpilot.io',
        'X-Title': 'Pilot',
      },
      body: JSON.stringify({
        model: MODEL_TIERS.lite,
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Memory extraction API error:', response.status);
      return;
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let memories: Array<{ type: string; content: string; confidence: number }> = [];
    try {
      // Handle potential markdown code blocks
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      memories = JSON.parse(jsonStr);
    } catch (e) {
      console.log('No memories to extract or invalid JSON');
      return;
    }

    if (!Array.isArray(memories) || memories.length === 0) {
      return;
    }

    console.log(`MEMORY: Extracted ${memories.length} memories from conversation`);

    // Generate embeddings and store memories
    for (const memory of memories) {
      if (!memory.content || !memory.type) continue;
      
      try {
        // Generate embedding for the memory
        const embedding = await generateEmbedding(memory.content);
        const embeddingVector = `[${embedding.join(',')}]`;
        
        // Check for duplicate memories (same content)
        const { data: existing } = await supabase
          .from('conversation_memories')
          .select('id')
          .eq('agent_id', agentId)
          .eq('content', memory.content)
          .maybeSingle();
        
        if (existing) {
          console.log(`MEMORY: Skipping duplicate memory: "${memory.content.substring(0, 50)}..."`);
          continue;
        }
        
        // Store the memory
        const { error: insertError } = await supabase
          .from('conversation_memories')
          .insert({
            agent_id: agentId,
            lead_id: leadId,
            conversation_id: conversationId,
            memory_type: memory.type,
            content: memory.content,
            embedding: embeddingVector,
            confidence: memory.confidence || 0.8,
          });
        
        if (insertError) {
          console.error('Error storing memory:', insertError);
        } else {
          console.log(`MEMORY: Stored ${memory.type} memory: "${memory.content.substring(0, 50)}..."`);
        }
      } catch (embedError) {
        console.error('Error generating memory embedding:', embedError);
      }
    }
  } catch (error) {
    console.error('Memory extraction error:', error);
  }
}

// ============================================
// PROMPT FORMATTING
// ============================================

/**
 * Format memories for injection into system prompt.
 * 
 * @param memories - Array of semantic memories
 * @returns Formatted string for system prompt
 */
export function formatMemoriesForPrompt(memories: SemanticMemory[]): string {
  if (!memories || memories.length === 0) return '';
  
  const grouped: Record<string, string[]> = {};
  for (const mem of memories) {
    if (!grouped[mem.memory_type]) {
      grouped[mem.memory_type] = [];
    }
    grouped[mem.memory_type].push(mem.content);
  }
  
  const sections: string[] = [];
  
  if (grouped.fact?.length) {
    sections.push(`Known Facts: ${grouped.fact.join('; ')}`);
  }
  if (grouped.preference?.length) {
    sections.push(`Preferences: ${grouped.preference.join('; ')}`);
  }
  if (grouped.entity?.length) {
    sections.push(`Important Entities: ${grouped.entity.join('; ')}`);
  }
  if (grouped.goal?.length) {
    sections.push(`Goals: ${grouped.goal.join('; ')}`);
  }
  if (grouped.context?.length) {
    sections.push(`Context: ${grouped.context.join('; ')}`);
  }
  
  return sections.join('\n');
}
