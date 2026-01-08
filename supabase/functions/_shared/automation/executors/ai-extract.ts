/**
 * AI Extract Node Executor
 * Extracts structured data from text using AI.
 * 
 * @module _shared/automation/executors/ai-extract
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { resolveVariables } from "../variable-resolver.ts";

interface ExtractField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "array";
  description: string;
}

export async function executeAiExtractNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as {
    inputVariable?: string;
    inputText?: string;
    fields?: ExtractField[];
    outputVariable?: string;
  };
  
  if (!data.fields || data.fields.length === 0) {
    return {
      success: false,
      error: "At least one field to extract is required",
    };
  }
  
  // Get input text
  let inputText: string;
  if (data.inputText) {
    inputText = resolveVariables(data.inputText, context);
  } else if (data.inputVariable) {
    inputText = resolveVariables(`{{${data.inputVariable}}}`, context);
  } else {
    inputText = JSON.stringify(context.triggerData);
  }
  
  if (!inputText) {
    return {
      success: false,
      error: "No input text provided",
    };
  }
  
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      error: "OPENROUTER_API_KEY not configured",
    };
  }
  
  // Build extraction schema
  const schemaProperties: Record<string, { type: string; description: string }> = {};
  for (const field of data.fields) {
    let jsonType = field.type;
    if (field.type === "date") jsonType = "string";
    if (field.type === "array") jsonType = "array";
    
    schemaProperties[field.name] = {
      type: jsonType,
      description: field.description,
    };
  }
  
  const fieldsDescription = data.fields
    .map((f) => `- ${f.name} (${f.type}): ${f.description}`)
    .join("\n");
  
  const prompt = `Extract the following fields from the input text:

${fieldsDescription}

Input text:
"""
${inputText}
"""

Respond with a JSON object containing only the extracted fields. If a field cannot be found, use null.`;
  
  console.log(`AI Extract: ${data.fields.length} fields`);
  
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
        temperature: 0.2, // Low temp for extraction
        max_tokens: 1000,
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
    
    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(content);
    } catch {
      return {
        success: false,
        error: "Failed to parse extraction response",
      };
    }
    
    // Set variables for each extracted field
    const setVariables: Record<string, unknown> = {
      extracted: extracted,
    };
    
    for (const [key, value] of Object.entries(extracted)) {
      setVariables[`extracted_${key}`] = value;
    }
    
    if (data.outputVariable) {
      setVariables[data.outputVariable] = extracted;
    }
    
    return {
      success: true,
      output: extracted,
      setVariables,
    };
  } catch (error) {
    return {
      success: false,
      error: `AI extraction failed: ${error}`,
    };
  }
}
