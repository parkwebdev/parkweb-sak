import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DNS verification using Google's DNS-over-HTTPS API
const checkDNSRecords = async (domain: string, expectedToken: string) => {
  try {
    console.log(`Starting DNS verification for ${domain}`);
    
    // Check A records for root domain and www
    const [rootAResponse, wwwAResponse] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${domain}&type=A`),
      fetch(`https://dns.google/resolve?name=www.${domain}&type=A`)
    ]);
    
    const rootAData = await rootAResponse.json();
    const wwwAData = await wwwAResponse.json();
    
    console.log('Root A record:', rootAData);
    console.log('WWW A record:', wwwAData);
    
    const hasRootARecord = rootAData.Answer?.some(
      (record: any) => record.data === '185.158.133.1'
    );
    
    const hasWwwARecord = wwwAData.Answer?.some(
      (record: any) => record.data === '185.158.133.1'
    );

    // Check TXT record for verification
    const txtRecordResponse = await fetch(
      `https://dns.google/resolve?name=_verification.${domain}&type=TXT`
    );
    const txtRecordData = await txtRecordResponse.json();
    
    console.log('TXT record:', txtRecordData);
    
    const hasCorrectTxtRecord = txtRecordData.Answer?.some(
      (record: any) => {
        const txtValue = record.data.replace(/"/g, '');
        return txtValue.includes(expectedToken);
      }
    );

    const dnsConfigured = hasRootARecord && hasWwwARecord && hasCorrectTxtRecord;
    
    return {
      aRecordConfigured: hasRootARecord,
      wwwRecordConfigured: hasWwwARecord,
      txtRecordConfigured: hasCorrectTxtRecord,
      dnsConfigured,
      verified: dnsConfigured,
      details: {
        rootARecords: rootAData.Answer?.map((r: any) => r.data) || [],
        wwwARecords: wwwAData.Answer?.map((r: any) => r.data) || [],
        txtRecords: txtRecordData.Answer?.map((r: any) => r.data) || []
      }
    };
  } catch (error) {
    console.error('DNS check error:', error);
    return {
      aRecordConfigured: false,
      wwwRecordConfigured: false,
      txtRecordConfigured: false,
      dnsConfigured: false,
      verified: false,
      details: {}
    };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, orgId } = await req.json();

    if (!domain || !orgId) {
      throw new Error('Domain and organization ID are required');
    }

    console.log(`Verifying domain: ${domain} for org: ${orgId}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the domain record to retrieve verification token
    const { data: domainRecord, error: domainError } = await supabaseClient
      .from('custom_domains')
      .select('verification_token')
      .eq('domain', domain)
      .eq('org_id', orgId)
      .single();

    if (domainError || !domainRecord) {
      throw new Error('Domain not found');
    }

    const expectedToken = domainRecord.verification_token;
    console.log('Expected verification token:', expectedToken);

    // Check DNS records
    const dnsCheck = await checkDNSRecords(domain, expectedToken);
    console.log('DNS check result:', dnsCheck);

    // Update domain record with verification results
    if (dnsCheck.verified) {
      await supabaseClient
        .from('custom_domains')
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
          dns_configured: true,
          ssl_status: 'active' // In production, would check actual SSL
        })
        .eq('domain', domain)
        .eq('org_id', orgId);
    } else {
      // Update with failed verification
      await supabaseClient
        .from('custom_domains')
        .update({
          dns_configured: dnsCheck.dnsConfigured,
          ssl_status: dnsCheck.dnsConfigured ? 'pending' : 'failed'
        })
        .eq('domain', domain)
        .eq('org_id', orgId);
    }

    return new Response(
      JSON.stringify({
        verified: dnsCheck.verified,
        dns_configured: dnsCheck.dnsConfigured,
        ssl_status: dnsCheck.verified ? 'active' : 'pending',
        ssl_active: dnsCheck.verified,
        details: dnsCheck.details
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        verified: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
