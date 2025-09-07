import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SowApprovalRequest {
  clientEmail: string;
  clientName: string;
  companyName: string;
  sowTitle: string;
  sowPdf?: string; // Base64 encoded PDF
}

const handler = async (req: Request): Promise<Response> => {
  console.log('SOW Approval email function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { clientEmail, clientName, companyName, sowTitle, sowPdf }: SowApprovalRequest = await req.json();
    console.log('Processing SOW approval for:', { clientEmail, clientName, sowTitle });

    // Fetch the SOW approval template from database
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'sow_approval')
      .eq('active', true)
      .single();

    if (templateError || !template) {
      console.error('SOW approval template not found:', templateError);
      return new Response(
        JSON.stringify({ error: 'SOW approval email template not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Replace template variables
    const variables = {
      client_name: clientName,
      company_name: companyName,
      sow_title: sowTitle
    };

    let subject = template.subject;
    let htmlContent = template.html_content;

    // Replace variables in subject and content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value || '');
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value || '');
    });

    console.log('Sending SOW approval email to:', clientEmail);

    // Prepare email attachments
    const attachments = [];
    if (sowPdf) {
      attachments.push({
        filename: `${sowTitle}_SOW.pdf`,
        content: sowPdf,
        type: 'application/pdf',
      });
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'noreply@park-web.com',
      to: [clientEmail],
      subject: subject,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log('SOW approval email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-sow-approval function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);