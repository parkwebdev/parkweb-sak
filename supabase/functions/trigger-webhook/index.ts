import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  webhookId?: string;
  eventType?: string;
  eventData?: any;
  testMode?: boolean;
}

// =============================================================================
// SSRF PROTECTION - Block internal/private network URLs
// =============================================================================
const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\.\d+\.\d+\.\d+/i,
  /^https?:\/\/0\.0\.0\.0/i,
  /^https?:\/\/10\.\d+\.\d+\.\d+/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/i,
  /^https?:\/\/192\.168\.\d+\.\d+/i,
  /^https?:\/\/169\.254\.\d+\.\d+/i, // Link-local
  /^https?:\/\/\[::1\]/i, // IPv6 localhost
  /^https?:\/\/\[fe80:/i, // IPv6 link-local
  /^https?:\/\/\[fc00:/i, // IPv6 unique local
  /^https?:\/\/fd00:/i, // Private IPv6
  /^https?:\/\/metadata\.google\.internal/i,
  /^https?:\/\/metadata\.goog/i, // GCP alternative
  /^https?:\/\/instance-data/i, // AWS alternative hostname
  /^https?:\/\/169\.254\.169\.254/i, // AWS/GCP metadata
  /^https?:\/\/100\.100\.100\.200/i, // Alibaba metadata
];

function isBlockedUrl(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
}

// =============================================================================
// SECURITY UTILITIES
// =============================================================================
const SENSITIVE_HEADERS = ['authorization', 'x-api-key', 'api-key', 'apikey', 'token', 'secret', 'password'];

function maskHeadersForLogging(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_HEADERS.some(h => lowerKey.includes(h));
    masked[key] = isSensitive ? `${value.substring(0, 4)}...MASKED` : value;
  }
  return masked;
}

// Response size limit (1MB)
const MAX_RESPONSE_SIZE = 1024 * 1024;

