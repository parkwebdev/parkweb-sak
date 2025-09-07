import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPayload {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime notifications for user:', user.id);

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as NotificationPayload;
          
          console.log('Received new notification:', notification);

          // Show toast notification
          toast({
            title: notification.title,
            description: notification.message,
            duration: 5000,
          });

          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id, // Prevent duplicate notifications
              requireInteraction: notification.type === 'system', // System notifications stay until dismissed
            });

            // Auto-close after 5 seconds for non-system notifications
            if (notification.type !== 'system') {
              setTimeout(() => {
                browserNotification.close();
              }, 5000);
            }

            // Handle notification click
            browserNotification.onclick = () => {
              window.focus();
              browserNotification.close();
              
              // Navigate based on notification type and data
              if (notification.type === 'onboarding' && notification.data?.submission_id) {
                window.location.href = '/onboarding';
              } else if (notification.type === 'scope_work' && notification.data?.sow_id) {
                window.location.href = '/scope-of-works';
              }
            };
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime notifications subscription');
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Function to trigger completion notifications and emails
  const triggerOnboardingCompletion = async (submissionId: string) => {
    try {
      // Get the submission details
      const { data: submission, error } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error || !submission) {
        console.error('Error fetching submission:', error);
        return;
      }

      // Send completion email
      const { error: emailError } = await supabase.functions.invoke('send-stage-email', {
        body: {
          templateName: 'completion',
          clientEmail: submission.client_email,
          variables: {
            client_name: submission.client_name,
            company_name: submission.industry || 'your company'
          }
        }
      });

      if (emailError) {
        console.error('Error sending completion email:', emailError);
      }

      // Update the corresponding onboarding link status
      await supabase
        .from('client_onboarding_links')
        .update({ status: 'Completed' })
        .eq('client_name', submission.client_name)
        .eq('email', submission.client_email);

    } catch (error) {
      console.error('Error in triggerOnboardingCompletion:', error);
    }
  };

  return {
    triggerOnboardingCompletion
  };
};