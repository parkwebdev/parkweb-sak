import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getErrorMessage } from '../_shared/errors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimum time (ms) between form load and submission to consider legitimate
const MIN_FORM_TIME_MS = 2000; // 2 seconds

// In-memory IP rate limiting (resets on function cold start, which is fine for burst protection)
const ipSubmissions = new Map<string, { count: number; firstSubmission: number }>();
const IP_RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const IP_RATE_LIMIT_MAX = 5; // Max 5 submissions per IP per minute

/**
 * Check if IP is rate limited
 */
function isIpRateLimited(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  const now = Date.now();
  const record = ipSubmissions.get(ip);
  
  if (!record) {
    ipSubmissions.set(ip, { count: 1, firstSubmission: now });
    return false;
  }
  
  // Reset window if expired
  if (now - record.firstSubmission > IP_RATE_LIMIT_WINDOW_MS) {
    ipSubmissions.set(ip, { count: 1, firstSubmission: now });
    return false;
  }
  
  // Check if over limit
  if (record.count >= IP_RATE_LIMIT_MAX) {
    console.log(`IP rate limited: ${ip} (${record.count} submissions in window)`);
    return true;
  }
  
  // Increment count
  record.count++;
  return false;
}

/**
 * Content validation - detect spam patterns in form fields
 * Returns true if content looks spammy
 */