async function fetchWithSizeLimit(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    
    // Check Content-Length header if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      throw new Error(`Response too large: ${contentLength} bytes exceeds ${MAX_RESPONSE_SIZE} limit`);
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readResponseWithLimit(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return '';
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      totalSize += value.length;
      if (totalSize > MAX_RESPONSE_SIZE) {
        reader.cancel();
        throw new Error(`Response body exceeded ${MAX_RESPONSE_SIZE} byte limit`);
      }
      
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const decoder = new TextDecoder();
  return chunks.map(chunk => decoder.decode(chunk, { stream: true })).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { webhookId, eventType, eventData, testMode }: WebhookPayload = await req.json();

    console.log('Triggering webhook:', { webhookId, eventType, testMode });

    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (webhookError || !webhook) {
      throw new Error('Webhook not found');
    }

    if (!webhook.active) {
      throw new Error('Webhook is not active');
    }

    // SSRF Protection: Validate URL before making request
    if (isBlockedUrl(webhook.url)) {
      console.error('SSRF Protection: Blocked internal URL:', webhook.url);
      
      // Log the blocked attempt
      await supabase.from('webhook_logs').insert({
        webhook_id: webhookId,
        event_type: testMode ? 'test' : eventType,
        payload: { blocked: true, reason: 'SSRF protection' },
        response_status: null,
        response_body: null,
        error_message: 'URL blocked by SSRF protection - internal/private network addresses not allowed',
        retry_count: 0,
        delivered: false,
        delivered_at: null,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'URL blocked by security policy',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Webhook config:', { 
      method: webhook.method, 
      auth_type: webhook.auth_type,
      url: webhook.url 
    });

    // Prepare payload
    const payload = testMode
      ? {
          event: 'test',
          timestamp: new Date().toISOString(),
          data: { message: 'This is a test webhook' },
        }
      : {
          event: eventType,
          timestamp: new Date().toISOString(),
          data: eventData,
        };

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Lovable-Webhook/1.0',
      ...(webhook.headers as Record<string, string> || {}),
    };

    // Add authentication headers based on auth_type
    const authConfig = webhook.auth_config as Record<string, any> || {};
    
    if (webhook.auth_type === 'api_key' && authConfig.header_name && authConfig.api_key) {
      headers[authConfig.header_name] = authConfig.api_key;
      console.log(`Added API Key header: ${authConfig.header_name}`);
    } else if (webhook.auth_type === 'bearer_token' && authConfig.token) {
      headers['Authorization'] = `Bearer ${authConfig.token}`;
      console.log('Added Bearer Token authorization');
    } else if (webhook.auth_type === 'basic_auth' && authConfig.username && authConfig.password) {
      const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
      console.log('Added Basic Auth authorization');
    }

    // Log masked headers for security
    console.log('Request headers (masked):', maskHeadersForLogging(headers));

    // Send webhook with retry logic
    let attempt = 0;
    let success = false;
    let lastError: string | null = null;
    let responseStatus: number | null = null;
    let responseBody: string | null = null;

    while (attempt < 3 && !success) {
      try {
        console.log(`Attempt ${attempt + 1} to send ${webhook.method} request to ${webhook.url}`);
        
        const fetchOptions: RequestInit = {
          method: webhook.method || 'POST',
          headers,
        };

        // Only add body for methods that support it
        if (webhook.method !== 'GET' && webhook.method !== 'HEAD') {
          fetchOptions.body = JSON.stringify(payload);
        }
        
        const response = await fetchWithSizeLimit(webhook.url, fetchOptions);

        responseStatus = response.status;
        
        try {
          responseBody = await readResponseWithLimit(response);
        } catch (sizeError) {
          responseBody = '[Response truncated - exceeded size limit]';
          console.warn('Response size limit exceeded:', sizeError);
        }

        if (response.ok) {
          success = true;
          console.log('Webhook delivered successfully');
        } else {
          lastError = `HTTP ${response.status}: ${responseBody?.substring(0, 200)}`;
          console.error('Webhook delivery failed:', lastError);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error('Webhook delivery error:', lastError);
      }

      attempt++;

      // Wait before retry (exponential backoff)
      if (!success && attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Log the webhook delivery attempt (with truncated response body)
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhookId,
        event_type: testMode ? 'test' : eventType,
        payload,
        response_status: responseStatus,
        response_body: responseBody?.substring(0, 1000),
        error_message: lastError,
        retry_count: attempt - 1,
        delivered: success,
        delivered_at: success ? new Date().toISOString() : null,
      });

    if (logError) {
      console.error('Error logging webhook delivery:', logError);
    }

    // Send failure notification email if webhook failed after all retries and not in test mode
    if (!success && !testMode) {
      try {
        // Get webhook owner's email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', webhook.user_id)
          .single();

        if (profile?.email && !profileError) {
          console.log(`Sending webhook failure notification to ${profile.email}`);
          
          await supabase.functions.invoke('send-webhook-failure-email', {
            body: {
              recipientEmail: profile.email,
              webhookId: webhookId,
              webhookName: webhook.name,
              endpoint: webhook.url,
              errorCode: responseStatus || 0,
              errorMessage: lastError || 'Unknown error',
              retryCount: attempt,
            },
          });
        } else {
          console.warn('Could not find owner email for webhook failure notification');
        }
      } catch (emailError) {
        // Don't fail the webhook response if email fails
        console.error('Failed to send webhook failure email:', emailError);
      }
    }

    // Handle response actions if webhook was successful
    if (success && !testMode && webhook.response_actions) {
      const responseActions = webhook.response_actions as { 
        actions?: Array<{
          condition: { status_code?: number; body_contains?: string };
          action: { type: string; updates?: Record<string, unknown> };
        }>;
      };
      if (responseActions.actions && Array.isArray(responseActions.actions)) {
        console.log('Processing response actions...');
        
        for (const action of responseActions.actions) {
          try {
            // Check if response matches the condition
            const conditionMet = 
              (!action.condition.status_code || responseStatus === action.condition.status_code) &&
              (!action.condition.body_contains || responseBody?.includes(action.condition.body_contains));

            if (conditionMet) {
              console.log('Response action condition met:', action.action.type);

              // Perform the action
              if (action.action.type === 'update_lead' && eventData?.id) {
                const { error: updateError } = await supabase
                  .from('leads')
                  .update(action.action.updates)
                  .eq('id', eventData.id)
                  .eq('user_id', webhook.user_id);

                if (updateError) {
                  console.error('Error updating lead:', updateError);
                } else {
                  console.log('Lead updated successfully via response action');
                }
              } else if (action.action.type === 'update_conversation' && eventData?.id) {
                const { error: updateError } = await supabase
                  .from('conversations')
                  .update(action.action.updates)
                  .eq('id', eventData.id)
                  .eq('user_id', webhook.user_id);

                if (updateError) {
                  console.error('Error updating conversation:', updateError);
                } else {
                  console.log('Conversation updated successfully via response action');
                }
              }
            }
          } catch (actionError) {
            console.error('Error executing response action:', actionError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success,
        attempts: attempt,
        error: lastError,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: success ? 200 : 500,
      }
    );
  } catch (error) {
    console.error('Error in trigger-webhook function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
