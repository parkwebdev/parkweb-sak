-- Fix webhooks article (5 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            content,
            '<div data-step data-step-number="1" data-step-title="Navigate to Ari → Webhooks" data-step-description="Open the Ari configurator and select Webhooks."></div>',
            '<div data-step data-step-number="1"><h4>Navigate to Ari → Webhooks</h4><p>Open the Ari configurator and select Webhooks.</p></div>',
            'g'
          ),
          '<div data-step data-step-number="2" data-step-title="Click Add Webhook" data-step-description="Click the Add Webhook button."></div>',
          '<div data-step data-step-number="2"><h4>Click Add Webhook</h4><p>Click the Add Webhook button.</p></div>',
          'g'
        ),
        '<div data-step data-step-number="3" data-step-title="Enter Webhook Details" data-step-description="Provide name, endpoint URL, and select events."></div>',
        '<div data-step data-step-number="3"><h4>Enter Webhook Details</h4><p>Provide name, endpoint URL, and select events.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="4" data-step-title="Configure Authentication" data-step-description="Add required headers for your endpoint."></div>',
      '<div data-step data-step-number="4"><h4>Configure Authentication</h4><p>Add required headers for your endpoint.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="5" data-step-title="Save and Activate" data-step-description="Save the webhook and toggle it on."></div>',
    '<div data-step data-step-number="5"><h4>Save and Activate</h4><p>Save the webhook and toggle it on.</p></div>',
    'g'
  )
WHERE slug = 'webhooks';

-- Fix integrations article (5 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            content,
            '<div data-step data-step-number="1" data-step-title="Navigate to Ari → Integrations" data-step-description="Open the Integrations section."></div>',
            '<div data-step data-step-number="1"><h4>Navigate to Ari → Integrations</h4><p>Open the Integrations section.</p></div>',
            'g'
          ),
          '<div data-step data-step-number="2" data-step-title="Find Your Integration" data-step-description="Browse available integrations."></div>',
          '<div data-step data-step-number="2"><h4>Find Your Integration</h4><p>Browse available integrations.</p></div>',
          'g'
        ),
        '<div data-step data-step-number="3" data-step-title="Click Connect" data-step-description="Click the Connect button."></div>',
        '<div data-step data-step-number="3"><h4>Click Connect</h4><p>Click the Connect button.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="4" data-step-title="Authenticate" data-step-description="Follow prompts to authorize."></div>',
      '<div data-step data-step-number="4"><h4>Authenticate</h4><p>Follow prompts to authorize.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="5" data-step-title="Configure Settings" data-step-description="Set up sync preferences."></div>',
    '<div data-step data-step-number="5"><h4>Configure Settings</h4><p>Set up sync preferences.</p></div>',
    'g'
  )
WHERE slug = 'integrations';

-- Fix news article (needs to check content first)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        content,
        '<div data-step data-step-number="1" data-step-title="Navigate to Ari → News" data-step-description="Open the Ari configurator and select the News section."></div>',
        '<div data-step data-step-number="1"><h4>Navigate to Ari → News</h4><p>Open the Ari configurator and select the News section.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="2" data-step-title="Click Add News Item" data-step-description="Click the Add News Item button."></div>',
      '<div data-step data-step-number="2"><h4>Click Add News Item</h4><p>Click the Add News Item button.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="3" data-step-title="Complete the Form" data-step-description="Add title, body content, author info, and optional image."></div>',
    '<div data-step data-step-number="3"><h4>Complete the Form</h4><p>Add title, body content, author info, and optional image.</p></div>',
    'g'
  )
WHERE slug = 'news';

-- Fix stages (Lead Stages) article (4 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          content,
          '<div data-step data-step-number="1" data-step-title="Open the Manage Stages dialog" data-step-description="Navigate to Leads and click Manage Stages."></div>',
          '<div data-step data-step-number="1"><h4>Open the Manage Stages dialog</h4><p>Navigate to Leads and click Manage Stages.</p></div>',
          'g'
        ),
        '<div data-step data-step-number="2" data-step-title="Add a new stage" data-step-description="Click Add Stage, enter a name and choose a color."></div>',
        '<div data-step data-step-number="2"><h4>Add a new stage</h4><p>Click Add Stage, enter a name and choose a color.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="3" data-step-title="Set a default stage" data-step-description="Click the star icon to set default for new leads."></div>',
      '<div data-step data-step-number="3"><h4>Set a default stage</h4><p>Click the star icon to set default for new leads.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="4" data-step-title="Reorder stages" data-step-description="Drag and drop to change order."></div>',
    '<div data-step data-step-number="4"><h4>Reorder stages</h4><p>Drag and drop to change order.</p></div>',
    'g'
  )
WHERE slug = 'stages';

-- Fix report-builder article (3 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        content,
        '<div data-step data-step-number="1" data-step-title="Open Analytics" data-step-description="Navigate to Analytics from the sidebar."></div>',
        '<div data-step data-step-number="1"><h4>Open Analytics</h4><p>Navigate to Analytics from the sidebar.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="2" data-step-title="Go to Reports Tab" data-step-description="Click the Reports tab."></div>',
      '<div data-step data-step-number="2"><h4>Go to Reports Tab</h4><p>Click the Reports tab.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="3" data-step-title="Click Build Report" data-step-description="Click Build Report to open configuration."></div>',
    '<div data-step data-step-number="3"><h4>Click Build Report</h4><p>Click Build Report to open configuration.</p></div>',
    'g'
  )
WHERE slug = 'report-builder';