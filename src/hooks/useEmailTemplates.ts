interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const useEmailTemplates = () => {
  return {
    templates: [],
    loading: false,
    sendWelcomeEmail: async () => ({ success: false, error: 'Feature temporarily disabled' }),
    sendStageEmail: async () => ({ success: false, error: 'Feature temporarily disabled' }),
  };
};
