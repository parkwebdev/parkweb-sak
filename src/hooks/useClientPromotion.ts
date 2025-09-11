import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useClientPromotion = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const promoteClientToActive = async (clientEmail: string) => {
    setLoading(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('promote-client-to-active', {
        body: {
          clientEmail,
          userId: user.user.id
        }
      });

      if (error) {
        console.error('Error promoting client:', error);
        throw new Error(error.message || 'Failed to promote client');
      }

      toast({
        title: "Success",
        description: "Client has been moved to active clients",
      });

      return data.client;

    } catch (error: any) {
      console.error('Error in promoteClientToActive:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to promote client",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    promoteClientToActive,
    loading
  };
};