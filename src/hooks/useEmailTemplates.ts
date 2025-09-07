import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: any; // Using any to handle Json type from Supabase
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error fetching email templates:', error);
        setTemplates([]);
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error in fetchTemplates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const sendStageEmail = async (
    templateName: string,
    clientEmail: string,
    variables: Record<string, any>
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-stage-email', {
        body: {
          templateName,
          clientEmail,
          variables
        }
      });

      if (error) {
        console.error('Error sending stage email:', error);
        toast({
          title: "Email Error",
          description: "Failed to send email. Please try again.",
          variant: "destructive",
        });
        return { success: false, error };
      }

      toast({
        title: "Email Sent",
        description: `Successfully sent ${templateName} email to ${clientEmail}`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error in sendStageEmail:', error);
      return { success: false, error };
    }
  };

  const sendWelcomeEmail = async (clientName: string, companyName: string, clientEmail: string, onboardingUrl: string) => {
    return sendStageEmail('welcome', clientEmail, {
      client_name: clientName,
      company_name: companyName,
      onboarding_url: onboardingUrl
    });
  };

  const sendReminderEmail = async (clientName: string, companyName: string, clientEmail: string, onboardingUrl: string) => {
    return sendStageEmail('reminder', clientEmail, {
      client_name: clientName,
      company_name: companyName,
      onboarding_url: onboardingUrl
    });
  };

  const sendCompletionEmail = async (clientName: string, companyName: string, clientEmail: string) => {
    return sendStageEmail('completion', clientEmail, {
      client_name: clientName,
      company_name: companyName
    });
  };

  const sendFollowUpEmail = async (clientName: string, companyName: string, clientEmail: string) => {
    return sendStageEmail('follow_up', clientEmail, {
      client_name: clientName,
      company_name: companyName
    });
  };

  return {
    templates,
    loading,
    sendStageEmail,
    sendWelcomeEmail,
    sendReminderEmail,
    sendCompletionEmail,
    sendFollowUpEmail,
    refetch: fetchTemplates
  };
};