-- Fix stages article
UPDATE platform_hc_articles SET content = 
  REPLACE(REPLACE(REPLACE(REPLACE(content,
    '<div data-step data-step-number="1" data-step-title="Open the Manage Stages Dialog" data-step-description="Navigate to Leads and click Manage Stages in the toolbar."></div>',
    '<div data-step data-step-number="1"><h4>Open the Manage Stages Dialog</h4><p>Navigate to Leads and click Manage Stages in the toolbar.</p></div>'),
    '<div data-step data-step-number="2" data-step-title="Add a New Stage" data-step-description="Click Add Stage, enter a name, and choose a color."></div>',
    '<div data-step data-step-number="2"><h4>Add a New Stage</h4><p>Click Add Stage, enter a name, and choose a color.</p></div>'),
    '<div data-step data-step-number="3" data-step-title="Set a Default Stage" data-step-description="Click the star icon next to a stage to make it the default for new leads."></div>',
    '<div data-step data-step-number="3"><h4>Set a Default Stage</h4><p>Click the star icon next to a stage to make it the default for new leads.</p></div>'),
    '<div data-step data-step-number="4" data-step-title="Reorder Stages" data-step-description="Drag and drop stages to change their order in the pipeline."></div>',
    '<div data-step data-step-number="4"><h4>Reorder Stages</h4><p>Drag and drop stages to change their order in the pipeline.</p></div>')
WHERE slug = 'stages';

-- Fix team article
UPDATE platform_hc_articles SET content = 
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(content,
    '<div data-step data-step-number="1" data-step-title="Go to Team Settings" data-step-description="Navigate to Settings → Team from the sidebar."></div>',
    '<div data-step data-step-number="1"><h4>Go to Team Settings</h4><p>Navigate to Settings → Team from the sidebar.</p></div>'),
    '<div data-step data-step-number="2" data-step-title="Click Invite Member" data-step-description="Click the Invite Member button in the top right."></div>',
    '<div data-step data-step-number="2"><h4>Click Invite Member</h4><p>Click the Invite Member button in the top right.</p></div>'),
    '<div data-step data-step-number="3" data-step-title="Enter Email Address" data-step-description="Enter the email address of the person you want to invite."></div>',
    '<div data-step data-step-number="3"><h4>Enter Email Address</h4><p>Enter the email address of the person you want to invite.</p></div>'),
    '<div data-step data-step-number="4" data-step-title="Select Role" data-step-description="Choose the appropriate role for the new team member."></div>',
    '<div data-step data-step-number="4"><h4>Select Role</h4><p>Choose the appropriate role for the new team member.</p></div>'),
    '<div data-step data-step-number="5" data-step-title="Send Invitation" data-step-description="Click Send Invite. They''ll receive an email with instructions."></div>',
    '<div data-step data-step-number="5"><h4>Send Invitation</h4><p>Click Send Invite. They''ll receive an email with instructions.</p></div>')
WHERE slug = 'team';

-- Fix welcome article feature cards
UPDATE platform_hc_articles SET content = 
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(content,
    '<div data-feature-card data-title="AI Agent (Ari)" data-description="Your always-on assistant that learns from your knowledge base to provide accurate, helpful responses." data-icon="MessageChatCircle"></div>',
    '<div data-feature-card data-icon="MessageChatCircle"><h4>AI Agent (Ari)</h4><p>Your always-on assistant that learns from your knowledge base to provide accurate, helpful responses.</p></div>'),
    '<div data-feature-card data-title="Unified Inbox" data-description="All conversations flow into a single inbox where you can monitor, take over, or review interactions." data-icon="MessageSquare01"></div>',
    '<div data-feature-card data-icon="MessageSquare01"><h4>Unified Inbox</h4><p>All conversations flow into a single inbox where you can monitor, take over, or review interactions.</p></div>'),
    '<div data-feature-card data-title="Lead Management" data-description="Automatically capture visitor information and organize leads through customizable stages." data-icon="Users01"></div>',
    '<div data-feature-card data-icon="Users01"><h4>Lead Management</h4><p>Automatically capture visitor information and organize leads through customizable stages.</p></div>'),
    '<div data-feature-card data-title="Planner & Bookings" data-description="Let Ari schedule appointments directly into your calendar with Google Calendar integration." data-icon="Calendar"></div>',
    '<div data-feature-card data-icon="Calendar"><h4>Planner & Bookings</h4><p>Let Ari schedule appointments directly into your calendar with Google Calendar integration.</p></div>'),
    '<div data-feature-card data-title="Analytics & Insights" data-description="Understand how your AI is performing with detailed metrics on conversations and satisfaction." data-icon="BarChart07"></div>',
    '<div data-feature-card data-icon="BarChart07"><h4>Analytics & Insights</h4><p>Understand how your AI is performing with detailed metrics on conversations and satisfaction.</p></div>')
WHERE slug = 'welcome';