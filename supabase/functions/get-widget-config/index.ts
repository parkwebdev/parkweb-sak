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

    // OPTIMIZED: Run all queries in parallel for faster response
    const [agentResult, announcementsResult, categoriesResult, articlesResult, newsResult] = await Promise.all([
      // Fetch agent details and deployment config
      supabase
        .from('agents')
        .select('name, deployment_config, enable_news_tab')
        .eq('id', agentId)
        .single(),
      
      // Fetch active announcements (exclude user_id for security)
      supabase
        .from('announcements')
        .select('id, agent_id, title, subtitle, image_url, title_color, background_color, action_type, action_url, order_index, is_active')
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .order('order_index', { ascending: true }),
      
      // Fetch help categories (exclude user_id for security)
      supabase
        .from('help_categories')
        .select('id, agent_id, name, description, icon, order_index')
        .eq('agent_id', agentId)
        .order('order_index', { ascending: true }),
      
      // Fetch help articles (exclude user_id for security)
      supabase
        .from('help_articles')
        .select('id, agent_id, category_id, title, content, icon, order_index, featured_image')
        .eq('agent_id', agentId)
        .order('order_index', { ascending: true }),
      
      // Fetch published news items
      supabase
        .from('news_items')
        .select('id, title, body, featured_image_url, author_name, author_avatar, published_at, order_index, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url')
        .eq('agent_id', agentId)
        .eq('is_published', true)
        .order('published_at', { ascending: false }),
    ]);

    const { data: agent, error: agentError } = agentResult;
    const { data: announcements, error: announcementsError } = announcementsResult;
    const { data: categories, error: categoriesError } = categoriesResult;
    const { data: articles, error: articlesError } = articlesResult;
    const { data: newsItems, error: newsError } = newsResult;

    if (agentError || !agent) {
      console.error('Agent fetch error:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (announcementsError) {
      console.error('Announcements fetch error:', announcementsError);
    }

    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError);
    }

    if (articlesError) {
      console.error('Articles fetch error:', articlesError);
    }

    if (newsError) {
      console.error('News items fetch error:', newsError);
    }

    const deploymentConfig = (agent.deployment_config as any) || {};
    const embeddedChatConfig = deploymentConfig.embedded_chat || {};
    const enableNewsTab = agent.enable_news_tab || embeddedChatConfig.enableNewsTab || false;

    // Transform quick actions to match widget format
    const quickActions = (embeddedChatConfig.quickActions || [
      { icon: 'chat', title: 'Start a Chat', subtitle: 'Chat with our AI assistant', action: 'start_chat' },
      { icon: 'help', title: 'Help Articles', subtitle: 'Browse our knowledge base', action: 'open_help' }
    ]).map((qa: any) => ({
      id: qa.id || qa.action,
      label: qa.title || qa.label, // Support both label and title
      title: qa.title || qa.label, // Support both label and title
      subtitle: qa.subtitle || '',
      icon: qa.icon,
      action: qa.action,
      actionType: qa.action
    }));

    // Return flat config structure
    const response = {
      // Core IDs
      agentId: agentId,
      userId: '', // Empty for public widget access
      
      // Agent info
      agentName: agent.name,
      avatarUrl: embeddedChatConfig.avatarUrl || null,
      
      // Appearance
      primaryColor: embeddedChatConfig.primaryColor || '#6366f1',
      gradientStartColor: embeddedChatConfig.gradientStartColor || '#6366f1',
      gradientEndColor: embeddedChatConfig.gradientEndColor || '#8b5cf6',
      position: embeddedChatConfig.position || 'bottom-right',
      animation: embeddedChatConfig.animation || 'bounce',
      buttonAnimation: embeddedChatConfig.animation || 'bounce', // Alias for animation
      useGradientHeader: embeddedChatConfig.useGradientHeader !== false,
      
      // Team avatars
      showTeamAvatars: embeddedChatConfig.showTeamAvatars || false,
      teamAvatarUrls: embeddedChatConfig.teamAvatarUrls || [],
      
      // Welcome
      welcomeEmoji: embeddedChatConfig.welcomeEmoji || '👋',
      welcomeTitle: embeddedChatConfig.welcomeTitle || 'Hi there!',
      welcomeSubtitle: embeddedChatConfig.welcomeSubtitle || 'How can we help you today?',
      
      // Messages
      greeting: embeddedChatConfig.greeting || 'Hello! How can I help you today?',
      placeholder: embeddedChatConfig.placeholder || 'Type your message...',
      showReadReceipts: embeddedChatConfig.showReadReceipts || false,
      
      // Features
      enableContactForm: embeddedChatConfig.enableContactForm || false,
      contactFormTitle: embeddedChatConfig.contactFormTitle || 'Get in touch',
      contactFormSubtitle: embeddedChatConfig.contactFormSubtitle || 'Fill out the form below to start chatting',
      customFields: embeddedChatConfig.customFields || [],
      
      enableFileAttachments: true, // Always enabled for widget
      allowedFileTypes: embeddedChatConfig.allowedFileTypes || ['image/*', 'application/pdf'],
      
      enableVoiceMessages: true, // Always enabled for widget
      enableMessageReactions: true, // Always enabled for widget
      
      // Navigation
      showBottomNav: embeddedChatConfig.showBottomNav !== false,
      enableHomeTab: true, // Always enabled for widget
      enableMessagesTab: embeddedChatConfig.enableMessagesTab !== false,
      enableHelpTab: embeddedChatConfig.enableHelpTab !== false,
      enableNewsTab: enableNewsTab,
      quickActions: quickActions,
      
      // Branding
      showBranding: embeddedChatConfig.showBranding !== false,
      
      // Data
      announcements: announcements || [],
      helpArticles: articles || [],
      helpCategories: categories || [],
      newsItems: (newsItems || []).map(item => ({
        id: item.id,
        title: item.title,
        body: item.body,
        featured_image_url: item.featured_image_url,
        author_name: item.author_name,
        author_avatar: item.author_avatar,
        published_at: item.published_at,
        cta_primary_label: item.cta_primary_label,
        cta_primary_url: item.cta_primary_url,
        cta_secondary_label: item.cta_secondary_label,
        cta_secondary_url: item.cta_secondary_url,
      })),
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
