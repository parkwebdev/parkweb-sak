const SUPABASE_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12YWltdndkdWtwZ3ZraWZrZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzI3MTYsImV4cCI6MjA3Mjc0ODcxNn0.DmeecDZcGids_IjJQQepFVQK5wdEdV0eNXDCTRzQtQo';

export interface WidgetConfig {
  agentId: string;
  agentName: string;
  greeting: string;
  primaryColor: string;
  position: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  teamAvatarUrl: string | null;
  useGradientHeader: boolean;
  gradientStartColor: string;
  gradientEndColor: string;
  showBottomNav: boolean;
  showHomeTab: boolean;
  showMessagesTab: boolean;
  showHelpTab: boolean;
  displayTiming: string;
  delaySeconds: number;
  showTeaser: boolean;
  teaserMessage: string;
  buttonAnimation: string;
  viewTransition: string;
  defaultSoundEnabled: boolean;
  defaultAutoScroll: boolean;
  customFields: Array<{
    id: string;
    label: string;
    fieldType: string;
    required: boolean;
    options?: string[];
  }>;
  quickActions: Array<{
    id: string;
    icon: string;
    label: string;
    actionType: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    subtitle: string;
    image_url: string | null;
    background_color: string;
    title_color: string;
    action_type: string;
    action_url: string | null;
  }>;
  helpCategories: Array<{
    id: string;
    name: string;
    description: string | null;
    order_index: number;
  }>;
  helpArticles: Array<{
    id: string;
    category_id: string;
    title: string;
    content: string;
    icon: string | null;
    order_index: number;
  }>;
}

export async function fetchWidgetConfig(agentId: string): Promise<WidgetConfig> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-widget-config?agent_id=${agentId}`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch widget config');
  }

  return response.json();
}

export async function createLead(agentId: string, data: {
  firstName: string;
  lastName: string;
  email: string;
  customFields: Record<string, any>;
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
