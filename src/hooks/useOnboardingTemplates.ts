import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTemplate {
  id: string;
  name: string;
  industry: string;
  description?: string;
  form_fields: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useOnboardingTemplates = () => {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error fetching onboarding templates:', error);
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

  const getTemplateById = (id: string): OnboardingTemplate | undefined => {
    return templates.find(template => template.id === id);
  };

  return {
    templates,
    loading,
    getTemplateById,
    refetch: fetchTemplates
  };
};