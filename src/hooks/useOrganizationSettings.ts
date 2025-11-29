import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Tables } from '@/integrations/supabase/types';

type Organization = Tables<'organizations'>;
type OrgBranding = Tables<'org_branding'>;

export const useOrganizationSettings = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branding, setBranding] = useState<OrgBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const fetchSettings = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      
      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', currentOrg.id)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      // Fetch branding
      const { data: brandingData, error: brandingError } = await supabase
        .from('org_branding')
        .select('*')
        .eq('org_id', currentOrg.id)
        .maybeSingle();

      if (brandingError && brandingError.code !== 'PGRST116') throw brandingError;
      setBranding(brandingData);
    } catch (error: any) {
      toast({
        title: 'Error fetching settings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!currentOrg) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', currentOrg.id);

      if (error) throw error;

      toast({
        title: 'Organization updated',
        description: 'Organization details have been updated successfully',
      });

      fetchSettings();
    } catch (error: any) {
      toast({
        title: 'Error updating organization',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateBranding = async (updates: Partial<OrgBranding>) => {
    if (!currentOrg) return;

    try {
      if (branding) {
        // Update existing branding
        const { error } = await supabase
          .from('org_branding')
          .update(updates)
          .eq('org_id', currentOrg.id);

        if (error) throw error;
      } else {
        // Create new branding
        const { error } = await supabase
          .from('org_branding')
          .insert({ ...updates, org_id: currentOrg.id });

        if (error) throw error;
      }

      toast({
        title: 'Branding updated',
        description: 'Organization branding has been updated successfully',
      });

      fetchSettings();
    } catch (error: any) {
      toast({
        title: 'Error updating branding',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const uploadLogo = async (file: File) => {
    if (!currentOrg) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentOrg.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      await updateBranding({ logo_url: data.publicUrl });

      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: 'Error uploading logo',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [currentOrg?.id]);

  return {
    organization,
    branding,
    loading,
    updateOrganization,
    updateBranding,
    uploadLogo,
    refetch: fetchSettings,
  };
};
