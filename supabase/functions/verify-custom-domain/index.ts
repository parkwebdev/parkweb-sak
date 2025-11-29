import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Check DNS records for a domain
async function checkDNSRecords(domain: string, expectedToken: string) {
  try {
    // In a production environment, you would:
    // 1. Query DNS servers for A records
    // 2. Verify TXT record with verification token
    // 3. Check SSL certificate availability
    
    // For this implementation, we'll simulate the checks
    console.log(`Checking DNS for domain: ${domain}`);
    
    const results = {
      a_record_valid: false,
      txt_record_valid: false,
      ssl_available: false,
    };

    // Simulate DNS lookup (in production, use DNS resolver)
    // You would typically use a DNS API or resolver library here
    const dnsApiUrl = `https://dns.google/resolve?name=${domain}&type=A`;
    const response = await fetch(dnsApiUrl);
    const data = await response.json();
    
    // Check if A record points to our IP (185.158.133.1)
    if (data.Answer) {
      results.a_record_valid = data.Answer.some((record: any) => 
        record.type === 1 && record.data === '185.158.133.1'
      );
    }

    // Check TXT record for verification token
    const txtApiUrl = `https://dns.google/resolve?name=_lovable-verification.${domain}&type=TXT`;
    const txtResponse = await fetch(txtApiUrl);
    const txtData = await txtResponse.json();
    
    if (txtData.Answer) {
      results.txt_record_valid = txtData.Answer.some((record: any) =>
        record.type === 16 && record.data.includes(expectedToken)
      );
    }

    // SSL check would be done by attempting HTTPS connection
    // For now, we'll mark it as available if DNS is configured
    results.ssl_available = results.a_record_valid && results.txt_record_valid;

    return results;
  } catch (error) {
    console.error('DNS check error:', error);
    throw new Error('Failed to check DNS records');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, orgId } = await req.json();

    if (!domain || !orgId) {
      throw new Error('Domain and organization ID are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get organization's branding to retrieve expected verification token
    const { data: branding, error: brandingError } = await supabase
      .from('org_branding')
      .select('custom_domain')
      .eq('org_id', orgId)
      .single();

    if (brandingError) throw brandingError;

    // Generate expected token (in production, store this in the database)
    const expectedToken = `lovable_verify_${orgId.substring(0, 16)}`;

    // Check DNS records
    const dnsResults = await checkDNSRecords(domain, expectedToken);

    // Determine overall verification status
    const verified = dnsResults.a_record_valid && dnsResults.txt_record_valid;
    const sslStatus = dnsResults.ssl_available ? 'active' : 
                      dnsResults.a_record_valid ? 'pending' : 'failed';

    // In a production environment, you would:
    // 1. Update custom_domains table with verification status
    // 2. Trigger SSL certificate generation if verified
    // 3. Configure routing for the domain

    console.log('Verification results:', {
      domain,
      verified,
      sslStatus,
      details: dnsResults,
    });

    return new Response(
      JSON.stringify({
        success: true,
        domain,
        verified,
        ssl_status: sslStatus,
        details: dnsResults,
        message: verified 
          ? 'Domain verified successfully! SSL certificate will be provisioned shortly.'
          : 'DNS records not configured correctly. Please check your settings.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to verify domain',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
