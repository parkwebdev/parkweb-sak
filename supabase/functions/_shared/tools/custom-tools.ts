/**
 * Custom Tools Module
 * External tool execution with SSRF protection and retry logic.
 * 
 * @module _shared/tools/custom-tools
 * @description Securely call external tool endpoints with SSRF protection.
 * 
 * @example
 * ```typescript
 * import { callToolEndpoint, isBlockedUrl } from "../_shared/tools/custom-tools.ts";
 * 
 * const result = await callToolEndpoint(tool, args);
 * if (result.success) {
 *   console.log(result.result);
 * }
 * ```
 */

// ============================================
// SSRF PROTECTION
// ============================================

/**
 * Blocked URL patterns for SSRF protection.
 * Prevents access to private IPs, localhost, and cloud metadata endpoints.
 */
const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\.\d+\.\d+\.\d+/i,
  /^https?:\/\/0\.0\.0\.0/i, // Bind-all address
  /^https?:\/\/10\.\d+\.\d+\.\d+/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/i,
  /^https?:\/\/192\.168\.\d+\.\d+/i,
  /^https?:\/\/169\.254\.\d+\.\d+/i, // Link-local
  /^https?:\/\/\[::1\]/i, // IPv6 localhost
  /^https?:\/\/\[fe80:/i, // IPv6 link-local
  /^https?:\/\/\[fc00:/i, // IPv6 unique local address
  /^https?:\/\/fd00:/i, // Private IPv6
  /^https?:\/\/metadata\.google\.internal/i,
  /^https?:\/\/metadata\.goog/i, // GCP alternative
  /^https?:\/\/instance-data/i, // AWS alternative hostname
  /^https?:\/\/169\.254\.169\.254/i, // AWS/GCP metadata
  /^https?:\/\/100\.100\.100\.200/i, // Alibaba metadata
];

/**
 * Check if a URL is blocked for SSRF protection
 * 
 * @param url - URL to check
 * @returns True if URL is blocked
 */
export function isBlockedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Block non-HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return true;
    }
    // Check against blocked patterns
    return BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
  } catch {
    return true; // Invalid URLs are blocked
  }
}

// ============================================
// CONSTANTS
// ============================================

/** Response size limit (1MB) to prevent memory issues */
export const MAX_RESPONSE_SIZE_BYTES = 1 * 1024 * 1024;

/** Maximum retry attempts */
export const MAX_RETRIES = 2;

/** Initial retry delay in milliseconds */
export const INITIAL_RETRY_DELAY_MS = 500;

/** Headers that should be masked in logs */
const SENSITIVE_HEADER_PATTERNS = [
  /^authorization$/i,
  /^x-api-key$/i,
  /^api-key$/i,
  /^bearer$/i,
  /^token$/i,
  /^secret$/i,
  /^password$/i,
  /^credential/i,
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Mask sensitive header values for logging
 * 
 * @param headers - Headers object
 * @returns Headers with sensitive values masked
 */
function maskHeadersForLogging(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const isSensitive = SENSITIVE_HEADER_PATTERNS.some(pattern => pattern.test(key));
    masked[key] = isSensitive ? `***${value.slice(-4)}` : value;
  }
  return masked;
}

/**
 * Delay helper for retry backoff
 * 
 * @param ms - Milliseconds to sleep
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TYPES
// ============================================

/** Tool configuration for external endpoint calls */
export interface ToolConfig {
  name: string;
  endpoint_url: string;
  headers: Record<string, string> | null;
  timeout_ms: number;
}

/** Result from calling a tool endpoint */
export interface ToolEndpointResult {
  success: boolean;
  result?: any;
  error?: string;
}

// ============================================
// TOOL EXECUTION
// ============================================

/**
 * Call a tool endpoint with retry logic, SSRF protection, and response size limits
 * 
 * @param tool - Tool configuration with endpoint details
 * @param args - Arguments to pass to the tool
 * @returns Tool execution result
 */
export async function callToolEndpoint(
  tool: { name: string; endpoint_url: string; headers: any; timeout_ms: number },
  args: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  // SSRF Protection: Validate URL before making request
  if (isBlockedUrl(tool.endpoint_url)) {
    console.error(`Tool ${tool.name} blocked: URL fails SSRF validation`, { url: tool.endpoint_url });
    return { success: false, error: 'Tool endpoint URL is not allowed (security restriction)' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(tool.headers || {}),
  };

  // Log with masked headers for security
  const maskedHeaders = maskHeadersForLogging(headers);
  console.log(`Calling tool ${tool.name} at ${tool.endpoint_url}`, { 
    args, 
    headers: maskedHeaders,
    timeout_ms: tool.timeout_ms 
  });

  let lastError: string = 'Unknown error';
  
  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add backoff delay for retries
      if (attempt > 0) {
        const backoffMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Tool ${tool.name} retry ${attempt}/${MAX_RETRIES} after ${backoffMs}ms`);
        await delay(backoffMs);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), tool.timeout_ms || 10000);

      const response = await fetch(tool.endpoint_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(args),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check response size from Content-Length header first
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE_BYTES) {
        console.error(`Tool ${tool.name} response too large: ${contentLength} bytes`);
        return { success: false, error: `Response too large (max ${MAX_RESPONSE_SIZE_BYTES / 1024 / 1024}MB)` };
      }

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
        
        // Only retry on 5xx errors or network issues, not on 4xx client errors
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          console.warn(`Tool ${tool.name} server error (attempt ${attempt + 1}):`, response.status);
          continue;
        }
        
        console.error(`Tool ${tool.name} returned error:`, response.status, errorText.substring(0, 500));
        return { success: false, error: lastError };
      }

      // Read response with size limit
      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'No response body' };
      }

      let totalBytes = 0;
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        totalBytes += value.length;
        if (totalBytes > MAX_RESPONSE_SIZE_BYTES) {
          reader.cancel();
          console.error(`Tool ${tool.name} response exceeded size limit during read`);
          return { success: false, error: `Response too large (max ${MAX_RESPONSE_SIZE_BYTES / 1024 / 1024}MB)` };
        }
        
        chunks.push(value);
      }

      // Combine chunks and parse JSON
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      const responseText = new TextDecoder().decode(combined);
      const result = JSON.parse(responseText);
      
      console.log(`Tool ${tool.name} returned successfully`, { 
        responseSize: totalBytes,
        attempts: attempt + 1 
      });
      return { success: true, result };
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        lastError = 'Request timed out';
        console.error(`Tool ${tool.name} timed out after ${tool.timeout_ms}ms (attempt ${attempt + 1})`);
        // Retry on timeout
        if (attempt < MAX_RETRIES) continue;
      } else if (error instanceof SyntaxError) {
        // JSON parse error - don't retry
        console.error(`Tool ${tool.name} returned invalid JSON:`, error.message);
        return { success: false, error: 'Invalid JSON response from tool' };
      } else {
        lastError = error.message || 'Unknown error';
        console.error(`Tool ${tool.name} error (attempt ${attempt + 1}):`, error);
        // Retry on network errors
        if (attempt < MAX_RETRIES) continue;
      }
    }
  }

  // All retries exhausted
  console.error(`Tool ${tool.name} failed after ${MAX_RETRIES + 1} attempts:`, lastError);
  return { success: false, error: lastError };
}
