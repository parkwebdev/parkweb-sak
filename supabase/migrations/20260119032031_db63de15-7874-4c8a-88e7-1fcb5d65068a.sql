-- Fix HTML structure in Help Center articles
-- Step-by-step and feature-card components need child elements, not just data attributes

-- Fix quick-start article (5 steps)
UPDATE platform_hc_articles 
SET content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          content,
          '<div data-step data-step-number="1" data-step-title="Configure Ari" data-step-description="Set up your AI agent''s personality and system prompt in the Ari section."></div>',
          '<div data-step data-step-number="1"><h4>Configure Ari</h4><p>Set up your AI agent''s personality and system prompt in the Ari section.</p></div>'
        ),
        '<div data-step data-step-number="2" data-step-title="Add Knowledge Sources" data-step-description="Give Ari information about your business by adding website URLs, documents, or text."></div>',
        '<div data-step data-step-number="2"><h4>Add Knowledge Sources</h4><p>Give Ari information about your business by adding website URLs, documents, or text.</p></div>'
      ),
      '<div data-step data-step-number="3" data-step-title="Customize Appearance" data-step-description="Match the chat widget to your brand with custom colors and welcome messages."></div>',
      '<div data-step data-step-number="3"><h4>Customize Appearance</h4><p>Match the chat widget to your brand with custom colors and welcome messages.</p></div>'
    ),
    '<div data-step data-step-number="4" data-step-title="Install the Widget" data-step-description="Copy the embed code and add it to your website to go live."></div>',
    '<div data-step data-step-number="4"><h4>Install the Widget</h4><p>Copy the embed code and add it to your website to go live.</p></div>'
  ),
  '<div data-step data-step-number="5" data-step-title="Monitor & Improve" data-step-description="Review conversations and analytics to continuously improve Ari''s performance."></div>',
  '<div data-step data-step-number="5"><h4>Monitor & Improve</h4><p>Review conversations and analytics to continuously improve Ari''s performance.</p></div>'
)
WHERE slug = 'quick-start';

-- Fix Understanding Ari article (feature cards)
UPDATE platform_hc_articles 
SET content = REPLACE(
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
WHERE slug = 'overview' AND category_id = (SELECT id FROM platform_hc_categories WHERE slug = 'ari');

-- Fix Welcome to Pilot article (feature cards)
UPDATE platform_hc_articles 
SET content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          content,
          '<div data-feature-card data-title="AI Agent (Ari)" data-description="Your always-on assistant that learns from your knowledge base and engages visitors naturally." data-icon="Cpu"></div>',
          '<div data-feature-card data-icon="Cpu"><h4>AI Agent (Ari)</h4><p>Your always-on assistant that learns from your knowledge base and engages visitors naturally.</p></div>'
        ),
        '<div data-feature-card data-title="Lead Management" data-description="Capture, organize, and track leads through customizable pipeline stages." data-icon="Users01"></div>',
        '<div data-feature-card data-icon="Users01"><h4>Lead Management</h4><p>Capture, organize, and track leads through customizable pipeline stages.</p></div>'
      ),
      '<div data-feature-card data-title="Appointment Scheduling" data-description="Let visitors book appointments directly through the chat with calendar integration." data-icon="Calendar"></div>',
      '<div data-feature-card data-icon="Calendar"><h4>Appointment Scheduling</h4><p>Let visitors book appointments directly through the chat with calendar integration.</p></div>'
    ),
    '<div data-feature-card data-title="Unified Inbox" data-description="Manage all conversations in one place with easy human takeover when needed." data-icon="Mail01"></div>',
    '<div data-feature-card data-icon="Mail01"><h4>Unified Inbox</h4><p>Manage all conversations in one place with easy human takeover when needed.</p></div>'
  ),
  '<div data-feature-card data-title="Analytics & Insights" data-description="Track performance, understand visitor behavior, and generate reports." data-icon="BarChart07"></div>',
  '<div data-feature-card data-icon="BarChart07"><h4>Analytics & Insights</h4><p>Track performance, understand visitor behavior, and generate reports.</p></div>'
)
WHERE slug = 'welcome';