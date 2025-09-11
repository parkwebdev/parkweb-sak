import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PromoteClientRequest {
  clientEmail: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { clientEmail, userId }: PromoteClientRequest = await req.json();
    
    console.log('Promoting client to active:', { clientEmail, userId });

    // Check if client already exists in clients table
    const { data: existingClient, error: existingError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', clientEmail)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing client:', existingError);
      throw new Error('Failed to check existing client');
    }

    if (existingClient) {
      console.log('Client already exists in clients table');
      return new Response(JSON.stringify({
        success: true,
        message: 'Client already active',
        client: existingClient
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get client data from onboarding links
    const { data: onboardingLink, error: linkError } = await supabase
      .from('client_onboarding_links')
      .select('*')
      .eq('email', clientEmail)
      .eq('user_id', userId)
      .single();

    if (linkError) {
      console.error('Error fetching onboarding link:', linkError);
      throw new Error('Onboarding link not found');
    }

    // Get additional data from submissions if available
    const { data: submission } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('client_email', clientEmail)
      .order('submitted_at', { ascending: false })
      .maybeSingle();

    // Create client record in clients table
    const clientData = {
      user_id: userId,
      client_name: onboardingLink.client_name,
      email: clientEmail,
      company_name: onboardingLink.company_name,
      industry: onboardingLink.industry,
      status: 'active',
      personal_note: onboardingLink.personal_note || null,
      phone: null, // Could be extracted from submission if needed
      address: null, // Could be extracted from submission if needed
    };

    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      throw new Error('Failed to create client record');
    }

    // Update onboarding link status to completed
    const { error: updateError } = await supabase
      .from('client_onboarding_links')
      .update({ 
        status: 'Completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', onboardingLink.id);

    if (updateError) {
      console.error('Error updating onboarding status:', updateError);
      // Don't throw here - client was created successfully
    }

    // Update submission status if it exists
    if (submission) {
      await supabase
        .from('onboarding_submissions')
        .update({ status: 'completed' })
        .eq('id', submission.id);
    }

    console.log('Client promoted successfully:', newClient);

    return new Response(JSON.stringify({
      success: true,
      message: 'Client promoted to active successfully',
      client: newClient
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Error in promote-client-to-active:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});