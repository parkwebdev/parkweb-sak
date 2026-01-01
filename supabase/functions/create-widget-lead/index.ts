import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimum time (ms) between form load and submission to consider legitimate
const MIN_FORM_TIME_MS = 2000; // 2 seconds

/**
 * Verify Cloudflare Turnstile token server-side.
 * Returns true if verification passes, false otherwise.
 * Fails open if Turnstile is not configured (allows submission but logs warning).
 */
async function verifyTurnstile(token: string | null): Promise<{ success: boolean; failOpen: boolean }> {
  const turnstileSecret = Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET');
  
  // Fail open if not configured
  if (!turnstileSecret) {
    console.warn('Turnstile: CLOUDFLARE_TURNSTILE_SECRET not configured, skipping verification');
    return { success: true, failOpen: true };
  }
  
  // Fail open if no token provided
  if (!token) {
    console.warn('Turnstile: No token provided, allowing submission (fail-open)');
    return { success: true, failOpen: true };
  }
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: token,
      }),
    });
    
    if (!response.ok) {
      console.error('Turnstile: Verification request failed', response.status);
      return { success: true, failOpen: true }; // Fail open on network errors
    }
    
    const data = await response.json();
    console.log('Turnstile verification result:', data.success ? 'passed' : 'failed');
    return { success: data.success === true, failOpen: false };
  } catch (error) {
    console.error('Turnstile: Verification error', error);
    return { success: true, failOpen: true }; // Fail open on exceptions
  }
}
// Geo-IP lookup using ip-api.com (free, no API key needed)
async function getLocationFromIP(ip: string): Promise<{ country: string; city: string }> {
  if (!ip || ip === 'unknown') {
    return { country: 'Unknown', city: '' };
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    const data = await response.json();
    if (data.status === 'success') {
      console.log(`Geo-IP lookup for ${ip}: ${data.city}, ${data.country}`);
      return { country: data.country || 'Unknown', city: data.city || '' };
    }
  } catch (error) {
    console.error('Geo-IP lookup failed:', error);
  }
  return { country: 'Unknown', city: '' };
}

