/**
 * HTTP Executor with SSRF Protection
 * Safely executes HTTP requests with security guardrails.
 * 
 * @module _shared/automation/http-executor
 */

// ============================================
// CONFIGURATION
// ============================================

/** Maximum response size in bytes (1MB) */
export const MAX_RESPONSE_SIZE = 1024 * 1024;

/** Default request timeout (30 seconds) */
export const DEFAULT_TIMEOUT_MS = 30000;

/** Maximum timeout allowed (60 seconds) */
export const MAX_TIMEOUT_MS = 60000;

/** Blocked IP ranges (private/internal networks) */
const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local
  /^0\./,                      // Current network
  /^224\./,                    // Multicast
  /^240\./,                    // Reserved
  /^255\./,                    // Broadcast
  /^::1$/,                     // IPv6 loopback
  /^fc00:/,                    // IPv6 unique local
  /^fe80:/,                    // IPv6 link-local
  /^ff00:/,                    // IPv6 multicast
];

/** Blocked hostnames */
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  // Block internal Supabase services
  "supabase-internal",
  "supabase_kong",
  "supabase_auth",
  "supabase_rest",
  "supabase_realtime",
  "supabase_storage",
  "supabase_db",
  "supabase_gotrue",
  "supabase_functions",
  // Cloud metadata endpoints
  "metadata.google.internal",
  "169.254.169.254",
];

/** Blocked URL patterns */
const BLOCKED_URL_PATTERNS = [
  /\.supabase\.co\/.*\/functions\/v1\//i, // Block calling other edge functions
  /\.internal$/i,
  /\.local$/i,
  /\.localhost$/i,
];

// ============================================
// SSRF PROTECTION
// ============================================

export interface SSRFCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a URL is safe to request (SSRF protection).
 */
export function checkUrlSafety(url: string): SSRFCheckResult {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTP(S)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { allowed: false, reason: `Protocol not allowed: ${parsed.protocol}` };
    }
    
    // Check hostname against blocklist
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`))) {
      return { allowed: false, reason: `Blocked hostname: ${hostname}` };
    }
    
    // Check against blocked URL patterns
    for (const pattern of BLOCKED_URL_PATTERNS) {
      if (pattern.test(url)) {
        return { allowed: false, reason: "URL matches blocked pattern" };
      }
    }
    
    // Check if hostname is an IP address
    const ipMatch = hostname.match(/^(\d+\.\d+\.\d+\.\d+)$/) || 
                    hostname.match(/^\[([^\]]+)\]$/); // IPv6
    
    if (ipMatch) {
      const ip = ipMatch[1];
      for (const pattern of BLOCKED_IP_PATTERNS) {
        if (pattern.test(ip)) {
          return { allowed: false, reason: `Blocked IP range: ${ip}` };
        }
      }
    }
    
    return { allowed: true };
  } catch (error) {
    return { allowed: false, reason: `Invalid URL: ${error}` };
  }
}

// ============================================
// HTTP EXECUTOR
// ============================================

export interface HttpRequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  followRedirects?: boolean;
}

export interface HttpResponse {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
  error?: string;
  durationMs: number;
}

/**
 * Execute an HTTP request with SSRF protection and timeouts.
 */
export async function executeHttpRequest(
  config: HttpRequestConfig
): Promise<HttpResponse> {
  const startTime = performance.now();
  
  // SSRF check
  const safetyCheck = checkUrlSafety(config.url);
  if (!safetyCheck.allowed) {
    return {
      success: false,
      error: `Request blocked: ${safetyCheck.reason}`,
      durationMs: performance.now() - startTime,
    };
  }
  
  // Validate timeout
  const timeout = Math.min(
    config.timeoutMs || DEFAULT_TIMEOUT_MS,
    MAX_TIMEOUT_MS
  );
  
  // Prepare request
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Pilot-Automation/1.0",
    ...config.headers,
  };
  
  // Remove sensitive headers that could be used for injection
  delete headers["Host"];
  delete headers["X-Forwarded-For"];
  delete headers["X-Real-IP"];
  
  const requestInit: RequestInit = {
    method: config.method,
    headers,
    redirect: config.followRedirects !== false ? "follow" : "manual",
  };
  
  // Add body for non-GET requests
  if (config.body && config.method !== "GET") {
    requestInit.body =
      typeof config.body === "string"
        ? config.body
        : JSON.stringify(config.body);
  }
  
  try {
    // Execute with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(config.url, {
      ...requestInit,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Check response size
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      return {
        success: false,
        status: response.status,
        error: `Response too large: ${contentLength} bytes (max ${MAX_RESPONSE_SIZE})`,
        durationMs: performance.now() - startTime,
      };
    }
    
    // Parse response
    let body: unknown;
    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      body = await response.json();
    } else if (contentType.includes("text/")) {
      body = await response.text();
    } else {
      // For binary/other content, just note the type
      body = { _type: contentType, _size: contentLength };
    }
    
    // Convert headers to plain object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Request timed out after ${timeout}ms`
          : error.message
        : "Unknown error";
    
    return {
      success: false,
      error: errorMessage,
      durationMs: performance.now() - startTime,
    };
  }
}
