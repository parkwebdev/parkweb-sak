import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContinueLinkRequest {
  clientName: string;
  clientEmail: string;
  companyName: string;
  continueUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { clientName, clientEmail, companyName, continueUrl }: ContinueLinkRequest = await req.json();

    console.log('Sending continue link email:', { clientName, clientEmail, companyName, continueUrl });

    // Get the continue_link template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'continue_link')
      .eq('active', true)
      .single();

    if (templateError || !template) {
      console.error('Continue link template not found:', templateError);
      return new Response(
        JSON.stringify({ error: 'Continue link template not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Replace variables in template
    const variables = {
      client_name: clientName,
      company_name: companyName,
      continue_url: continueUrl
    };

    let subject = template.subject;
    let htmlContent = template.html_content;
    let textContent = template.text_content || '';

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, String(value));
      htmlContent = htmlContent.replace(placeholder, String(value));
      textContent = textContent.replace(placeholder, String(value));
    });

    console.log('Processed template:', { subject, clientEmail });

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "ParkWeb Team <team@parkweb.app>",
      to: [clientEmail],
      reply_to: "team@parkweb.app",
      subject: subject,
      html: htmlContent,
      text: textContent || undefined,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Continue link email sent successfully:", emailResponse.data);

    return new Response(
      JSON.stringify({ 
        success: true,
        emailId: emailResponse.data?.id,
        message: 'Continue link email sent successfully'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-continue-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);