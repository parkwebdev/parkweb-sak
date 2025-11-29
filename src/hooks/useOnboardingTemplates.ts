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

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const useOnboardingTemplates = () => {
  return {
    templates: [],
    loading: false,
    getTemplateById: () => undefined,
    getTemplateByIndustry: () => undefined,
  };
};