function isSpamContent(firstName: string, lastName: string, customFields: Record<string, unknown>): boolean {
  const allText = [firstName, lastName];
  
  // Collect all string values from custom fields
  for (const value of Object.values(customFields || {})) {
    if (typeof value === 'string') {
      allText.push(value);
    } else if (typeof value === 'object' && value !== null && 'value' in value) {
      const typedValue = (value as { value: unknown }).value;
      if (typeof typedValue === 'string') {
        allText.push(typedValue);
      }
    }
  }
  
  for (const text of allText) {
    if (!text) continue;
    
    // Check for URLs in name fields (spam signature)
    if (/https?:\/\/|www\./i.test(text)) {
      console.log('Spam detected: URL in form field');
      return true;
    }
    
    // Check for HTML tags
    if (/<[^>]+>/i.test(text)) {
      console.log('Spam detected: HTML in form field');
      return true;
    }
    
    // Check for excessive special characters (gibberish)
    const specialCharRatio = (text.match(/[^a-zA-Z0-9\s\-'.,@]/g) || []).length / text.length;
    if (text.length > 10 && specialCharRatio > 0.3) {
      console.log('Spam detected: Excessive special characters');
      return true;
    }
    
    // Check for repeated characters (e.g., "aaaaaa")
    if (/(.)\1{5,}/i.test(text)) {
      console.log('Spam detected: Repeated characters');
      return true;
    }
    
    // Common spam phrases
    const spamPhrases = [
      /\b(viagra|cialis|casino|lottery|winner|prize|free money)\b/i,
      /\b(click here|buy now|act now|limited time)\b/i,
      /\b(make money fast|work from home|earn \$\d+)\b/i,
    ];
    for (const pattern of spamPhrases) {
      if (pattern.test(text)) {
        console.log('Spam detected: Known spam phrase');
        return true;
      }
    }
  }
  
  return false;
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
  } catch (error: unknown) {
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

    const { agentId, firstName, lastName, customFields, _formLoadTime, referrerJourney } = await req.json();

    // Capture IP address early for rate limiting
    const ipAddress = req.headers.get('cf-connecting-ip') || 
                      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Bot protection #1: IP-based rate limiting
    if (isIpRateLimited(ipAddress)) {
      console.log(`Bot blocked: IP rate limit exceeded for ${ipAddress}`);
      return new Response(
        JSON.stringify({ leadId: 'rate-limited', conversationId: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bot protection #2: Content validation (detect spam patterns)
    if (isSpamContent(firstName || '', lastName || '', customFields || {})) {
      console.log('Bot blocked: Spam content detected');
      return new Response(
        JSON.stringify({ leadId: 'spam-blocked', conversationId: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bot protection #3: Timing check (reject if submitted too fast)
    if (_formLoadTime) {
      const timeTaken = Date.now() - _formLoadTime;
      if (timeTaken < MIN_FORM_TIME_MS) {
        console.log(`Bot blocked: Form submitted too fast (${timeTaken}ms)`);
        return new Response(
          JSON.stringify({ leadId: 'timing-blocked', conversationId: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!agentId || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agentId, firstName, lastName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Process custom fields: extract name, email, phone from type-tagged fields and flatten for storage
    const rawCustomFields = customFields || {};
    
    let extractedName: string | null = null;
    let extractedEmail: string | null = null;
    let extractedPhone: string | null = null;
    const flattenedCustomFields: Record<string, unknown> = {};

    for (const [label, fieldData] of Object.entries(rawCustomFields)) {
      if (typeof fieldData === 'object' && fieldData !== null && 'type' in fieldData && 'value' in fieldData) {
        // New structured format with type metadata
        const typedField = fieldData as { value: unknown; type: string };
        flattenedCustomFields[label] = typedField.value;
        
        // Extract name value from any field with type: 'name'
        if (typedField.type === 'name' && typedField.value) {
          extractedName = String(typedField.value).trim().slice(0, 100);
          console.log(`Extracted name from field "${label}": ${extractedName}`);
        }
        
        // Extract email value from any field with type: 'email'
        if (typedField.type === 'email' && typedField.value) {
          const emailValue = String(typedField.value).trim().toLowerCase().slice(0, 255);
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(emailValue)) {
            extractedEmail = emailValue;
            console.log(`Extracted email from field "${label}": ${extractedEmail}`);
          }
        }
        
        // Extract phone value from any field with type: 'phone'
        if (typedField.type === 'phone' && typedField.value) {
          extractedPhone = String(typedField.value);
          console.log(`Extracted phone from field "${label}": ${extractedPhone}`);
        }
      } else {
        // Legacy format (backward compatible)
        flattenedCustomFields[label] = fieldData;
      }
    }

    // Rate limiting: Check for recent submissions from same email (within 1 minute) - only if email provided
    if (extractedEmail) {
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('email', extractedEmail)
        .gte('created_at', oneMinuteAgo)
        .limit(1);

      if (recentLeads && recentLeads.length > 0) {
        console.log(`Rate limit: Email ${extractedEmail} submitted recently`);
        // Return success to not tip off spammers
        return new Response(
          JSON.stringify({ leadId: 'rate-limited', conversationId: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Capture request metadata (IP already captured above for rate limiting)
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
      lead_email: string | null;
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

    // Use firstName/lastName from request, fall back to extracted name from custom fields
    const leadName = `${firstName} ${lastName}`.trim() || extractedName || 'Anonymous Visitor';

    const conversationMetadata: ConversationMetadata = {
      ip_address: ipAddress,
      country,
      city,
      device_type: device,
      browser,
      os,
      referrer_url: referer,
      session_started_at: new Date().toISOString(),
      lead_name: leadName,
      lead_email: extractedEmail,
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
        name: leadName,
        email: extractedEmail,
        phone: extractedPhone,
        data: flattenedCustomFields,
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
    // Notification for new lead captured
    supabase.from('notifications').insert({
      user_id: agent.user_id,
      type: 'lead',
      title: 'New Lead Captured',
      message: `${leadName} submitted a contact form`,
      data: { lead_id: lead.id, email: extractedEmail, conversation_id: conversationId },
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
          await fetch(`${supabaseUrl}/functions/v1/send-new-lead-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              recipientEmail: profile.email,
              leadName,
              leadEmail: extractedEmail,
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
  } catch (error: unknown) {
    console.error('Error in create-widget-lead:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
