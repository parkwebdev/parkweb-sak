const SUPABASE_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12YWltdndkdWtwZ3ZraWZrZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzI3MTYsImV4cCI6MjA3Mjc0ODcxNn0.DmeecDZcGids_IjJQQepFVQK5wdEdV0eNXDCTRzQtQo';

export interface WidgetConfig {
  // Agent info
  agentId: string;
  agentName: string;
  userId: string;
  
  // Display settings
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  useGradientHeader: boolean;
  gradientStartColor: string;
  gradientEndColor: string;
  
  // Hero section
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeEmoji?: string;
  showTeamAvatars: boolean;
  teamAvatarUrls: string[];
  
  // Greetings and messages
  greeting: string;
  placeholder: string;
  
  // Widget button
  animation: 'none' | 'pulse' | 'bounce' | 'fade' | 'ring';
  buttonAnimation?: 'none' | 'pulse' | 'bounce' | 'fade' | 'ring';
  
  // Navigation
  enableHomeTab: boolean;
  enableMessagesTab: boolean;
  enableHelpTab: boolean;
  showBottomNav: boolean;
  
  // Contact form
  enableContactForm: boolean;
  contactFormTitle: string;
  contactFormSubtitle?: string;
  customFields: Array<{
    id: string;
    label: string;
    fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select';
    required: boolean;
    options?: string[];
  }>;
  
  // Quick actions
  quickActions: Array<{
    id: string;
    label: string;
    title?: string;
    subtitle?: string;
    icon: string;
    actionType: string;
    action?: string;
  }>;
  
  // Announcements
  announcements: Array<{
    id: string;
    title: string;
    subtitle?: string;
    image_url?: string;
    background_color: string;
    title_color: string;
    action_type?: string;
    action_url?: string;
  }>;
  
  // Help center
  helpCategories: Array<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
  }>;
  helpArticles: Array<{
    id: string;
    category_id: string;
    category?: string;
    title: string;
    content: string;
    icon?: string;
    order?: number;
  }>;
  
  // Features
  enableVoiceMessages: boolean;
  enableFileAttachments: boolean;
  allowedFileTypes: string[];
  enableMessageReactions: boolean;
  showReadReceipts: boolean;
  
  // Branding
  showBranding: boolean;
}

export const fetchWidgetConfig = async (agentId: string): Promise<WidgetConfig> => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/get-widget-config?agentId=${agentId}`,
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch widget config');
  }

  return response.json();
};

export async function createLead(agentId: string, data: {
  firstName: string;
  lastName: string;
  email: string;
  customFields: Record<string, any>;
  _formLoadTime?: number; // Spam protection: timestamp when form was loaded
}): Promise<{ leadId: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-widget-lead`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId,
      ...data,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create lead');
  }

  return response.json();
}

export async function submitArticleFeedback(articleId: string, data: {
  sessionId: string;
  isHelpful: boolean;
  comment?: string;
}): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-article-feedback`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      articleId,
      ...data,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit feedback');
  }
}

export async function sendChatMessage(agentId: string, conversationId: string | null, messages: Array<{ role: string; content: string }>): Promise<{ response: string; conversationId: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/widget-chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId,
      conversationId,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}
