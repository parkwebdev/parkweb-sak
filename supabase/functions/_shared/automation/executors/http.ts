/**
 * HTTP Request Node Executor
 * Executes action-http nodes in automations.
 * 
 * @module _shared/automation/executors/http
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { executeHttpRequest, type HttpRequestConfig } from "../http-executor.ts";
import { resolveVariables, resolveObjectVariables } from "../variable-resolver.ts";

export async function executeHttpNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as {
    method?: string;
    url?: string;
    headers?: Array<{ key: string; value: string; enabled?: boolean }>;
    body?: string;
    bodyType?: string;
    timeout?: number;
    retryOnFailure?: boolean;
    maxRetries?: number;
    outputVariable?: string;
  };
  
  // Validate required fields
  if (!data.url) {
    return {
      success: false,
      error: "URL is required for HTTP request",
    };
  }
  
  // Resolve variables in URL
  const resolvedUrl = resolveVariables(data.url, context);
  
  // Build headers from array
  const headers: Record<string, string> = {};
  if (data.headers && Array.isArray(data.headers)) {
    for (const header of data.headers) {
      if (header.enabled !== false && header.key) {
        headers[header.key] = resolveVariables(header.value || "", context);
      }
    }
  }
  
  // Resolve body
  let body: unknown;
  if (data.body) {
    if (data.bodyType === "json") {
      try {
        const parsedBody = JSON.parse(data.body);
        body = resolveObjectVariables(parsedBody, context);
      } catch {
        // If JSON parse fails, treat as string template
        body = resolveVariables(data.body, context);
      }
    } else {
      body = resolveVariables(data.body, context);
    }
  }
  
  // Build request config
  const config: HttpRequestConfig = {
    url: resolvedUrl,
    method: (data.method || "GET") as HttpRequestConfig["method"],
    headers,
    body,
    timeoutMs: data.timeout ? data.timeout * 1000 : undefined,
  };
  
  // Execute with retries if configured
  const maxRetries = data.retryOnFailure ? (data.maxRetries || 3) : 1;
  let lastError: string | undefined;
  let response;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`HTTP ${config.method} ${config.url} (attempt ${attempt}/${maxRetries})`);
    
    response = await executeHttpRequest(config);
    
    if (response.success) {
      break;
    }
    
    lastError = response.error;
    
    if (attempt < maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  
  if (!response || !response.success) {
    return {
      success: false,
      error: lastError || "HTTP request failed",
      output: response,
    };
  }
  
  // Set output variable if configured
  const setVariables: Record<string, unknown> = {};
  if (data.outputVariable) {
    setVariables[data.outputVariable] = response.body;
  }
  
  // Always set the response as http_response for chaining
  setVariables.http_response = {
    status: response.status,
    headers: response.headers,
    body: response.body,
  };
  
  return {
    success: true,
    output: response,
    setVariables,
  };
}
