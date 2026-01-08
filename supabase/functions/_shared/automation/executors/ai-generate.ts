/**
 * AI Generate Node Executor
 * Generates text using AI.
 * 
 * @module _shared/automation/executors/ai-generate
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { resolveVariables } from "../variable-resolver.ts";

export async function executeAiGenerateNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as {
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    outputFormat?: "text" | "json";
    outputVariable?: string;
  };
  
  if (!data.prompt) {
    return {
      success: false,
      error: "Prompt is required for AI generation",
    };
  }
  
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      error: "OPENROUTER_API_KEY not configured",
    };
  }
  
  // Resolve variables in prompt
  const resolvedPrompt = resolveVariables(data.prompt, context);
  
  const model = data.model || "google/gemini-2.5-flash";
  const temperature = data.temperature ?? 0.7;
  const maxTokens = data.maxTokens || 1000;
  
  console.log(`AI Generate: model=${model}, temperature=${temperature}, maxTokens=${maxTokens}`);
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://getpilot.io",
        "X-Title": "Pilot Automation",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: resolvedPrompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format:
          data.outputFormat === "json" ? { type: "json_object" } : undefined,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `AI API error: ${response.status} - ${errorText}`,
      };
    }
    
    const result = await response.json();
    const generatedContent = result.choices?.[0]?.message?.content || "";
    
    // Parse JSON if output format is json
    let output: unknown = generatedContent;
    if (data.outputFormat === "json") {
      try {
        output = JSON.parse(generatedContent);
      } catch {
        // Keep as string if JSON parse fails
      }
    }
    
    const setVariables: Record<string, unknown> = {
      ai_generated: output,
    };
    
    if (data.outputVariable) {
      setVariables[data.outputVariable] = output;
    }
    
    return {
      success: true,
      output: {
        generated: output,
        model,
        usage: result.usage,
      },
      setVariables,
    };
  } catch (error) {
    return {
      success: false,
      error: `AI generation failed: ${error}`,
    };
  }
}
