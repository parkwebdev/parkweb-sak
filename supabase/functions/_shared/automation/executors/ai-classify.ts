/**
 * AI Classify Node Executor
 * Classifies input text into categories using AI.
 * 
 * @module _shared/automation/executors/ai-classify
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { resolveVariables } from "../variable-resolver.ts";

interface Category {
  name: string;
  description: string;
}

export async function executeAiClassifyNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as {
    inputVariable?: string;
    categories?: Category[];
    outputVariable?: string;
    includeConfidence?: boolean;
  };
  
  if (!data.categories || data.categories.length === 0) {
    return {
      success: false,
      error: "At least one category is required",
    };
  }
  
  // Get input text
  let inputText: string;
  if (data.inputVariable) {
    inputText = resolveVariables(`{{${data.inputVariable}}}`, context);
  } else {
    // Default to trigger data
    inputText = JSON.stringify(context.triggerData);
  }
  
  if (!inputText || inputText === `{{${data.inputVariable}}}`) {
    return {
      success: false,
      error: `Input variable not found: ${data.inputVariable}`,
    };
  }
  
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      error: "OPENROUTER_API_KEY not configured",
    };
  }
  
  // Build classification prompt
  const categoriesDescription = data.categories
    .map((c) => `- "${c.name}": ${c.description}`)
    .join("\n");
  
  const categoryNames = data.categories.map((c) => c.name);
  
  const prompt = `Classify the following input into one of these categories:

${categoriesDescription}

Input to classify:
"""
${inputText}
"""

Respond with a JSON object:
{
  "category": "<one of: ${categoryNames.join(", ")}>",
  "confidence": <number between 0 and 1>,
  "reasoning": "<brief explanation>"
}`;
  
  console.log(`AI Classify: ${data.categories.length} categories`);
  
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temp for classification
        max_tokens: 500,
        response_format: { type: "json_object" },
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
    const content = result.choices?.[0]?.message?.content || "{}";
    
    let classification: { category: string; confidence: number; reasoning: string };
    try {
      classification = JSON.parse(content);
    } catch {
      return {
        success: false,
        error: "Failed to parse classification response",
      };
    }
    
    // Validate category is one of the defined ones
    if (!categoryNames.includes(classification.category)) {
      console.warn(`Classification returned unknown category: ${classification.category}`);
    }
    
    const output: Record<string, unknown> = {
      category: classification.category,
      reasoning: classification.reasoning,
    };
    
    if (data.includeConfidence) {
      output.confidence = classification.confidence;
    }
    
    const setVariables: Record<string, unknown> = {
      classification: output,
      classified_category: classification.category,
    };
    
    if (data.outputVariable) {
      setVariables[data.outputVariable] = classification.category;
    }
    
    return {
      success: true,
      output,
      setVariables,
    };
  } catch (error) {
    return {
      success: false,
      error: `AI classification failed: ${error}`,
    };
  }
}
