import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id') || url.searchParams.get('agentId');

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agent_id parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch agent details and deployment config
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('name, deployment_config')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent fetch error:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch active announcements (exclude user_id for security)
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('id, agent_id, title, subtitle, image_url, title_color, background_color, action_type, action_url, order_index, is_active')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (announcementsError) {
      console.error('Announcements fetch error:', announcementsError);
    }

    // Fetch help categories (exclude user_id for security)
    const { data: categories, error: categoriesError } = await supabase
      .from('help_categories')
      .select('id, agent_id, name, description, order_index')
      .eq('agent_id', agentId)
      .order('order_index', { ascending: true });

    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError);
    }

    // Fetch help articles (exclude user_id for security)
    const { data: articles, error: articlesError } = await supabase
      .from('help_articles')
      .select('id, agent_id, category_id, title, content, icon, order_index')
      .eq('agent_id', agentId)
      .order('order_index', { ascending: true });

    if (articlesError) {
      console.error('Articles fetch error:', articlesError);
    }

    const deploymentConfig = (agent.deployment_config as any) || {};
    const embeddedChatConfig = deploymentConfig.embedded_chat || {};

    // Transform quick actions to match widget format
    const quickActions = (embeddedChatConfig.quickActions || [
      { icon: '💬', label: 'Start a Chat', action: 'open_messages' },
      { icon: '📚', label: 'Help Articles', action: 'open_help' }
    ]).map((qa: any) => ({
      id: qa.action || qa.id,
      title: qa.label || qa.title,
      subtitle: qa.subtitle || '',
      icon: qa.icon,
      action: qa.action
    }));

    // Return flat config structure
    const response = {
      // Agent info
      agentName: agent.name,
      avatarUrl: embeddedChatConfig.avatarUrl || null,
      
      // Appearance
      primaryColor: embeddedChatConfig.primaryColor || '#6366f1',
      gradientStartColor: embeddedChatConfig.gradientStartColor || '#6366f1',
      gradientEndColor: embeddedChatConfig.gradientEndColor || '#8b5cf6',
      position: embeddedChatConfig.position || 'bottom-right',
      animation: embeddedChatConfig.animation || 'bounce',
      showBadge: embeddedChatConfig.showBadge !== false,
      useGradientHeader: embeddedChatConfig.useGradientHeader !== false,
      
      // Team avatars
      showTeamAvatars: embeddedChatConfig.showTeamAvatars !== false,
      teamAvatarUrls: embeddedChatConfig.teamAvatarUrls || [],
      
      // Timing
      displayTiming: embeddedChatConfig.displayTiming || 'immediate',
      delaySeconds: embeddedChatConfig.delaySeconds || 3,
      scrollDepth: embeddedChatConfig.scrollDepth || 50,
      
      // Teaser
      showTeaser: embeddedChatConfig.showTeaser || false,
      teaserText: embeddedChatConfig.teaserText || 'Need help?',
      
      // Welcome
      welcomeEmoji: embeddedChatConfig.welcomeEmoji || '👋',
      welcomeTitle: embeddedChatConfig.welcomeTitle || 'Hi there!',
      welcomeSubtitle: embeddedChatConfig.welcomeSubtitle || 'How can we help you today?',
      
      // Messages
      greeting: embeddedChatConfig.greeting || 'Hello! How can I help you today?',
      placeholder: embeddedChatConfig.placeholder || 'Type your message...',
      showTypingIndicator: embeddedChatConfig.showTypingIndicator !== false,
      showReadReceipts: embeddedChatConfig.showReadReceipts || false,
      showTimestamps: embeddedChatConfig.showTimestamps !== false,
      
      // Features
      enableContactForm: embeddedChatConfig.enableContactForm || false,
      contactFormTitle: embeddedChatConfig.contactFormTitle || 'Get in touch',
      contactFormSubtitle: embeddedChatConfig.contactFormSubtitle || 'Fill out the form below to start chatting',
      customFields: embeddedChatConfig.customFields || [],
      
      enableFileUpload: embeddedChatConfig.enableFileUpload || false,
      allowedFileTypes: embeddedChatConfig.allowedFileTypes || ['image/*', 'application/pdf'],
      maxFileSize: embeddedChatConfig.maxFileSize || 10,
      
      // Navigation
      showBottomNav: embeddedChatConfig.showBottomNav !== false,
      enableMessagesTab: embeddedChatConfig.enableMessagesTab !== false,
      enableHelpTab: embeddedChatConfig.enableHelpTab !== false,
      quickActions: quickActions,
      
      // Effects
      viewTransition: embeddedChatConfig.viewTransition || 'slide',
      defaultSoundEnabled: embeddedChatConfig.defaultSoundEnabled || false,
      
      // Branding
      showBranding: embeddedChatConfig.showBranding !== false,
      
      // Data
      announcements: announcements || [],
      helpArticles: articles || [],
      helpCategories: categories || [],
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-widget-config:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
