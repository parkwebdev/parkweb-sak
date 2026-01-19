-- Seed all Platform Help Center articles with canonical content
-- This ensures 1:1 parity between user-facing Help Center and Super Admin editor

-- First, ensure we have proper categories (upsert to avoid duplicates)
INSERT INTO platform_hc_categories (id, label, color, icon_name, order_index)
VALUES 
  ('getting-started', 'Getting Started', 'bg-info', 'Rocket01', 0),
  ('ari', 'Ari', 'bg-accent-purple', 'Bot', 1),
  ('inbox', 'Inbox', 'bg-warning', 'Inbox01', 2),
  ('leads', 'Leads', 'bg-success', 'Users01', 3),
  ('planner', 'Planner', 'bg-chart-1', 'Calendar', 4),
  ('analytics', 'Analytics', 'bg-chart-2', 'BarChart01', 5),
  ('settings', 'Settings', 'bg-muted', 'Settings01', 6)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  color = EXCLUDED.color,
  icon_name = EXCLUDED.icon_name,
  order_index = EXCLUDED.order_index;

-- Getting Started: Welcome Article
INSERT INTO platform_hc_articles (category_id, slug, title, description, content, order_index, is_published)
VALUES (
  'getting-started',
  'welcome',
  'Welcome to Pilot',
  'Get started with Pilot, your AI-powered customer engagement platform.',
  '<p>Welcome to <strong>Pilot</strong>, your AI-powered customer engagement platform. Pilot helps businesses automate conversations, capture leads, and provide instant support through an intelligent chat widget.</p>

<h2 id="what-is-pilot">What is Pilot?</h2>
<p>Pilot is a platform that lets you deploy an AI assistant called <strong>Ari</strong> on your website. Ari can:</p>
<ul>
<li>Answer questions about your business using your knowledge base</li>
<li>Capture visitor information and create leads</li>
<li>Schedule appointments and bookings</li>
<li>Hand off complex conversations to your team</li>
</ul>

<h2 id="key-features">Key Features</h2>
<ul>
<li><strong>AI-Powered Conversations:</strong> Ari uses advanced language models to understand and respond naturally</li>
<li><strong>Knowledge Base:</strong> Train Ari with your website, documents, and custom content</li>
<li><strong>Lead Capture:</strong> Collect visitor information with customizable forms</li>
<li><strong>Appointment Scheduling:</strong> Connect your calendar for automated booking</li>
<li><strong>Multi-Location Support:</strong> Configure different settings for each business location</li>
<li><strong>Analytics:</strong> Track performance and optimize your conversations</li>
</ul>

<div data-callout data-callout-type="tip">Ready to get started? Head to the Quick Start Guide to set up your first AI agent in minutes.</div>

<h2 id="next-steps">Next Steps</h2>
<ol>
<li><strong>Configure Ari:</strong> Set up your AI agent''s personality and knowledge</li>
<li><strong>Add Knowledge:</strong> Give Ari information about your business</li>
<li><strong>Customize Appearance:</strong> Match the widget to your brand</li>
<li><strong>Install Widget:</strong> Add the chat widget to your website</li>
<li><strong>Go Live:</strong> Start engaging with visitors</li>
</ol>

<div data-related-articles data-articles=''[{"categoryId":"getting-started","articleSlug":"quick-start","title":"Quick Start Guide"},{"categoryId":"ari","articleSlug":"overview","title":"Understanding Ari"}]''></div>',
  0,
  true
)
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;

