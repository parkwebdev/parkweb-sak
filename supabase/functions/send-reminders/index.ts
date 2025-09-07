import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Running reminder system check...');

    // Find onboarding links that need reminders
    // Send reminders at 24h, 72h, and 7 days
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: linksNeedingReminders, error: fetchError } = await supabase
      .from('client_onboarding_links')
      .select(`
        id, user_id, client_name, company_name, email, onboarding_url, 
        date_sent, reminder_count, last_reminder_sent, status
      `)
      .in('status', ['Sent', 'In Progress'])
      .or(`
        and(date_sent.lte.${oneDayAgo.toISOString()},reminder_count.eq.0),
        and(date_sent.lte.${threeDaysAgo.toISOString()},reminder_count.eq.1),
        and(date_sent.lte.${sevenDaysAgo.toISOString()},reminder_count.eq.2)
      `);

    if (fetchError) {
      console.error('Error fetching links:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${linksNeedingReminders?.length || 0} links needing reminders`);

    let remindersSent = 0;
    let errors: any[] = [];

    for (const link of linksNeedingReminders || []) {
      try {
        // Check if we should send a reminder based on timing
        const daysSinceSent = Math.floor((now.getTime() - new Date(link.date_sent).getTime()) / (24 * 60 * 60 * 1000));
        const shouldSend = 
          (link.reminder_count === 0 && daysSinceSent >= 1) ||
          (link.reminder_count === 1 && daysSinceSent >= 3) ||
          (link.reminder_count === 2 && daysSinceSent >= 7);

        if (!shouldSend) continue;

        // Check if there's already a completed submission for this client
        const { data: existingSubmission } = await supabase
          .from('onboarding_submissions')
          .select('id')
          .eq('client_email', link.email)
          .eq('client_name', link.client_name)
          .eq('status', 'completed')
          .single();

        if (existingSubmission) {
          console.log(`Skipping reminder for ${link.email} - already completed`);
          continue;
        }

        // Send reminder email through the stage email function
        const emailResponse = await supabase.functions.invoke('send-stage-email', {
          body: {
            templateName: 'reminder',
            clientEmail: link.email,
            variables: {
              client_name: link.client_name,
              company_name: link.company_name,
              onboarding_url: link.onboarding_url
            }
          }
        });

        if (emailResponse.error) {
          console.error(`Failed to send reminder to ${link.email}:`, emailResponse.error);
          errors.push({ linkId: link.id, email: link.email, error: emailResponse.error });
          continue;
        }

        // Update the reminder tracking
        const { error: updateError } = await supabase
          .from('client_onboarding_links')
          .update({
            reminder_count: link.reminder_count + 1,
            last_reminder_sent: now.toISOString()
          })
          .eq('id', link.id);

        if (updateError) {
          console.error(`Failed to update reminder count for ${link.id}:`, updateError);
          errors.push({ linkId: link.id, error: updateError });
        } else {
          remindersSent++;
          console.log(`Sent reminder ${link.reminder_count + 1} to ${link.email}`);
        }

      } catch (error) {
        console.error(`Error processing reminder for link ${link.id}:`, error);
        errors.push({ linkId: link.id, error: error.message });
      }
    }

    console.log(`Reminder system completed: ${remindersSent} reminders sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        remindersSent,
        errors: errors.length > 0 ? errors : undefined,
        processedAt: now.toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-reminders function:", error);
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