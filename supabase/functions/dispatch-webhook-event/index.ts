import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

interface EventPayload {
  type: 'insert' | 'update' | 'delete';
  table: string;
  schema: string;
  record: any;
  old_record?: any;
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: EventPayload = await req.json();
    console.log('Received webhook event:', payload);

    // Map database events to webhook event types
    let eventType: string | null = null;
    let eventData = payload.record;

    if (payload.table === 'leads') {
      if (payload.type === 'insert') {
        eventType = 'lead.created';
      } else if (payload.type === 'update') {
        eventType = 'lead.updated';
      }
    } else if (payload.table === 'conversations') {
      if (payload.type === 'insert') {
        eventType = 'conversation.created';
      } else if (payload.type === 'update' && payload.old_record?.status !== payload.record?.status) {
        eventType = 'conversation.status_changed';
        eventData = {
          ...payload.record,
          old_status: payload.old_record?.status,
          new_status: payload.record?.status,
        };
      }
    } else if (payload.table === 'messages') {
      if (payload.type === 'insert') {
        eventType = 'message.created';
        if (payload.record?.role === 'assistant') {
          eventType = 'agent.message';
        }
      }
    }

    if (!eventType) {
      console.log('No webhook event type for this database event');
      return new Response(JSON.stringify({ message: 'Event not mapped' }), { status: 200 });
    }

    // Get user_id from the record
    const userId = payload.record?.user_id;
    if (!userId) {
      console.log('No user_id in record, skipping webhook dispatch');
      return new Response(JSON.stringify({ message: 'No user_id' }), { status: 200 });
    }

    // Get all active webhooks for this user that listen to this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (webhooksError) {
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found for this user');
      return new Response(JSON.stringify({ message: 'No webhooks' }), { status: 200 });
    }

    // Filter webhooks that listen to this event type
    const relevantWebhooks = webhooks.filter(webhook => 
      webhook.events?.includes(eventType)
    );

    console.log(`Found ${relevantWebhooks.length} relevant webhooks`);

    // Trigger each webhook asynchronously
    const promises = relevantWebhooks.map(webhook =>
      supabase.functions.invoke('trigger-webhook', {
        body: {
          webhookId: webhook.id,
          eventType,
          eventData,
          testMode: false,
        },
      })
    );

    await Promise.all(promises);

    return new Response(
      JSON.stringify({
        message: 'Webhooks dispatched',
        count: relevantWebhooks.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in dispatch-webhook-event:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
});
