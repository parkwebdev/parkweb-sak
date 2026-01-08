# Automations Security

> SSRF protection, rate limiting, input validation, and secure execution

## SSRF Protection

### Blocked URL Patterns

The HTTP Request action must validate URLs to prevent Server-Side Request Forgery:

```typescript
// supabase/functions/_shared/url-validator.ts

const BLOCKED_HOSTS = [
  // Localhost variants
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',

  // Link-local
  '169.254.',

  // Cloud metadata endpoints
  '169.254.169.254', // AWS, GCP, Azure
  'metadata.google.internal',
  'metadata.gke.internal',

  // Internal Supabase
  'supabase.co',
  'supabase.com',
  'supabase.net',
];

const BLOCKED_IP_RANGES = [
  // Private networks (RFC 1918)
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },

  // Loopback
  { start: '127.0.0.0', end: '127.255.255.255' },

  // Link-local
  { start: '169.254.0.0', end: '169.254.255.255' },

  // Carrier-grade NAT
  { start: '100.64.0.0', end: '100.127.255.255' },
];

const BLOCKED_PROTOCOLS = ['file:', 'ftp:', 'data:', 'javascript:'];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

export function validateUrl(url: string): UrlValidationResult {
  try {
    const parsed = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Protocol ${parsed.protocol} is not allowed. Use HTTP or HTTPS.`,
      };
    }

    // Check for blocked hosts
    const hostname = parsed.hostname.toLowerCase();
    for (const blocked of BLOCKED_HOSTS) {
      if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
        return {
          valid: false,
          error: `Host ${hostname} is not allowed.`,
        };
      }
    }

    // Resolve hostname and check IP ranges
    // Note: In Edge Functions, we can't do DNS resolution,
    // but we can block obvious IP addresses
    if (isPrivateIP(hostname)) {
      return {
        valid: false,
        error: 'Private IP addresses are not allowed.',
      };
    }

    return {
      valid: true,
      sanitizedUrl: parsed.toString(),
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format.',
    };
  }
}

function isPrivateIP(hostname: string): boolean {
  // Check if hostname looks like an IP address
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(hostname)) {
    return false;
  }

  const parts = hostname.split('.').map(Number);
  const ip = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];

  for (const range of BLOCKED_IP_RANGES) {
    const startParts = range.start.split('.').map(Number);
    const endParts = range.end.split('.').map(Number);
    const start = (startParts[0] << 24) | (startParts[1] << 16) | (startParts[2] << 8) | startParts[3];
    const end = (endParts[0] << 24) | (endParts[1] << 16) | (endParts[2] << 8) | endParts[3];

    if (ip >= start && ip <= end) {
      return true;
    }
  }

  return false;
}
```

### URL Validation in HTTP Action

```typescript
// In execute-automation edge function

import { validateUrl } from '../_shared/url-validator.ts';

async function executeHttpRequest(
  config: ActionHttpConfig,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  // Resolve any variables in the URL
  const resolvedUrl = resolveTemplate(config.url, context.variables);

  // Validate the URL
  const validation = validateUrl(resolvedUrl);
  if (!validation.valid) {
    return {
      success: false,
      error: `URL validation failed: ${validation.error}`,
      duration_ms: 0,
    };
  }

  // Proceed with the request
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(validation.sanitizedUrl!, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: config.body ? resolveTemplate(config.body, context.variables) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!config.successStatusCodes.includes(response.status)) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        duration_ms: Date.now() - startTime,
      };
    }

    const responseData = await response.json().catch(() => response.text());

    return {
      success: true,
      output: responseData,
      variables: config.outputVariable
        ? { [config.outputVariable]: responseData }
        : undefined,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      success: false,
      error: getErrorMessage(error),
      duration_ms: Date.now() - startTime,
    };
  }
}
```

## Rate Limiting

### Per-Automation Limits

```typescript
// Rate limit configuration per trigger type
const RATE_LIMITS = {
  event: {
    maxExecutionsPerMinute: 60,
    maxExecutionsPerHour: 1000,
    maxConcurrent: 10,
  },
  schedule: {
    maxExecutionsPerMinute: 10,
    maxExecutionsPerHour: 100,
    maxConcurrent: 5,
  },
  manual: {
    maxExecutionsPerMinute: 30,
    maxExecutionsPerHour: 500,
    maxConcurrent: 5,
  },
  ai_tool: {
    maxExecutionsPerMinute: 100,
    maxExecutionsPerHour: 2000,
    maxConcurrent: 20,
  },
} as const;

interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // Seconds
}

async function checkRateLimit(
  automationId: string,
  triggerType: string,
  supabaseClient: SupabaseClient
): Promise<RateLimitCheck> {
  const limits = RATE_LIMITS[triggerType as keyof typeof RATE_LIMITS];
  if (!limits) {
    return { allowed: true };
  }

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check concurrent executions
  const { count: concurrent } = await supabaseClient
    .from('automation_executions')
    .select('*', { count: 'exact', head: true })
    .eq('automation_id', automationId)
    .eq('status', 'running');

  if ((concurrent ?? 0) >= limits.maxConcurrent) {
    return {
      allowed: false,
      reason: `Maximum concurrent executions (${limits.maxConcurrent}) reached`,
      retryAfter: 5,
    };
  }

  // Check per-minute limit
  const { count: perMinute } = await supabaseClient
    .from('automation_executions')
    .select('*', { count: 'exact', head: true })
    .eq('automation_id', automationId)
    .gte('started_at', oneMinuteAgo.toISOString());

  if ((perMinute ?? 0) >= limits.maxExecutionsPerMinute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded (${limits.maxExecutionsPerMinute}/minute)`,
      retryAfter: 60,
    };
  }

  // Check per-hour limit
  const { count: perHour } = await supabaseClient
    .from('automation_executions')
    .select('*', { count: 'exact', head: true })
    .eq('automation_id', automationId)
    .gte('started_at', oneHourAgo.toISOString());

  if ((perHour ?? 0) >= limits.maxExecutionsPerHour) {
    return {
      allowed: false,
      reason: `Rate limit exceeded (${limits.maxExecutionsPerHour}/hour)`,
      retryAfter: 3600,
    };
  }

  return { allowed: true };
}
```

### Response Headers

```typescript
// In edge function response
function createRateLimitHeaders(check: RateLimitCheck): HeadersInit {
  return {
    'X-RateLimit-Limit': String(limits.maxExecutionsPerMinute),
    'X-RateLimit-Remaining': String(limits.maxExecutionsPerMinute - (perMinute ?? 0)),
    'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
    ...(check.retryAfter ? { 'Retry-After': String(check.retryAfter) } : {}),
  };
}
```

## Input Validation

### Zod Schemas for All Inputs

```typescript
// supabase/functions/_shared/automation-schemas.ts

import { z } from 'zod';

// Execution request schema
export const executeAutomationRequestSchema = z.object({
  automationId: z.string().uuid(),
  triggerData: z.record(z.unknown()).optional(),
  testMode: z.boolean().default(false),
  triggeredBy: z.string().uuid().optional(),
});

// Variable name validation (prevent injection)
export const variableNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid variable name');

// Template string validation (prevent code injection)
export function validateTemplateString(template: string): boolean {
  // Only allow {{variable.path}} syntax
  const templateRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g;

  // Remove valid templates
  const withoutTemplates = template.replace(templateRegex, '');

  // Check for remaining braces that might indicate injection
  if (withoutTemplates.includes('{{') || withoutTemplates.includes('}}')) {
    return false;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/i,
    /function\s*\(/i,
    /new\s+Function/i,
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(template));
}
```

### Request Validation in Edge Function

```typescript
// supabase/functions/execute-automation/index.ts

import { corsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errors.ts';
import { executeAutomationRequestSchema } from '../_shared/automation-schemas.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const body = await req.json();
    const parseResult = executeAutomationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: parseResult.error.flatten(),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { automationId, triggerData, testMode, triggeredBy } = parseResult.data;

    // ... rest of execution logic

  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

## Variable Resolution Security

### Safe Template Resolution

```typescript
// supabase/functions/_shared/template-resolver.ts

import { validateTemplateString } from './automation-schemas.ts';

interface ResolveOptions {
  maxDepth?: number;
  allowedNamespaces?: string[];
}

export function resolveTemplate(
  template: string,
  variables: Record<string, unknown>,
  options: ResolveOptions = {}
): string {
  const { maxDepth = 5, allowedNamespaces } = options;

  // Validate template first
  if (!validateTemplateString(template)) {
    throw new Error('Template contains invalid patterns');
  }

  // Resolve variables
  return template.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, (match, path) => {
    // Check namespace if restricted
    if (allowedNamespaces) {
      const namespace = path.split('.')[0];
      if (!allowedNamespaces.includes(namespace)) {
        return match; // Leave unresolved
      }
    }

    const value = getNestedValue(variables, path, maxDepth);
    if (value === undefined) {
      return match; // Leave unresolved if not found
    }

    // Convert to string safely
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  });
}

function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
  maxDepth: number
): unknown {
  const parts = path.split('.');

  if (parts.length > maxDepth) {
    throw new Error(`Path exceeds maximum depth of ${maxDepth}`);
  }

  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    // Prevent prototype pollution
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      throw new Error('Invalid path: prototype access not allowed');
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
```

## Secret Management

### Secret References in Configs

Secrets are referenced, never stored in automation configs:

```typescript
// In node config
const httpConfig = {
  type: 'action-http',
  url: 'https://api.example.com',
  headers: {
    'Authorization': '{{secrets.API_KEY}}', // Reference, not value
  },
};

// Resolution at execution time
async function resolveSecrets(
  config: Record<string, unknown>,
  agentId: string,
  supabaseClient: SupabaseClient
): Promise<Record<string, unknown>> {
  const secretPattern = /\{\{secrets\.([A-Z_][A-Z0-9_]*)\}\}/g;
  const configStr = JSON.stringify(config);
  const matches = [...configStr.matchAll(secretPattern)];

  if (matches.length === 0) {
    return config;
  }

  // Fetch secrets from Vault (if configured) or agent_secrets table
  const secretNames = [...new Set(matches.map((m) => m[1]))];
  const secrets = await fetchSecrets(agentId, secretNames, supabaseClient);

  // Replace references
  let resolved = configStr;
  for (const [placeholder, name] of matches) {
    const value = secrets[name];
    if (!value) {
      throw new Error(`Secret ${name} not found`);
    }
    resolved = resolved.replace(placeholder, value);
  }

  return JSON.parse(resolved);
}
```

## Edge Function Error Handling

### Standard CORS Headers

```typescript
// supabase/functions/_shared/cors.ts

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
```

### Error Response Pattern

```typescript
// supabase/functions/_shared/errors.ts

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function createErrorResponse(
  status: number,
  message: string,
  details?: unknown
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...(details ? { details } : {}),
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Usage
if (!automationId) {
  return createErrorResponse(400, 'Automation ID is required');
}

if (!rateLimitCheck.allowed) {
  return createErrorResponse(429, rateLimitCheck.reason!, {
    retryAfter: rateLimitCheck.retryAfter,
  });
}
```

## Audit Logging

### Security Events

```typescript
// Log security-relevant events
async function logSecurityEvent(
  supabaseClient: SupabaseClient,
  event: {
    action: string;
    resourceType: string;
    resourceId: string;
    userId?: string;
    success: boolean;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  await supabaseClient.from('security_logs').insert({
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    user_id: event.userId,
    success: event.success,
    details: event.details,
    ip_address: null, // Set if available from headers
    user_agent: null, // Set if available from headers
  });
}

// Examples
await logSecurityEvent(supabase, {
  action: 'automation_executed',
  resourceType: 'automation',
  resourceId: automationId,
  userId: triggeredBy,
  success: true,
  details: { triggerType, testMode },
});

await logSecurityEvent(supabase, {
  action: 'ssrf_blocked',
  resourceType: 'automation',
  resourceId: automationId,
  success: false,
  details: { blockedUrl: url, reason: validation.error },
});
```

## Security Checklist

### Before Deployment

- [ ] All node configs validated with Zod schemas
- [ ] SSRF protection tested with private IPs and cloud metadata URLs
- [ ] Rate limiting configured per trigger type
- [ ] Secret references working (no plaintext secrets in configs)
- [ ] RLS policies tested for all operations
- [ ] Error messages don't leak sensitive information
- [ ] Template resolution prevents code injection
- [ ] Audit logging captures security events
- [ ] CORS headers properly configured
- [ ] Request timeouts configured on all HTTP calls

### Periodic Review

- [ ] Review blocked URL patterns for new cloud providers
- [ ] Audit rate limit thresholds based on usage
- [ ] Check for new Zod validation bypass techniques
- [ ] Review security logs for anomalies
- [ ] Test RLS policies with edge cases