// Parse user agent string for device info
function parseUserAgent(userAgent: string | null): { device: string; browser: string; os: string } {
  if (!userAgent) return { device: 'unknown', browser: 'unknown', os: 'unknown' };
  
  let device = 'desktop';
  if (/mobile/i.test(userAgent)) device = 'mobile';
  else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';
  
  let browser = 'unknown';
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/edge/i.test(userAgent)) browser = 'Edge';
  
  let os = 'unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';
  
  return { device, browser, os };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agentId, firstName, lastName, email, customFields, _formLoadTime, referrerJourney, turnstileToken } = await req.json();

    // Bot protection: Verify Turnstile token (runs before other checks for early rejection)
    const turnstileResult = await verifyTurnstile(turnstileToken);
    if (!turnstileResult.success) {
      console.log('Bot detected: Turnstile verification failed');
      // Return success to not tip off bots, but don't create lead
      return new Response(
        JSON.stringify({ leadId: 'bot-blocked', conversationId: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (turnstileResult.failOpen) {
      console.log('Turnstile: Verification skipped (fail-open mode)');
    }

    // Spam protection: Check timing (reject if submitted too fast)
    if (_formLoadTime) {
      const timeTaken = Date.now() - _formLoadTime;
      if (timeTaken < MIN_FORM_TIME_MS) {
        console.log(`Spam detected: Form submitted too fast (${timeTaken}ms)`);
        // Return success to not tip off bots, but don't create lead
        return new Response(
          JSON.stringify({ leadId: 'spam-blocked', conversationId: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!agentId || !firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs (trim and limit length)
    const sanitizedFirstName = String(firstName).trim().slice(0, 50);
    const sanitizedLastName = String(lastName).trim().slice(0, 50);
    const sanitizedEmail = String(email).trim().toLowerCase().slice(0, 255);

    // Get agent details to find user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: Check for recent submissions from same email (within 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('email', sanitizedEmail)
      .gte('created_at', oneMinuteAgo)
      .limit(1);

    if (recentLeads && recentLeads.length > 0) {
      console.log(`Rate limit: Email ${sanitizedEmail} submitted recently`);
      // Return success to not tip off spammers
      return new Response(
        JSON.stringify({ leadId: 'rate-limited', conversationId: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capture request metadata
    const ipAddress = req.headers.get('cf-connecting-ip') || 
                      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent');
    const referer = req.headers.get('referer') || null;
    const { device, browser, os } = parseUserAgent(userAgent);
    
    // Get location from IP address via geo-IP lookup
    const { country, city } = await getLocationFromIP(ipAddress);

    // Create conversation first (typed metadata for consistency)
    interface ConversationMetadata {
      ip_address: string;
      country: string;
      city: string;
      device_type: string;
      browser: string;
      os: string;
      referrer_url: string | null;
      session_started_at: string;
      lead_name: string;
      lead_email: string;
      custom_fields: Record<string, unknown>;
      tags: string[];
      messages_count: number;
      visited_pages: Array<{ url: string; entered_at: string; duration_ms: number }>;
      referrer_journey?: {
        referrer_url: string | null;
        landing_page: string | null;
        utm_source: string | null;
        utm_medium: string | null;
        utm_campaign: string | null;
        utm_term: string | null;
        utm_content: string | null;
        entry_type: string;
      };
    }

    // Process custom fields early: extract phone from type-tagged fields and flatten for storage
    const { _formLoadTime: _, ...rawCustomFields } = customFields || {};
    
    let extractedPhone: string | null = null;
    const flattenedCustomFields: Record<string, unknown> = {};

    for (const [label, fieldData] of Object.entries(rawCustomFields)) {
      if (typeof fieldData === 'object' && fieldData !== null && 'type' in fieldData && 'value' in fieldData) {
        // New structured format with type metadata
        const typedField = fieldData as { value: unknown; type: string };
        flattenedCustomFields[label] = typedField.value;
        
        // Extract phone value from any field with type: 'phone'
        if (typedField.type === 'phone' && typedField.value) {
          extractedPhone = String(typedField.value);
          console.log(`Extracted phone from field "${label}": ${extractedPhone}`);
        }
      } else {
        // Legacy format (backward compatible) - also check for phone in field name
        flattenedCustomFields[label] = fieldData;
        
        // Fallback: detect phone by common field names for legacy data
        const phoneKeys = ['phone', 'Phone', 'phone_number', 'phoneNumber', 'Phone Number', 'telephone', 'mobile', 'Mobile'];
        if (!extractedPhone && phoneKeys.some(k => label.toLowerCase().includes(k.toLowerCase()))) {
          extractedPhone = String(fieldData);
          console.log(`Extracted phone from legacy field "${label}": ${extractedPhone}`);
        }
      }
    }

    const conversationMetadata: ConversationMetadata = {
      ip_address: ipAddress,
      country,
      city,
      device_type: device,
      browser,
      os,
      referrer_url: referer,
      session_started_at: new Date().toISOString(),
      lead_name: `${sanitizedFirstName} ${sanitizedLastName}`,
      lead_email: sanitizedEmail,
      custom_fields: flattenedCustomFields,
      tags: [],
      messages_count: 0,
      visited_pages: [],
    };

    // Add referrer journey if provided
    if (referrerJourney) {
      conversationMetadata.referrer_journey = {
        referrer_url: referrerJourney.referrer_url || null,
        landing_page: referrerJourney.landing_page || null,
        utm_source: referrerJourney.utm_source || null,
        utm_medium: referrerJourney.utm_medium || null,
        utm_campaign: referrerJourney.utm_campaign || null,
        utm_term: referrerJourney.utm_term || null,
        utm_content: referrerJourney.utm_content || null,
        entry_type: referrerJourney.entry_type || 'direct',
      };
      console.log('Added referrer journey to lead conversation:', conversationMetadata.referrer_journey);
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        user_id: agent.user_id,
        status: 'active',
        metadata: conversationMetadata,
      })
      .select('id')
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      // Don't fail the lead creation, just log the error
    }

    const conversationId = conversation?.id || null;

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        user_id: agent.user_id,
        name: `${sanitizedFirstName} ${sanitizedLastName}`,
        email: sanitizedEmail,
        phone: extractedPhone,
        data: { firstName: sanitizedFirstName, lastName: sanitizedLastName, ...flattenedCustomFields },
        status: 'new',
        conversation_id: conversationId,
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update conversation with lead_id
    if (conversationId && lead) {
      await supabase
        .from('conversations')
        .update({
          metadata: {
            ...conversationMetadata,
            lead_id: lead.id,
          }
        })
        .eq('id', conversationId);
    }

    console.log(`Lead created successfully: ${lead.id}, Conversation: ${conversationId}`);

    // Create notifications for lead and conversation (fire and forget)
    const leadName = `${sanitizedFirstName} ${sanitizedLastName}`;
    
    // Notification for new lead captured
    supabase.from('notifications').insert({
      user_id: agent.user_id,
      type: 'lead',
      title: 'New Lead Captured',
      message: `${leadName} submitted a contact form`,
      data: { lead_id: lead.id, email: sanitizedEmail, conversation_id: conversationId },
      read: false
    }).then(() => console.log('Lead notification created'))
      .catch(err => console.error('Failed to create lead notification:', err));

    // Notification for new conversation started
    supabase.from('notifications').insert({
      user_id: agent.user_id,
      type: 'conversation',
      title: 'New Conversation Started',
      message: `${leadName} started a chat`,
      data: { conversation_id: conversationId, lead_id: lead.id },
      read: false
    }).then(() => console.log('Conversation notification created'))
      .catch(err => console.error('Failed to create conversation notification:', err));

    // Send new lead email notification (fire and forget)
    (async () => {
      try {
        // Get owner's email from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', agent.user_id)
          .single();

        if (profile?.email) {
          const appUrl = Deno.env.get('APP_URL') || 'https://getpilot.io';
          
          await fetch(`${supabaseUrl}/functions/v1/send-new-lead-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              recipientEmail: profile.email,
              leadName,
              leadEmail: sanitizedEmail,
              leadPhone: extractedPhone,
              leadId: lead.id,
              conversationId,
            }),
          });
          console.log('New lead email sent to:', profile.email);
        }
      } catch (emailError) {
        console.error('Failed to send new lead email:', emailError);
      }
    })();

    return new Response(
      JSON.stringify({ leadId: lead.id, conversationId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-widget-lead:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
