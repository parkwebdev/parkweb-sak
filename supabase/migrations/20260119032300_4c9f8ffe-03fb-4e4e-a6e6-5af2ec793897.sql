-- Fix Understanding Ari article - feature cards (correct content)
UPDATE platform_hc_articles SET content = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          content,
          '<div data-feature-card data-title="Answer Questions" data-description="Using your knowledge base, Ari provides natural, conversational responses about your products, services, and policies." data-icon="MessageTextCircle01"></div>',
          '<div data-feature-card data-icon="MessageTextCircle01"><h4>Answer Questions</h4><p>Using your knowledge base, Ari provides natural, conversational responses about your products, services, and policies.</p></div>'
        ),
        '<div data-feature-card data-title="Capture Leads" data-description="Ari collects visitor information like name, email, and phone, automatically creating leads in your CRM." data-icon="Users01"></div>',
        '<div data-feature-card data-icon="Users01"><h4>Capture Leads</h4><p>Ari collects visitor information like name, email, and phone, automatically creating leads in your CRM.</p></div>'
      ),
      '<div data-feature-card data-title="Schedule Appointments" data-description="When integrated with your calendar, Ari checks availability and books appointments during conversations." data-icon="Calendar"></div>',
      '<div data-feature-card data-icon="Calendar"><h4>Schedule Appointments</h4><p>When integrated with your calendar, Ari checks availability and books appointments during conversations.</p></div>'
    ),
    '<div data-feature-card data-title="Hand Off to Humans" data-description="For complex issues, Ari seamlessly transfers conversations to your team with full context." data-icon="Repeat04"></div>',
    '<div data-feature-card data-icon="Repeat04"><h4>Hand Off to Humans</h4><p>For complex issues, Ari seamlessly transfers conversations to your team with full context.</p></div>'
  )
WHERE slug = 'overview' AND content LIKE '%MessageTextCircle01%';

-- Fix Welcome to Pilot article - feature cards (correct content)
UPDATE platform_hc_articles SET content = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            content,
            '<div data-feature-card data-title="AI Agent (Ari)" data-description="Your always-on assistant that learns from your knowledge base to provide accurate, helpful responses." data-icon="MessageChatCircle"></div>',
            '<div data-feature-card data-icon="MessageChatCircle"><h4>AI Agent (Ari)</h4><p>Your always-on assistant that learns from your knowledge base to provide accurate, helpful responses.</p></div>'
          ),
          '<div data-feature-card data-title="Unified Inbox" data-description="All conversations flow into a single inbox where you can monitor, take over, or review interactions." data-icon="MessageSquare01"></div>',
          '<div data-feature-card data-icon="MessageSquare01"><h4>Unified Inbox</h4><p>All conversations flow into a single inbox where you can monitor, take over, or review interactions.</p></div>'
        ),
        '<div data-feature-card data-title="Lead Management" data-description="Automatically capture visitor information and organize leads through customizable stages." data-icon="Users01"></div>',
        '<div data-feature-card data-icon="Users01"><h4>Lead Management</h4><p>Automatically capture visitor information and organize leads through customizable stages.</p></div>'
      ),
      '<div data-feature-card data-title="Planner & Bookings" data-description="Let Ari schedule appointments directly into your calendar with Google Calendar integration." data-icon="Calendar"></div>',
      '<div data-feature-card data-icon="Calendar"><h4>Planner & Bookings</h4><p>Let Ari schedule appointments directly into your calendar with Google Calendar integration.</p></div>'
    ),
    '<div data-feature-card data-title="Analytics & Insights" data-description="Understand how your AI is performing with detailed metrics on conversations and satisfaction." data-icon="BarChart07"></div>',
    '<div data-feature-card data-icon="BarChart07"><h4>Analytics & Insights</h4><p>Understand how your AI is performing with detailed metrics on conversations and satisfaction.</p></div>'
  )
WHERE slug = 'welcome';