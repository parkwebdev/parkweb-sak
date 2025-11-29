import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type OrgBranding = Tables<'org_branding'>;

export const useOrgBranding = () => {
  const { currentOrg } = useOrganization();
  const [branding, setBranding] = useState<OrgBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchBranding = async () => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('org_branding')
        .select('*')
        .eq('org_id', currentOrg.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setBranding(data);
    } catch (error) {
      console.error('Error fetching branding:', error);
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [currentOrg?.id]);

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!currentOrg?.id) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentOrg.id}-${Date.now()}.${fileExt}`;
      const filePath = `${currentOrg.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const updateBranding = async (updates: Partial<OrgBranding>, silent = false) => {
    if (!currentOrg?.id) return;

    try {
      if (branding?.id) {
        // Update existing branding
        const { error } = await supabase
          .from('org_branding')
          .update(updates)
          .eq('id', branding.id);

        if (error) throw error;
      } else {
        // Create new branding
        const { error } = await supabase
          .from('org_branding')
          .insert({
            org_id: currentOrg.id,
            ...updates,
          });

        if (error) throw error;
      }

      if (!silent) {
        toast.success('Branding updated successfully');
      }
      await fetchBranding();
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error('Failed to update branding');
    }
  };

  const deleteLogo = async () => {
    if (!branding?.logo_url) return;

    try {
      // Extract file path from URL
      const urlParts = branding.logo_url.split('/logos/');
      if (urlParts.length < 2) throw new Error('Invalid logo URL');
      
      const filePath = urlParts[1];

      const { error: deleteError } = await supabase.storage
        .from('logos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      await updateBranding({ logo_url: null });
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  return {
    branding,
    loading,
    uploading,
    uploadLogo,
    updateBranding,
    deleteLogo,
    refetch: fetchBranding,
  };
};
