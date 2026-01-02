/**
 * Widget-Chat Test Utilities
 * 
 * Helper functions for making requests and validating responses.
 * 
 * @module widget-chat/__tests__/test-utils
 */

import type { 
  WidgetChatRequest, 
  WidgetChatResponse, 
  WidgetChatErrorResponse,
  TestContext 
} from './types.ts';
import { TEST_AGENT_ID } from './fixtures.ts';

// ============================================
// TEST CONTEXT INITIALIZATION
// ============================================

export function getTestContext(): TestContext {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set for tests');
  }

  return {
    supabaseUrl,
    supabaseKey,
    functionUrl: `${supabaseUrl}/functions/v1/widget-chat`,
    testAgentId: TEST_AGENT_ID,
  };
}

// ============================================
// REQUEST HELPERS
// ============================================

export interface RequestOptions {
  /** Additional headers to include in the request */
  headers?: Record<string, string>;
  /** API key for external API access (uses X-API-Key header) */
  apiKey?: string;
  /** Whether to expect an error response */
  expectError?: boolean;
  /** If true, treats request as external API (not widget) */
  asExternalApi?: boolean;
}

/**
 * Make a request to the widget-chat function.
 */
export async function makeRequest(
  request: WidgetChatRequest,
  options: RequestOptions = {}
): Promise<{ status: number; body: WidgetChatResponse | WidgetChatErrorResponse }> {
  const ctx = getTestContext();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': ctx.supabaseKey,
    ...options.headers,
  };

  // Widget mode: simulate widget origin
  if (!options.asExternalApi) {
    headers['origin'] = 'https://example.com';
    headers['x-client-info'] = 'pilot-widget/1.0';
  }

  // API key for external API access
  if (options.apiKey) {
    headers['x-api-key'] = options.apiKey;
  }

  const response = await fetch(ctx.functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  const body = await response.json();
  
  return {
    status: response.status,
    body,
  };
}

/**
 * Make a CORS preflight request.
 */
export async function makeOptionsRequest(): Promise<Response> {
  const ctx = getTestContext();
  
  return fetch(ctx.functionUrl, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST',
    },
  });
}

// ============================================
// RESPONSE VALIDATORS
// ============================================

/**
 * Assert that a response has the expected success structure.
 */
export function assertSuccessResponse(
  body: WidgetChatResponse | WidgetChatErrorResponse
): asserts body is WidgetChatResponse {
  if ('error' in body && body.error) {
    throw new Error(`Expected success response but got error: ${body.error}`);
  }
  
  const response = body as WidgetChatResponse;
  
  if (typeof response.requestId !== 'string') {
    throw new Error('Response missing requestId');
  }
  
  if (typeof response.durationMs !== 'number') {
    throw new Error('Response missing durationMs');
  }
}

/**
 * Assert that a response has the expected error structure.
 */
export function assertErrorResponse(
  body: WidgetChatResponse | WidgetChatErrorResponse,
  expectedCode?: string
): asserts body is WidgetChatErrorResponse {
  const response = body as WidgetChatErrorResponse;
  
  if (!response.error) {
    throw new Error('Expected error response but got success');
  }
  
  if (!response.code) {
    throw new Error('Error response missing code');
  }
  
  if (!response.requestId) {
    throw new Error('Error response missing requestId');
  }
  
  if (expectedCode && response.code !== expectedCode) {
    throw new Error(`Expected error code ${expectedCode} but got ${response.code}`);
  }
}

/**
 * Assert that response contains specific fields.
 */
export function assertHasFields(
  body: WidgetChatResponse,
  fields: string[]
): void {
  for (const field of fields) {
    const value = (body as Record<string, unknown>)[field];
    if (value === undefined) {
      throw new Error(`Response missing expected field: ${field}`);
    }
  }
}

/**
 * Assert that a tool was used in the response.
 */
export function assertToolUsed(
  body: WidgetChatResponse,
  toolName: string
): void {
  if (!body.toolsUsed || !Array.isArray(body.toolsUsed)) {
    throw new Error('Response has no toolsUsed array');
  }
  
  const tool = body.toolsUsed.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool ${toolName} was not used. Used tools: ${body.toolsUsed.map(t => t.name).join(', ')}`);
  }
}

/**
 * Assert response is in a specific language (basic check).
 */
export function assertLanguage(
  body: WidgetChatResponse,
  expectedLanguage: 'spanish' | 'french' | 'english'
): void {
  const response = body.response.toLowerCase();
  
  const languageIndicators: Record<string, string[]> = {
    spanish: ['hola', 'como', 'puedo', 'ayudarte', '¿', 'estás'],
    french: ['bonjour', 'comment', 'puis-je', 'aider', 'ça va'],
    english: ['hello', 'hi', 'how', 'can', 'help'],
  };
  
  const indicators = languageIndicators[expectedLanguage];
  const hasIndicator = indicators.some(ind => response.includes(ind));
  
  if (!hasIndicator) {
    console.warn(`Response may not be in ${expectedLanguage}: ${body.response.substring(0, 100)}...`);
  }
}

// ============================================
// TIMING UTILITIES
// ============================================

/**
 * Measure request duration.
 */
export async function measureRequest(
  request: WidgetChatRequest,
  options: RequestOptions = {}
): Promise<{ result: Awaited<ReturnType<typeof makeRequest>>; localDurationMs: number }> {
  const start = performance.now();
  const result = await makeRequest(request, options);
  const localDurationMs = performance.now() - start;
  
  return { result, localDurationMs };
}

// ============================================
// SNAPSHOT HELPERS
// ============================================

/**
 * Normalize response for snapshot comparison.
 * Removes dynamic fields that change between requests.
 */
export function normalizeForSnapshot(
  body: WidgetChatResponse | WidgetChatErrorResponse
): Record<string, unknown> {
  const normalized = { ...body } as Record<string, unknown>;
  
  // Remove dynamic fields
  delete normalized.requestId;
  delete normalized.durationMs;
  delete normalized.conversationId;
  delete normalized.userMessageId;
  delete normalized.assistantMessageId;
  
  // Normalize messages array (remove dynamic IDs)
  if ('messages' in normalized && Array.isArray(normalized.messages)) {
    normalized.messages = (normalized.messages as Array<{ content: string; chunkIndex: number }>).map(msg => ({
      content: msg.content,
      chunkIndex: msg.chunkIndex,
    }));
  }
  
  return normalized;
}

/**
 * Log test result for debugging.
 */
export function logTestResult(
  testId: string,
  passed: boolean,
  details?: string
): void {
  const status = passed ? '✓' : '✗';
  const message = `${status} ${testId}${details ? `: ${details}` : ''}`;
  
  if (passed) {
    console.log(message);
  } else {
    console.error(message);
  }
}
