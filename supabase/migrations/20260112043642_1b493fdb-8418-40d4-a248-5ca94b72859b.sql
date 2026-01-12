-- Seed existing platform KB articles from knowledge-base-config.ts
-- Content will need to be added via the admin editor

-- Getting Started
INSERT INTO platform_kb_articles (category_id, slug, title, description, order_index, content, is_published) VALUES
  ('getting-started', 'welcome', 'Welcome to Pilot', 'An introduction to the Pilot platform and what you can do with it.', 0, '<p>Welcome to Pilot! This article will help you get started.</p>', true),
  ('getting-started', 'quick-start', 'Quick Start Guide', 'Get up and running with Pilot in just a few minutes.', 1, '<p>Follow these steps to get started quickly.</p>', true),
  ('getting-started', 'navigation', 'Navigating the App', 'Learn how to navigate around Pilot efficiently.', 2, '<p>Learn the basics of navigating the app.</p>', true),
  ('getting-started', 'dashboard', 'Dashboard Overview', 'Your command center after completing setup.', 3, '<p>The dashboard is your central hub for managing everything.</p>', true);

-- Ari (AI Agent)
INSERT INTO platform_kb_articles (category_id, slug, title, description, order_index, content, is_published) VALUES
  ('ari', 'overview', 'Understanding Ari', 'Learn what Ari is and how it can help your business.', 0, '<p>Ari is your AI-powered assistant.</p>', true),
  ('ari', 'system-prompt', 'Writing a System Prompt', 'Define Ari''s personality and guidelines.', 1, '<p>The system prompt defines how Ari behaves.</p>', true),
  ('ari', 'appearance', 'Customizing Appearance', 'Make the chat widget match your brand.', 2, '<p>Customize the look and feel of your widget.</p>', true),
  ('ari', 'welcome-messages', 'Welcome & Messages', 'Configure greetings and quick actions.', 3, '<p>Set up welcoming messages for visitors.</p>', true),
  ('ari', 'lead-capture', 'Lead Capture', 'Collect visitor information during conversations.', 4, '<p>Capture leads automatically through conversations.</p>', true),
  ('ari', 'knowledge-sources', 'Adding Knowledge Sources', 'Teach Ari about your business with knowledge sources.', 5, '<p>Add knowledge sources to make Ari smarter.</p>', true),
  ('ari', 'locations', 'Managing Locations', 'Configure multiple business locations.', 6, '<p>Set up and manage your business locations.</p>', true),
  ('ari', 'help-articles', 'Help Articles', 'Create self-service content for visitors.', 7, '<p>Create help articles for your visitors.</p>', true),
  ('ari', 'announcements', 'Announcements', 'Display promotional banners in the widget.', 8, '<p>Create announcements to highlight important information.</p>', true),
  ('ari', 'news', 'News', 'Share updates and stories with visitors.', 9, '<p>Share news and updates with your visitors.</p>', true),
  ('ari', 'custom-tools', 'Custom Tools', 'Extend Ari with custom API integrations.', 10, '<p>Create custom tools to extend Ari''s capabilities.</p>', true),
  ('ari', 'webhooks', 'Webhooks', 'Send real-time notifications to external systems.', 11, '<p>Set up webhooks for real-time integrations.</p>', true),
  ('ari', 'integrations', 'Integrations', 'Connect to calendars, CRMs, and more.', 12, '<p>Connect Ari to your favorite tools.</p>', true),
  ('ari', 'api-access', 'API Access', 'Use the API for custom integrations.', 13, '<p>Access the API for custom development.</p>', true),
  ('ari', 'installation', 'Installing the Widget', 'Add Ari to your website in minutes.', 14, '<p>Install the widget on your website.</p>', true);

-- Inbox
INSERT INTO platform_kb_articles (category_id, slug, title, description, order_index, content, is_published) VALUES
  ('inbox', 'overview', 'Managing Conversations', 'View and manage all conversations with your visitors.', 0, '<p>Manage all your conversations in one place.</p>', true),
  ('inbox', 'takeover', 'Human Takeover', 'Take over conversations from Ari when needed.', 1, '<p>Take control of conversations when Ari needs help.</p>', true);

-- Leads
INSERT INTO platform_kb_articles (category_id, slug, title, description, order_index, content, is_published) VALUES
  ('leads', 'overview', 'Lead Management', 'Capture and manage leads from conversations.', 0, '<p>Manage your leads effectively.</p>', true),
  ('leads', 'stages', 'Lead Stages', 'Organize leads with customizable stages.', 1, '<p>Organize leads with custom pipeline stages.</p>', true);

-- Planner
INSERT INTO platform_kb_articles (category_id, slug, title, description, order_index, content, is_published) VALUES
  ('planner', 'overview', 'Using the Planner', 'Schedule and manage bookings with the Planner.', 0, '<p>Schedule and manage all your bookings.</p>', true);

-- Analytics
INSERT INTO platform_kb_articles (category_id, slug, title, description, order_index, content, is_published) VALUES
  ('analytics', 'overview', 'Understanding Your Data', 'Gain insights from your conversation analytics.', 0, '<p>Analyze your conversation data.</p>', true),
  ('analytics', 'report-builder', 'Report Builder', 'Create and schedule custom reports.', 1, '<p>Build custom reports for your needs.</p>', true);

-- Settings
INSERT INTO platform_kb_articles (category_id, slug, title, description, order_index, content, is_published) VALUES
  ('settings', 'general', 'General Settings', 'Configure organization information and preferences.', 0, '<p>Configure your organization settings.</p>', true),
  ('settings', 'profile', 'Profile Settings', 'Manage your personal profile information.', 1, '<p>Update your personal profile.</p>', true),
  ('settings', 'team', 'Managing Your Team', 'Invite team members and manage roles.', 2, '<p>Invite and manage team members.</p>', true),
  ('settings', 'billing', 'Billing & Subscription', 'Manage your subscription and billing.', 3, '<p>Manage your billing and subscription.</p>', true),
  ('settings', 'usage', 'Usage Metrics', 'Monitor your conversation and API usage.', 4, '<p>Track your usage metrics.</p>', true),
  ('settings', 'notifications', 'Notification Preferences', 'Control how and when you receive notifications.', 5, '<p>Configure your notification settings.</p>', true),
  ('settings', 'sessions', 'Active Sessions', 'Manage your active login sessions.', 6, '<p>View and manage your active sessions.</p>', true);