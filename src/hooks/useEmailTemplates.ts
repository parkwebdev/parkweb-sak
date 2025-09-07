import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: Record<string, any>;
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
      // Skip database query for now - templates will be available once types regenerate
      // Using fallback templates that match our database setup
      const fallbackTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'welcome',
          subject: 'Welcome to Our Onboarding Process',
          html_content: '<h1>Welcome {{client_name}}!</h1><p>Thank you for starting the onboarding process for {{company_name}}. Please click <a href="{{onboarding_url}}">here</a> to continue.</p>',
          text_content: 'Welcome {{client_name}}! Thank you for starting the onboarding process for {{company_name}}. Please visit: {{onboarding_url}}',
          variables: { client_name: 'Client Name', company_name: 'Company Name', onboarding_url: 'URL' },
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'reminder',
          subject: 'Complete Your Onboarding - {{company_name}}',
          html_content: '<h1>Don\'t forget to complete your onboarding!</h1><p>Hi {{client_name}}, you started the onboarding process for {{company_name}} but haven\'t finished yet. <a href="{{onboarding_url}}">Click here to continue</a> where you left off.</p>',
          text_content: 'Hi {{client_name}}, you started the onboarding process for {{company_name}} but haven\'t finished yet. Continue at: {{onboarding_url}}',
          variables: { client_name: 'Client Name', company_name: 'Company Name', onboarding_url: 'URL' },
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'completion',
          subject: 'Onboarding Complete - {{company_name}}',
          html_content: '<h1>Thank you for completing your onboarding!</h1><p>Hi {{client_name}}, we\'ve received your completed onboarding for {{company_name}}. Our team will review it and be in touch soon.</p>',
          text_content: 'Hi {{client_name}}, we\'ve received your completed onboarding for {{company_name}}. Our team will review it and be in touch soon.',
          variables: { client_name: 'Client Name', company_name: 'Company Name' },
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setTemplates(fallbackTemplates);
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