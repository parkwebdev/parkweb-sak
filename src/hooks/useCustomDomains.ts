import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CustomDomain {
  id: string;
  domain: string;
  verified: boolean;
  verification_token: string;
  ssl_status: string | null;
  dns_configured: boolean | null;
  is_primary: boolean | null;
  created_at: string;
  verified_at: string | null;
}

export const useCustomDomains = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  const fetchDomains = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [user?.id]);

  const addDomain = async (domain: string) => {
    if (!user?.id) return;

    // Generate verification token
    const verificationToken = `${user.id.substring(0, 8)}-${Date.now()}`;

    try {
      const { error } = await supabase
        .from('custom_domains')
        .insert({
          user_id: user.id,
          domain: domain.toLowerCase().trim(),
          verification_token: verificationToken,
          verified: false,
          dns_configured: false,
          ssl_status: 'pending',
          is_primary: domains.length === 0,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This domain is already registered');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Domain added successfully');
      await fetchDomains();
    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error('Failed to add domain');
    }
  };

  const verifyDomain = async (domainId: string, domain: string) => {
    if (!user?.id) return;

    setVerifying(domainId);
    try {
      const { data, error } = await supabase.functions.invoke('verify-custom-domain', {
        body: { domain, userId: user.id },
      });

      if (error) throw error;

      if (data.verified) {
        toast.success('Domain verified successfully!');
        await fetchDomains();
      } else {
        const issues = [];
        if (!data.dns_configured) issues.push('DNS records not configured correctly');
        if (!data.ssl_active) issues.push('SSL certificate not ready');
        
        toast.error(`Verification failed: ${issues.join(', ')}`);
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast.error('Failed to verify domain. Please check your DNS settings.');
    } finally {
      setVerifying(null);
    }
  };

  const removeDomain = async (domainId: string) => {
    try {
      const { error } = await supabase
        .from('custom_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      toast.success('Domain removed successfully');
      await fetchDomains();
    } catch (error) {
      console.error('Error removing domain:', error);
      toast.error('Failed to remove domain');
    }
  };

  const setPrimaryDomain = async (domainId: string) => {
    if (!user?.id) return;

    try {
      // First, unset all primary domains
      await supabase
        .from('custom_domains')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Then set the new primary
      const { error } = await supabase
        .from('custom_domains')
        .update({ is_primary: true })
        .eq('id', domainId);

      if (error) throw error;

      toast.success('Primary domain updated');
      await fetchDomains();
    } catch (error) {
      console.error('Error setting primary domain:', error);
      toast.error('Failed to update primary domain');
    }
  };

  return {
    domains,
    loading,
    verifying,
    addDomain,
    verifyDomain,
    removeDomain,
    setPrimaryDomain,
    refetch: fetchDomains,
  };
};