-- Getting Started: Quick Start Guide
INSERT INTO platform_hc_articles (category_id, slug, title, description, content, order_index, is_published)
VALUES (
  'getting-started',
  'quick-start',
  'Quick Start Guide',
  'Get up and running with Pilot in just a few minutes.',
  '<p>This guide will walk you through setting up Pilot and getting your AI agent live on your website in just a few minutes.</p>

<h2 id="setup-overview">Setup Overview</h2>
<div data-stepbystep>
<div data-step data-step-number="1"><h4>Configure Ari</h4><p>Set up your AI agent''s personality and system prompt in the Ari section.</p></div>
<div data-step data-step-number="2"><h4>Add Knowledge Sources</h4><p>Give Ari information about your business by adding website URLs, documents, or text.</p></div>
<div data-step data-step-number="3"><h4>Customize Appearance</h4><p>Match the chat widget to your brand with custom colors and welcome messages.</p></div>
<div data-step data-step-number="4"><h4>Install the Widget</h4><p>Copy the embed code and add it to your website to go live.</p></div>
<div data-step data-step-number="5"><h4>Monitor &amp; Improve</h4><p>Review conversations and analytics to continuously improve Ari''s performance.</p></div>
</div>

<h2 id="step-1-configure-ari">Step 1: Configure Ari</h2>
<p>Navigate to the <strong>Ari</strong> section in the sidebar to access your AI agent''s configuration. Here you can customize:</p>
<ul>
<li><strong>System Prompt</strong> – Define Ari''s personality and instructions</li>
<li><strong>Appearance</strong> – Customize colors and branding</li>
<li><strong>Welcome Messages</strong> – Set up greeting messages and quick actions</li>
<li><strong>Lead Capture</strong> – Configure contact forms to collect visitor info</li>
</ul>

<div data-callout data-callout-type="tip">Start with the default settings and refine them as you learn how visitors interact with Ari.</div>

<h2 id="step-2-add-knowledge">Step 2: Add Knowledge Sources</h2>
<p>Ari''s intelligence comes from your knowledge base. Add sources so Ari can answer questions about your business:</p>
<ol>
<li>Go to <strong>Ari → Knowledge</strong></li>
<li>Click <strong>Add Knowledge Source</strong></li>
<li>Choose from website URLs, documents, or manual text entry</li>
<li>Wait for Pilot to process and index your content</li>
</ol>

<div data-callout data-callout-type="info">The more relevant knowledge you provide, the better Ari can assist your visitors.</div>

<h2 id="step-3-customize-appearance">Step 3: Customize Appearance</h2>
<p>Make the chat widget feel like part of your brand:</p>
<ul>
<li>Enable <strong>gradient header</strong> for a modern look</li>
<li>Set your <strong>primary and secondary brand colors</strong></li>
<li>Write a friendly <strong>welcome message</strong></li>
<li>Configure <strong>bottom navigation tabs</strong> (Messages, News, Help)</li>
</ul>

<h2 id="step-4-install-widget">Step 4: Install the Widget</h2>
<p>Once you''re happy with your configuration, it''s time to go live:</p>
<ol>
<li>Navigate to <strong>Ari → Installation</strong></li>
<li>Copy the embed code snippet</li>
<li>Paste it into your website''s HTML, just before the closing <code>&lt;/body&gt;</code> tag</li>
<li>Publish your website changes</li>
</ol>

<div data-callout data-callout-type="warning">Make sure to test the widget on your staging environment before pushing to production.</div>

<h2 id="step-5-monitor-and-improve">Step 5: Monitor and Improve</h2>
<p>After launch, use these tools to optimize Ari''s performance:</p>
<ul>
<li><strong>Inbox</strong> – Review conversations and identify common questions</li>
<li><strong>Analytics</strong> – Track response quality and visitor engagement</li>
<li><strong>Knowledge</strong> – Add more content to fill gaps in Ari''s knowledge</li>
</ul>

<h2 id="next-steps">You''re Ready!</h2>
<p>Congratulations! Your AI agent is now live and ready to help your visitors. Continue exploring the help center to learn about advanced features like lead capture, human takeover, and custom integrations.</p>

<div data-related-articles data-articles=''[{"categoryId":"getting-started","articleSlug":"welcome","title":"Welcome to Pilot"},{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Knowledge Sources"},{"categoryId":"ari","articleSlug":"installation","title":"Installing the Widget"}]''></div>',
  1,
  true
)
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;

-- Getting Started: Navigation
INSERT INTO platform_hc_articles (category_id, slug, title, description, content, order_index, is_published)
VALUES (
  'getting-started',
  'navigation',
  'Navigating the App',
  'Learn how to navigate around Pilot efficiently.',
  '<p>Pilot is designed to be intuitive and easy to navigate. This guide will help you find your way around the platform quickly.</p>

<h2 id="sidebar-navigation">Sidebar Navigation</h2>
<p>The main navigation is located in the left sidebar. It provides quick access to all major sections of Pilot:</p>
<ul>
<li><strong>Ari</strong> – Configure and manage your AI agent</li>
<li><strong>Inbox</strong> – View and manage all conversations</li>
<li><strong>Planner</strong> – Calendar and booking management</li>
<li><strong>Leads</strong> – Track and organize captured leads</li>
<li><strong>Analytics</strong> – Insights and performance metrics</li>
<li><strong>Help Center</strong> – Documentation and help articles (you''re here!)</li>
<li><strong>Settings</strong> – Organization and account settings</li>
<li><strong>Dashboard</strong> – Your command center (visible after completing setup)</li>
</ul>

<div data-callout data-callout-type="tip">The sidebar automatically collapses when you move your mouse away, giving you more screen space. Hover over it to expand.</div>

<h2 id="global-search">Global Search</h2>
<p>Press <kbd>⌘K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows) to open the global search. From here you can:</p>
<ul>
<li>Search for conversations by visitor name or content</li>
<li>Find leads quickly</li>
<li>Navigate to any section of the app</li>
<li>Jump to Ari configuration sections</li>
<li>Access settings and preferences</li>
<li>Search documentation articles</li>
</ul>

<h2 id="keyboard-shortcuts">Keyboard Shortcuts</h2>
<p>Power users can navigate faster with these keyboard shortcuts:</p>
<table>
<thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
<tbody>
<tr><td><kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd></td><td>Open global search</td></tr>
<tr><td><kbd>⌥A</kbd> / <kbd>Alt+A</kbd></td><td>Go to Ari configuration</td></tr>
<tr><td><kbd>⌥C</kbd> / <kbd>Alt+C</kbd></td><td>Go to Inbox (Conversations)</td></tr>
<tr><td><kbd>⌥P</kbd> / <kbd>Alt+P</kbd></td><td>Go to Planner</td></tr>
<tr><td><kbd>⌥L</kbd> / <kbd>Alt+L</kbd></td><td>Go to Leads</td></tr>
<tr><td><kbd>⌥Y</kbd> / <kbd>Alt+Y</kbd></td><td>Go to Analytics</td></tr>
<tr><td><kbd>⌥H</kbd> / <kbd>Alt+H</kbd></td><td>Go to Help Center</td></tr>
<tr><td><kbd>⌥S</kbd> / <kbd>Alt+S</kbd></td><td>Go to Settings</td></tr>
</tbody>
</table>

<h2 id="settings-menu">Settings &amp; Account</h2>
<p>Click the Settings icon in the bottom of the sidebar (or press <kbd>⌥S</kbd>) to access:</p>
<ul>
<li><strong>General</strong> – Organization name and branding</li>
<li><strong>Profile</strong> – Update your personal information</li>
<li><strong>Team</strong> – Invite and manage team members</li>
<li><strong>Billing</strong> – Manage your subscription and payments</li>
<li><strong>Usage</strong> – View usage metrics and limits</li>
<li><strong>Notifications</strong> – Configure alert preferences</li>
<li><strong>Sessions</strong> – Manage active login sessions</li>
</ul>

<p>Click your profile avatar in the sidebar to access your profile menu, switch themes, or sign out.</p>

<h2 id="mobile-access">Mobile Access</h2>
<p>Pilot is fully responsive and works on mobile devices. The sidebar becomes a slide-out menu on smaller screens, and all features remain accessible.</p>

<div data-callout data-callout-type="info">For the best experience on mobile, consider adding Pilot to your home screen as a Progressive Web App (PWA). This gives you a native app-like experience with quick access from your device.</div>

<div data-related-articles data-articles=''[{"categoryId":"getting-started","articleSlug":"welcome","title":"Welcome to Pilot"},{"categoryId":"getting-started","articleSlug":"quick-start","title":"Quick Start Guide"},{"categoryId":"getting-started","articleSlug":"dashboard","title":"Dashboard Overview"}]''></div>',
  2,
  true
)
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;

-- Getting Started: Dashboard Overview
INSERT INTO platform_hc_articles (category_id, slug, title, description, content, order_index, is_published)
VALUES (
  'getting-started',
  'dashboard',
  'Dashboard Overview',
  'Your command center after completing initial setup.',
  '<p>The Dashboard is your command center after completing initial setup. It provides a quick overview of your Ari deployment status and key actions.</p>

<div data-callout data-callout-type="info">The Dashboard is only visible to account administrators after completing the initial setup checklist. Team members will see the Inbox as their default view.</div>

<h2 id="accessing-dashboard">Accessing the Dashboard</h2>
<p>The Dashboard appears after you''ve completed the initial setup checklist. Before that, you''ll see the "Get Set Up" page with your setup progress.</p>

<div data-callout data-callout-type="tip">Complete all setup steps to unlock the Dashboard. This includes configuring Ari, adding knowledge, and installing the widget.</div>

<h2 id="dashboard-sections">Dashboard Sections</h2>

<h3 id="status-overview">Status Overview</h3>
<p>At a glance, see:</p>
<ul>
<li>Whether Ari is deployed and active</li>
<li>Your subscription status</li>
<li>Quick links to common actions</li>
</ul>

<h3 id="quick-actions">Quick Actions</h3>
<p>Jump to frequently used features:</p>
<ul>
<li><strong>View Conversations:</strong> Check recent chats in the Inbox</li>
<li><strong>Manage Leads:</strong> Review captured leads</li>
<li><strong>Configure Ari:</strong> Adjust AI settings</li>
<li><strong>Invite Team:</strong> Add team members</li>
</ul>

<h3 id="help-resources">Help Resources</h3>
<p>Access helpful resources:</p>
<ul>
<li>Explore the Help Center</li>
<li>View documentation and guides</li>
</ul>

<h2 id="setup-checklist">Setup Checklist</h2>
<p>If you haven''t completed setup, you''ll see progress indicators for:</p>
<ol>
<li>Configure Ari''s personality and behavior</li>
<li>Add knowledge sources</li>
<li>Customize widget appearance</li>
<li>Install the widget on your website</li>
</ol>

<div data-callout data-callout-type="tip">Complete all setup steps to ensure Ari works optimally. Each step builds on the previous one for the best visitor experience.</div>

<h2 id="navigation">Navigating from Dashboard</h2>
<p>From the Dashboard, you can quickly access:</p>
<ul>
<li><strong>Sidebar:</strong> Main navigation to all features</li>
<li><strong>Settings:</strong> Configure your account and team</li>
<li><strong>Ari:</strong> Adjust AI configuration</li>
</ul>

<h2 id="permissions">Dashboard Permissions</h2>
<p>The Dashboard is visible to users with the <strong>View Dashboard</strong> permission. All roles have this permission by default.</p>

<div data-related-articles data-articles=''[{"categoryId":"analytics","articleSlug":"overview","title":"Analytics Overview"},{"categoryId":"inbox","articleSlug":"overview","title":"Inbox Overview"}]''></div>',
  3,
  true
)
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;

-- Ari: Overview
INSERT INTO platform_hc_articles (category_id, slug, title, description, content, order_index, is_published)
VALUES (
  'ari',
  'overview',
  'Understanding Ari',
  'Learn about Ari, your AI-powered assistant.',
  '<p>Ari is your AI-powered assistant that engages with visitors on your website. This article explains how Ari works and what makes it effective.</p>

<h2 id="what-ari-does">What Ari Does</h2>
<p>Ari is designed to handle common visitor interactions:</p>
<ul>
<li><strong>Answer Questions:</strong> Responds to visitor inquiries using your knowledge base</li>
<li><strong>Capture Leads:</strong> Collects visitor contact information for follow-up</li>
<li><strong>Schedule Appointments:</strong> Books meetings using your connected calendar</li>
<li><strong>Hand Off to Humans:</strong> Escalates complex conversations to your team</li>
</ul>

<h2 id="how-it-works">How Ari Works</h2>
<p>Behind the scenes, Ari uses several technologies:</p>
<ul>
<li><strong>Natural Language Understanding:</strong> Interprets visitor messages and intent</li>
<li><strong>Knowledge Retrieval:</strong> Searches your knowledge base for relevant information</li>
<li><strong>Response Generation:</strong> Creates natural, helpful responses</li>
<li><strong>Action Execution:</strong> Performs tasks like scheduling or lead capture</li>
</ul>

<h2 id="customization">Customizing Ari</h2>
<p>You have full control over Ari''s behavior:</p>
<ul>
<li><strong>Personality:</strong> Define tone and communication style via the system prompt</li>
<li><strong>Appearance:</strong> Customize colors, branding, and welcome messages</li>
<li><strong>Behavior:</strong> Configure lead capture, scheduling, and handoff rules</li>
<li><strong>Knowledge:</strong> Train Ari with your content through knowledge sources</li>
</ul>

<div data-callout data-callout-type="tip">Start with the default configuration and iterate based on real conversations. Review the Inbox regularly to identify opportunities for improvement.</div>

<h2 id="getting-started">Getting Started with Ari</h2>
<p>To set up Ari, work through these sections in order:</p>
<ol>
<li><strong>System Prompt:</strong> Define Ari''s personality</li>
<li><strong>Knowledge Sources:</strong> Add your business information</li>
<li><strong>Appearance:</strong> Customize the look and feel</li>
<li><strong>Installation:</strong> Deploy to your website</li>
</ol>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"system-prompt","title":"Writing a System Prompt"},{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Knowledge Sources"},{"categoryId":"ari","articleSlug":"installation","title":"Installing the Widget"}]''></div>',
  0,
  true
)
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;

-- Ari: System Prompt
INSERT INTO platform_hc_articles (category_id, slug, title, description, content, order_index, is_published)
VALUES (
  'ari',
  'system-prompt',
  'Writing a System Prompt',
  'Define Ari''s personality and behavior with instructions.',
  '<p>The System Prompt is the foundation of Ari''s personality and behavior. It''s a set of instructions that guides how Ari responds to visitors, handles conversations, and represents your brand.</p>

<h2 id="what-is-system-prompt">What is a System Prompt?</h2>
<p>Think of the system prompt as Ari''s "job description." It tells Ari:</p>
<ul>
<li>Who it is and what role it plays</li>
<li>How to communicate (tone, style, formality)</li>
<li>What topics to focus on or avoid</li>
<li>How to handle specific situations</li>
</ul>

<h2 id="accessing-system-prompt">Accessing the System Prompt</h2>
<ol>
<li>Navigate to <strong>Ari</strong> from the sidebar</li>
<li>Select <strong>System Prompt</strong> in the configuration menu</li>
<li>You''ll see a large text area with your current prompt</li>
</ol>

<h2 id="writing-tips">Tips for Writing Effective Prompts</h2>

<h3 id="be-specific">Be Specific About Identity</h3>
<p>Start by clearly defining who Ari is:</p>
<ul>
<li>"You are Ari, a friendly assistant for [Company Name]..."</li>
<li>Include your company''s mission or values</li>
<li>Specify the industry or context</li>
</ul>

<h3 id="set-tone">Set the Tone</h3>
<p>Define how Ari should communicate:</p>
<ul>
<li><strong>Professional:</strong> "Use formal language and maintain a business-like tone"</li>
<li><strong>Friendly:</strong> "Be warm, approachable, and use conversational language"</li>
<li><strong>Helpful:</strong> "Always prioritize solving the visitor''s problem"</li>
</ul>

<h3 id="include-guidelines">Include Specific Guidelines</h3>
<p>Add rules for common scenarios:</p>
<ul>
<li>"Always offer to schedule a tour when discussing properties"</li>
<li>"If asked about pricing, provide general ranges and offer to connect with a specialist"</li>
<li>"Never discuss competitor products"</li>
</ul>

<div data-callout data-callout-type="tip">Use bullet points in your system prompt to make instructions clear and easy for Ari to follow. Short, direct sentences work better than long paragraphs.</div>

<h2 id="example-prompt">Example System Prompt</h2>
<p>Here''s a template you can customize:</p>
<blockquote>
<p>You are Ari, a helpful assistant for [Company Name]. Your role is to welcome visitors, answer their questions, and help them find what they need.</p>
<p>Guidelines:</p>
<ul>
<li>Be friendly and professional</li>
<li>Keep responses concise but helpful</li>
<li>Offer to schedule appointments when appropriate</li>
<li>If you don''t know something, admit it and offer to connect with a team member</li>
</ul>
</blockquote>

<h2 id="auto-save">Auto-Save Feature</h2>
<p>Your changes are automatically saved as you type. You''ll see a confirmation when your prompt has been saved successfully.</p>

<div data-callout data-callout-type="info">Changes to the system prompt take effect immediately for new conversations. Existing conversations will continue with the previous prompt.</div>

<h2 id="testing-changes">Testing Your Changes</h2>
<p>After updating your system prompt:</p>
<ol>
<li>Open your website where Ari is installed</li>
<li>Start a new conversation</li>
<li>Test different scenarios to see how Ari responds</li>
<li>Refine your prompt based on the results</li>
</ol>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Knowledge Sources"},{"categoryId":"ari","articleSlug":"appearance","title":"Customizing Appearance"}]''></div>',
  1,
  true
)
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;

-- Ari: Appearance
INSERT INTO platform_hc_articles (category_id, slug, title, description, content, order_index, is_published)
VALUES (
  'ari',
  'appearance',
  'Customizing Appearance',
  'Make the chat widget match your brand.',
  '<p>Make the chat widget feel like a natural part of your website by customizing its appearance to match your brand.</p>

<h2 id="gradient-header">Gradient Header</h2>
<p>Enable the gradient header to give your widget a more dynamic, modern look. When enabled, the widget header displays a smooth gradient using your brand colors.</p>
<ul>
<li><strong>Enabled</strong> – Header shows a gradient from primary to secondary color</li>
<li><strong>Disabled</strong> – Header uses a solid primary color</li>
</ul>

<h2 id="brand-colors">Brand Colors</h2>
<p>Set your brand colors to style the widget header, buttons, and accents:</p>
<ul>
<li><strong>Primary Brand Color</strong> – The main color used for headers and buttons. When gradient is enabled, this is the starting color.</li>
<li><strong>Secondary Brand Color</strong> – Used as the ending color when gradient header is enabled.</li>
</ul>

<div data-callout data-callout-type="tip">Choose colors with good contrast. The widget automatically adjusts text colors to ensure readability against your chosen background.</div>

<h2 id="widget-preview">Live Preview</h2>
<p>As you make changes, the preview on the right side of the screen updates in real-time so you can see exactly how your widget will look.</p>

<div data-callout data-callout-type="info">Changes to appearance are saved automatically and take effect immediately on your live widget.</div>

<h2 id="additional-styling">Additional Styling Options</h2>
<p>For more customization options, check the Welcome &amp; Messages section where you can configure:</p>
<ul>
<li>Welcome title with optional emoji</li>
<li>Welcome subtitle text</li>
<li>Quick Reply Suggestions toggle</li>
<li>Bottom navigation tabs (Messages, News, Help)</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"welcome-messages","title":"Welcome & Messages"},{"categoryId":"ari","articleSlug":"installation","title":"Installing the Widget"},{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Knowledge Sources"}]''></div>',
  2,
  true
)
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;

-- Ari: Welcome Messages
INSERT INTO platform_hc_articles (category_id, slug, title, description, content, order_index, is_published)
VALUES (
  'ari',
  'welcome-messages',
  'Welcome & Messages',
  'Configure welcome messages and widget content.',
  '<p>First impressions matter. Configure Ari''s welcome message and widget content to greet visitors and guide them through your chat experience.</p>

<h2 id="welcome-title">Welcome Title</h2>
<p>The welcome title is the first thing visitors see when they open the chat widget. It appears prominently at the top of the chat interface.</p>
<ul>
<li><strong>Title Text</strong> – A short greeting or headline (e.g., "Welcome to [Company]!")</li>
<li><strong>Emoji</strong> – Add an optional emoji to make the greeting more friendly and eye-catching</li>
</ul>

<h3 id="editing-welcome-title">Editing the Welcome Title</h3>
<ol>
<li>Navigate to <strong>Ari</strong> from the sidebar</li>
<li>Select <strong>Welcome &amp; Messages</strong></li>
<li>Edit the Title and Emoji fields</li>
<li>Your changes save automatically</li>
</ol>

<div data-callout data-callout-type="tip">Keep your welcome title short and action-oriented. Example: "Hi there! 👋" or "Welcome to Sunshine Homes!"</div>

<h2 id="welcome-subtitle">Welcome Subtitle</h2>
<p>The subtitle appears below the welcome title and provides additional context or instructions for visitors.</p>
<ul>
<li>Introduce what Ari can help with</li>
<li>Set expectations for the conversation</li>
<li>Encourage visitors to ask questions</li>
</ul>

<div data-callout data-callout-type="info">Example subtitle: "I''m here to help you find your perfect home, schedule tours, and answer any questions you have."</div>

<h2 id="quick-reply-suggestions">Quick Reply Suggestions</h2>
<p>Enable this toggle to show suggested quick replies in the chat interface. These help visitors start conversations with common questions or requests.</p>
<ul>
<li><strong>Enabled</strong> – Shows contextual quick reply buttons based on the conversation</li>
<li><strong>Disabled</strong> – Visitors type all messages manually</li>
</ul>

<h2 id="bottom-navigation">Bottom Navigation Tabs</h2>
<p>Control which tabs appear at the bottom of your chat widget. Each tab provides different functionality for your visitors:</p>

<h3 id="messages-tab">Messages Tab</h3>
<p>The primary chat interface where visitors converse with Ari. This tab is always visible and cannot be disabled.</p>

<h3 id="news-tab">News Tab</h3>
<p>Display announcements, updates, and news items to visitors. Toggle this off if you don''t want to show news content in your widget.</p>

<h3 id="help-tab">Help Tab</h3>
<p>Provide self-service help articles for visitors. Toggle this off if you prefer visitors to only interact with Ari directly.</p>

<div data-callout data-callout-type="tip">If you have extensive help documentation, keep the Help tab enabled. It helps visitors find answers quickly without waiting for a response.</div>

<h2 id="best-practices">Best Practices</h2>
<ul>
<li>Keep the welcome title under 30 characters for best display</li>
<li>Use friendly, conversational language</li>
<li>Match the tone of your brand</li>
<li>Test messages on mobile devices (shorter is better)</li>
<li>Use emojis sparingly – one in the title is usually enough</li>
</ul>

<div data-callout data-callout-type="info">Changes to welcome messages are saved automatically and take effect immediately on your live widget.</div>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"appearance","title":"Customizing Appearance"},{"categoryId":"ari","articleSlug":"lead-capture","title":"Lead Capture"},{"categoryId":"ari","articleSlug":"help-articles","title":"Help Articles"}]''></div>',
  3,
  true
)
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;