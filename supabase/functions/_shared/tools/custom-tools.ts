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
 * if (!isBlockedUrl(endpoint)) {
 *   const result = await callToolEndpoint(endpoint, 'POST', headers, args, 5000);
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
 * Mask sensitive headers for logging
 * 
 * @param headers - Headers object
 * @returns Headers with sensitive values masked
 */
function maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const isSensitive = SENSITIVE_HEADER_PATTERNS.some(pattern => pattern.test(key));
    masked[key] = isSensitive ? '[REDACTED]' : value;
  }
  return masked;
}

/**
 * Sleep for specified milliseconds
 * 
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TOOL EXECUTION
// ============================================

export interface ToolEndpointResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  retries?: number;
}

/**
 * Call an external tool endpoint with SSRF protection and retry logic
 * 
 * @param endpoint - Tool endpoint URL
 * @param method - HTTP method
 * @param headers - Request headers
 * @param body - Request body
 * @param timeoutMs - Request timeout in milliseconds
 * @returns Tool execution result
 */
export async function callToolEndpoint(
  endpoint: string,
  method: string,
  headers: Record<string, string>,
  body: any,
  timeoutMs: number = 10000
): Promise<ToolEndpointResult> {
  // SSRF Check
  if (isBlockedUrl(endpoint)) {
    console.error(`SSRF BLOCKED: Attempted call to blocked URL: ${endpoint}`);
    return {
      success: false,
      error: 'This tool endpoint is not allowed for security reasons',
      statusCode: 403,
    };
  }

  const maskedHeaders = maskSensitiveHeaders(headers);
  console.log(`Calling external tool: ${method} ${endpoint}`, { headers: maskedHeaders });

  let lastError: Error | null = null;
  let retries = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check response size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE_BYTES) {
        return {
          success: false,
          error: 'Response too large (exceeds 1MB limit)',
          statusCode: response.status,
          retries: attempt,
        };
      }

      const text = await response.text();

      // Check actual size after reading
      if (text.length > MAX_RESPONSE_SIZE_BYTES) {
        return {
          success: false,
          error: 'Response too large (exceeds 1MB limit)',
          statusCode: response.status,
          retries: attempt,
        };
      }

      // Try to parse as JSON
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw_response: text };
      }

      if (!response.ok) {
        // Retry on 5xx errors
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          retries++;
          const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          console.log(`Tool call failed with ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }

        return {
          success: false,
          error: data.error || data.message || `Tool returned status ${response.status}`,
          statusCode: response.status,
          data,
          retries: attempt,
        };
      }

      console.log(`Tool call successful: ${response.status}`, { retries: attempt });
      return {
        success: true,
        data,
        statusCode: response.status,
        retries: attempt,
      };

    } catch (error: any) {
      lastError = error;

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: `Tool request timed out after ${timeoutMs}ms`,
          retries: attempt,
        };
      }

      // Retry on network errors
      if (attempt < MAX_RETRIES) {
        retries++;
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.log(`Tool call error: ${error.message}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Tool call failed after retries',
    retries,
  };
}
