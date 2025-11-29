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

    // Send webhook with retry logic
    let attempt = 0;
    let success = false;
    let lastError: string | null = null;
    let responseStatus: number | null = null;
    let responseBody: string | null = null;

    while (attempt < 3 && !success) {
      try {
        console.log(`Attempt ${attempt + 1} to send webhook to ${webhook.url}`);
        
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        responseStatus = response.status;
        responseBody = await response.text();

        if (response.ok) {
          success = true;
          console.log('Webhook delivered successfully');
        } else {
          lastError = `HTTP ${response.status}: ${responseBody}`;
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

    // Log the webhook delivery attempt
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhookId,
        event_type: testMode ? 'test' : eventType,
        payload,
        response_status: responseStatus,
        response_body: responseBody?.substring(0, 1000), // Limit response body size
        error_message: lastError,
        retry_count: attempt - 1,
        delivered: success,
        delivered_at: success ? new Date().toISOString() : null,
      });

    if (logError) {
      console.error('Error logging webhook delivery:', logError);
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
