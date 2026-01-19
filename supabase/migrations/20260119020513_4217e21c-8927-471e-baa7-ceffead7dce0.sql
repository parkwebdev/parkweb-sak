-- Phase 3: Migrate Help Center Articles to Database
-- Updates all 33 articles with converted HTML content using data-* format

-- GETTING STARTED (4 articles)

UPDATE platform_hc_articles 
SET content = '<p>Welcome to <strong>Pilot</strong> – your AI-powered customer engagement platform. Pilot helps you automate conversations, capture leads, and provide exceptional support to your website visitors 24/7.</p>

<h2 id="what-is-pilot">What is Pilot?</h2>
<p>Pilot is a comprehensive platform that combines the power of AI with intuitive tools to help you manage customer interactions. At the heart of Pilot is <strong>Ari</strong>, your AI agent that can:</p>
<ul>
<li>Answer customer questions instantly using your knowledge base</li>
<li>Capture and qualify leads automatically</li>
<li>Schedule appointments and bookings</li>
<li>Hand off complex conversations to your team</li>
<li>Provide insights through detailed analytics</li>
</ul>

<h2 id="key-features">Key Features</h2>

<div data-feature-grid data-columns="2">
<div data-feature-card data-feature-icon="MessageChatCircle" data-feature-title="AI Agent (Ari)" data-feature-description="Your always-on assistant that learns from your knowledge base to provide accurate, helpful responses."></div>
<div data-feature-card data-feature-icon="MessageSquare01" data-feature-title="Unified Inbox" data-feature-description="All conversations flow into a single inbox where you can monitor, take over, or review interactions."></div>
<div data-feature-card data-feature-icon="Users01" data-feature-title="Lead Management" data-feature-description="Automatically capture visitor information and organize leads through customizable stages."></div>
<div data-feature-card data-feature-icon="Calendar" data-feature-title="Planner & Bookings" data-feature-description="Let Ari schedule appointments directly into your calendar with Google Calendar integration."></div>
<div data-feature-card data-feature-icon="BarChart01" data-feature-title="Analytics & Insights" data-feature-description="Understand how your AI is performing with detailed metrics on conversations and satisfaction."></div>
</div>

<div data-callout data-callout-type="tip"><strong>Getting Started</strong> Ready to set up your first AI agent? Head to the <a data-article-link data-category-id="getting-started" data-article-slug="quick-start" href="/help-center?category=getting-started&article=quick-start">Quick Start Guide</a> to get Ari up and running in minutes.</div>

<h2 id="next-steps">Next Steps</h2>
<p>Now that you understand what Pilot can do, here''s how to get started:</p>
<ol>
<li>Complete the <a data-article-link data-category-id="getting-started" data-article-slug="quick-start" href="/help-center?category=getting-started&article=quick-start">Quick Start Guide</a> to configure Ari</li>
<li><a data-article-link data-category-id="ari" data-article-slug="knowledge-sources" href="/help-center?category=ari&article=knowledge-sources">Add knowledge sources</a> so Ari can answer questions about your business</li>
<li><a data-article-link data-category-id="ari" data-article-slug="appearance" href="/help-center?category=ari&article=appearance">Customize the chat widget</a> to match your brand</li>
<li><a data-article-link data-category-id="ari" data-article-slug="installation" href="/help-center?category=ari&article=installation">Install the widget</a> on your website</li>
<li>Monitor conversations and refine Ari''s responses</li>
</ol>

<p>Have questions? Our support team is here to help you succeed with Pilot.</p>

<div data-related-articles data-articles=''[{"categoryId":"getting-started","articleSlug":"quick-start","title":"Quick Start Guide"},{"categoryId":"ari","articleSlug":"overview","title":"Understanding Ari"},{"categoryId":"getting-started","articleSlug":"navigation","title":"Navigating the App"}]''></div>',
    description = 'An introduction to the Pilot platform and what you can do with it.',
    updated_at = NOW()
WHERE category_id = 'getting-started' AND slug = 'welcome';

UPDATE platform_hc_articles 
SET content = '<p>This guide will walk you through setting up Pilot and getting your AI agent live on your website in just a few minutes.</p>

<h2 id="setup-overview">Setup Overview</h2>
<div data-stepbystep>
<div data-step data-step-number="1" data-step-title="Configure Ari">Set up your AI agent''s personality and system prompt in the Ari section.</div>
<div data-step data-step-number="2" data-step-title="Add Knowledge Sources">Give Ari information about your business by adding website URLs, documents, or text.</div>
<div data-step data-step-number="3" data-step-title="Customize Appearance">Match the chat widget to your brand with custom colors and welcome messages.</div>
<div data-step data-step-number="4" data-step-title="Install the Widget">Copy the embed code and add it to your website to go live.</div>
<div data-step data-step-number="5" data-step-title="Monitor & Improve">Review conversations and analytics to continuously improve Ari''s performance.</div>
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

<div data-callout data-callout-type="warning"><strong>Important</strong> Make sure to test the widget on your staging environment before pushing to production.</div>

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
    description = 'Get up and running with Pilot in just a few minutes.',
    updated_at = NOW()
WHERE category_id = 'getting-started' AND slug = 'quick-start';

UPDATE platform_hc_articles 
SET content = '<p>Pilot is designed to be intuitive and easy to navigate. This guide will help you find your way around the platform quickly.</p>

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

<div data-callout data-callout-type="tip"><strong>Collapse the Sidebar</strong> The sidebar automatically collapses when you move your mouse away, giving you more screen space. Hover over it to expand.</div>

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
<thead>
<tr><th>Shortcut</th><th>Action</th></tr>
</thead>
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

<h2 id="settings-menu">Settings & Account</h2>
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
    description = 'Learn how to navigate around Pilot efficiently.',
    updated_at = NOW()
WHERE category_id = 'getting-started' AND slug = 'navigation';

UPDATE platform_hc_articles 
SET content = '<p>The Dashboard is your command center after completing initial setup. It provides a quick overview of your Ari deployment status and key actions.</p>

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
    description = 'Your command center after completing setup.',
    updated_at = NOW()
WHERE category_id = 'getting-started' AND slug = 'dashboard';

-- ARI (15 articles)

UPDATE platform_hc_articles 
SET content = '<p><strong>Ari</strong> is your AI-powered assistant that engages with website visitors 24/7. Built on advanced language models, Ari can understand context, provide helpful responses, and take actions on behalf of your business.</p>

<h2 id="what-ari-does">What Ari Can Do</h2>
<p>Ari is designed to handle a wide range of customer interactions:</p>

<div data-feature-grid data-columns="2">
<div data-feature-card data-feature-icon="MessageTextCircle01" data-feature-title="Answer Questions" data-feature-description="Using your knowledge base, Ari provides natural, conversational responses about your products, services, and policies."></div>
<div data-feature-card data-feature-icon="Users01" data-feature-title="Capture Leads" data-feature-description="Ari collects visitor information like name, email, and phone, automatically creating leads in your CRM."></div>
<div data-feature-card data-feature-icon="Calendar" data-feature-title="Schedule Appointments" data-feature-description="When integrated with your calendar, Ari checks availability and books appointments during conversations."></div>
<div data-feature-card data-feature-icon="Repeat04" data-feature-title="Hand Off to Humans" data-feature-description="For complex issues, Ari seamlessly transfers conversations to your team with full context."></div>
</div>

<div data-callout data-callout-type="tip"><strong>Best Practice</strong> Start with a focused set of knowledge sources and gradually expand. This helps Ari provide more accurate responses.</div>

<h2 id="how-ari-works">How Ari Works</h2>
<p>Behind the scenes, Ari uses several technologies to provide intelligent responses:</p>
<ol>
<li><strong>Natural Language Understanding</strong> – Ari comprehends the intent behind visitor messages</li>
<li><strong>Knowledge Retrieval</strong> – Relevant information is pulled from your knowledge base</li>
<li><strong>Response Generation</strong> – A contextual, helpful response is crafted</li>
<li><strong>Action Execution</strong> – When needed, Ari can trigger actions like creating leads or bookings</li>
</ol>

<h2 id="customizing-ari">Customizing Ari</h2>
<p>Every business is unique, so Ari is highly customizable:</p>
<ul>
<li><strong>Personality</strong> – Define how Ari communicates (formal, friendly, professional)</li>
<li><strong>Appearance</strong> – Match your brand colors with gradient headers</li>
<li><strong>Behavior</strong> – Control when Ari asks for information or offers assistance</li>
<li><strong>Knowledge</strong> – Add content from websites, documents, or manual entries</li>
</ul>

<h2 id="getting-started-ari">Getting Started</h2>
<p>Ready to configure your AI agent? Start with these sections:</p>
<ul>
<li><a data-article-link data-category-id="ari" data-article-slug="system-prompt" href="/help-center?category=ari&article=system-prompt">System Prompt</a> – Define Ari''s personality and guidelines</li>
<li><a data-article-link data-category-id="ari" data-article-slug="knowledge-sources" href="/help-center?category=ari&article=knowledge-sources">Knowledge</a> – Add sources for Ari to learn from</li>
<li><a data-article-link data-category-id="ari" data-article-slug="appearance" href="/help-center?category=ari&article=appearance">Appearance</a> – Customize the look of the chat widget</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Adding Knowledge Sources"},{"categoryId":"ari","articleSlug":"installation","title":"Installing the Widget"}]''></div>',
    description = 'Learn what Ari is and how it can help your business.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'overview';

UPDATE platform_hc_articles 
SET content = '<p>The System Prompt is the foundation of Ari''s personality and behavior. It''s a set of instructions that guides how Ari responds to visitors, handles conversations, and represents your brand.</p>

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
    description = 'Define Ari''s personality and guidelines.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'system-prompt';

UPDATE platform_hc_articles 
SET content = '<p>Make the chat widget feel like a natural part of your website by customizing its appearance to match your brand.</p>

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
<p>For more customization options, check the Welcome & Messages section where you can configure:</p>
<ul>
<li>Welcome title with optional emoji</li>
<li>Welcome subtitle text</li>
<li>Quick Reply Suggestions toggle</li>
<li>Bottom navigation tabs (Messages, News, Help)</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"welcome-messages","title":"Welcome & Messages"},{"categoryId":"ari","articleSlug":"installation","title":"Installing the Widget"},{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Knowledge Sources"}]''></div>',
    description = 'Make the chat widget match your brand.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'appearance';

UPDATE platform_hc_articles 
SET content = '<p>First impressions matter. Configure Ari''s welcome message and widget content to greet visitors and guide them through your chat experience.</p>

<h2 id="welcome-title">Welcome Title</h2>
<p>The welcome title is the first thing visitors see when they open the chat widget. It appears prominently at the top of the chat interface.</p>
<ul>
<li><strong>Title Text</strong> – A short greeting or headline (e.g., "Welcome to [Company]!")</li>
<li><strong>Emoji</strong> – Add an optional emoji to make the greeting more friendly and eye-catching</li>
</ul>

<h3 id="editing-welcome-title">Editing the Welcome Title</h3>
<ol>
<li>Navigate to <strong>Ari</strong> from the sidebar</li>
<li>Select <strong>Welcome & Messages</strong></li>
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
<ul>
<li><strong>Enabled</strong> – News tab appears in the widget navigation</li>
<li><strong>Disabled</strong> – News tab is hidden from visitors</li>
</ul>

<h3 id="help-tab">Help Tab</h3>
<p>Provide self-service help articles for visitors. Toggle this off if you prefer visitors to only interact with Ari directly.</p>
<ul>
<li><strong>Enabled</strong> – Help tab appears with your help articles</li>
<li><strong>Disabled</strong> – Help tab is hidden from visitors</li>
</ul>

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
    description = 'Configure greetings and quick actions.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'welcome-messages';

UPDATE platform_hc_articles 
SET content = '<p>Ari can capture visitor information before starting a conversation. Configure a contact form to collect leads and qualify visitors automatically.</p>

<h2 id="how-it-works">How Lead Capture Works</h2>
<p>When enabled, visitors see a contact form before they can chat. This ensures you have their information for follow-up, even if they leave the conversation.</p>
<ol>
<li>Visitor opens the chat widget</li>
<li>Contact form appears with your configured fields</li>
<li>Visitor submits their information</li>
<li>A lead is created in your <a data-article-link data-category-id="leads" data-article-slug="overview" href="/help-center?category=leads&article=overview">Leads</a> dashboard</li>
<li>Conversation begins with Ari</li>
</ol>

<h2 id="enabling-contact-form">Enabling the Contact Form</h2>
<p>To enable lead capture:</p>
<ol>
<li>Go to <strong>Ari → Lead Capture</strong></li>
<li>Toggle <strong>Enable Contact Form</strong> on</li>
<li>Configure your form title and subtitle</li>
<li>Add any custom fields you need</li>
</ol>

<h2 id="form-configuration">Form Configuration</h2>
<p>Customize your contact form appearance:</p>
<ul>
<li><strong>Form Title</strong> – The heading visitors see (e.g., "Let''s get started")</li>
<li><strong>Form Subtitle</strong> – Additional context below the title</li>
</ul>

<h2 id="default-fields">Default Fields</h2>
<p>The contact form includes three standard fields:</p>
<ul>
<li><strong>First Name</strong> – Visitor''s first name</li>
<li><strong>Last Name</strong> – Visitor''s last name</li>
<li><strong>Email</strong> – Email address for follow-up</li>
</ul>
<p>These fields are always included and help identify leads in your dashboard.</p>

<h2 id="custom-fields">Custom Fields</h2>
<p>Add custom fields to collect additional information. Supported field types:</p>
<ul>
<li><strong>Text</strong> – Single-line text input for names, titles, etc.</li>
<li><strong>Email</strong> – Email address with validation</li>
<li><strong>Phone</strong> – Phone number with formatting</li>
<li><strong>Text Area</strong> – Multi-line text for longer responses</li>
<li><strong>Select</strong> – Dropdown menu with predefined options</li>
<li><strong>Checkbox</strong> – Agreement checkboxes (e.g., terms acceptance)</li>
</ul>

<h3 id="configuring-custom-fields">Configuring Custom Fields</h3>
<p>For each custom field, you can set:</p>
<ul>
<li><strong>Label</strong> – The field name shown to visitors</li>
<li><strong>Placeholder</strong> – Hint text inside the input</li>
<li><strong>Required</strong> – Whether the field must be filled</li>
<li><strong>Options</strong> – For select fields, the dropdown choices</li>
</ul>

<div data-callout data-callout-type="tip">Checkbox labels support rich text, making them perfect for terms and conditions agreements with links to your policies.</div>

<h2 id="lead-creation">Automatic Lead Creation</h2>
<p>When a visitor submits the form:</p>
<ul>
<li>A new lead is created in your Leads dashboard</li>
<li>The lead is linked to their conversation</li>
<li>Custom field data is stored with the lead</li>
<li>You receive a notification (if enabled)</li>
</ul>

<h2 id="duplicate-handling">Duplicate Handling</h2>
<p>If a visitor returns with the same email:</p>
<ul>
<li>Their existing lead record is updated</li>
<li>The new conversation is linked to their profile</li>
<li>Previous conversation history is preserved</li>
</ul>

<div data-callout data-callout-type="info">Duplicate detection uses email addresses. Visitors with different emails will create separate lead records.</div>

<h2 id="spam-protection">Spam Protection</h2>
<p>The contact form includes built-in server-side protections:</p>
<ul>
<li><strong>Honeypot fields</strong> – Hidden fields to catch automated bots</li>
<li><strong>IP rate limiting</strong> – Blocks excessive submissions from the same source</li>
<li><strong>Submission timing</strong> – Detects suspiciously fast submissions</li>
<li><strong>Content validation</strong> – Detects spam patterns in form fields</li>
</ul>

<h2 id="privacy">Privacy Considerations</h2>
<p>When collecting visitor information:</p>
<ul>
<li>Ensure your privacy policy covers data collection</li>
<li>Consider adding a consent checkbox for marketing</li>
<li>Lead data is stored securely in your database</li>
<li>You control data retention and deletion</li>
</ul>

<div data-callout data-callout-type="warning">Comply with GDPR, CCPA, and other privacy regulations when collecting personal information. Add appropriate consent mechanisms for your region.</div>

<h2 id="notifications">Lead Notifications</h2>
<p>Get notified when new leads are captured. Configure notifications in <a data-article-link data-category-id="settings" data-article-slug="notifications" href="/help-center?category=settings&article=notifications">Settings → Notifications</a>.</p>

<div data-related-articles data-articles=''[{"categoryId":"leads","articleSlug":"overview","title":"Lead Management"},{"categoryId":"ari","articleSlug":"welcome-messages","title":"Welcome & Messages"},{"categoryId":"settings","articleSlug":"notifications","title":"Notification Preferences"}]''></div>',
    description = 'Collect visitor information during conversations.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'lead-capture';

UPDATE platform_hc_articles 
SET content = '<p>Knowledge Sources are how Ari learns about your business. By adding websites, documents, or text, you give Ari the information it needs to answer visitor questions accurately.</p>

<h2 id="accessing-knowledge">Accessing Knowledge Sources</h2>
<ol>
<li>Navigate to <strong>Ari</strong> from the sidebar</li>
<li>Select <strong>Knowledge</strong> in the configuration menu</li>
<li>You''ll see your existing sources and can add new ones</li>
</ol>

<h2 id="source-types">Types of Knowledge Sources</h2>

<h3 id="website-urls">Website URLs</h3>
<p>Add your website pages so Ari can reference their content:</p>
<ul>
<li>Product or service pages</li>
<li>FAQ sections</li>
<li>About us and contact pages</li>
<li>Blog posts and articles</li>
</ul>

<div data-callout data-callout-type="tip">Start with your most important pages first. You can always add more later.</div>

<h3 id="documents">Documents</h3>
<p>Upload files with detailed information:</p>
<ul>
<li>PDFs (brochures, guides, policies)</li>
<li>Word documents</li>
<li>Text files</li>
</ul>

<h3 id="manual-text">Manual Text Entry</h3>
<p>Add custom content directly:</p>
<ul>
<li>Internal policies not published online</li>
<li>Specific Q&A pairs</li>
<li>Special instructions or guidelines</li>
</ul>

<h2 id="adding-source">Adding a Knowledge Source</h2>
<ol>
<li>Click <strong>Add Knowledge Source</strong></li>
<li>Choose the source type (Website, Document, or Text)</li>
<li>Enter the URL or upload your file</li>
<li>Click <strong>Add</strong> to save</li>
<li>Wait for processing to complete</li>
</ol>

<div data-callout data-callout-type="info">Processing time varies based on content size. Website pages are typically faster than large documents.</div>

<h2 id="managing-sources">Managing Existing Sources</h2>
<p>From the Knowledge page, you can:</p>
<ul>
<li><strong>Refresh</strong> website sources to pick up changes</li>
<li><strong>Delete</strong> outdated or irrelevant sources</li>
<li><strong>View</strong> the status and last sync time</li>
</ul>

<h2 id="best-practices">Best Practices</h2>
<ol>
<li>Start with your most important pages and FAQs</li>
<li>Keep content up-to-date by refreshing sources regularly</li>
<li>Review conversations to identify knowledge gaps</li>
<li>Remove outdated information that might confuse Ari</li>
</ol>

<div data-callout data-callout-type="info">It may take a few minutes for new knowledge sources to be processed and available to Ari.</div>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"overview","title":"Understanding Ari"},{"categoryId":"ari","articleSlug":"system-prompt","title":"Writing a System Prompt"},{"categoryId":"getting-started","articleSlug":"quick-start","title":"Quick Start Guide"}]''></div>',
    description = 'Teach Ari about your business with knowledge sources.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'knowledge-sources';

UPDATE platform_hc_articles 
SET content = '<p>If your business has multiple locations, configure each one so Ari can provide location-specific information, availability, and directions.</p>

<h2 id="why-locations">Why Use Locations?</h2>
<p>Locations help Ari provide accurate, contextual responses:</p>
<ul>
<li>Show correct business hours for each location</li>
<li>Provide accurate address and directions</li>
<li>Display location-specific contact information</li>
<li>Schedule appointments at the right place</li>
<li>Filter knowledge base content by location</li>
</ul>

<h2 id="adding-location">Adding a Location</h2>
<ol>
<li>Navigate to <strong>Ari</strong> from the sidebar</li>
<li>Select <strong>Locations</strong></li>
<li>Click <strong>Add Location</strong></li>
<li>Fill in the location details</li>
<li>Save your changes</li>
</ol>

<h3 id="location-details">Location Details</h3>
<p>For each location, you can configure:</p>
<ul>
<li><strong>Name:</strong> Display name (e.g., "Downtown Office")</li>
<li><strong>Address:</strong> Full street address</li>
<li><strong>City, State, ZIP:</strong> Location details for search</li>
<li><strong>Phone:</strong> Location-specific phone number</li>
<li><strong>Email:</strong> Location-specific email address</li>
<li><strong>Timezone:</strong> For accurate scheduling</li>
</ul>

<div data-callout data-callout-type="tip">Include the timezone for each location to ensure appointments are scheduled correctly, especially for businesses spanning multiple time zones.</div>

<h2 id="business-hours">Business Hours</h2>
<p>Set operating hours for each location:</p>
<ul>
<li>Configure hours for each day of the week</li>
<li>Set different hours for different days</li>
<li>Mark days as closed</li>
<li>Ari uses these hours for scheduling and responses</li>
</ul>

<h2 id="url-patterns">URL Patterns</h2>
<p>Link locations to specific pages on your website:</p>
<ul>
<li>When a visitor chats from a location page, Ari knows the context</li>
<li>Use URL patterns like <code>/locations/downtown/*</code></li>
<li>Ari can provide location-specific information automatically</li>
</ul>

<h2 id="default-location">Default Location</h2>
<p>Set a default location for when context isn''t available:</p>
<ul>
<li>Used when visitors don''t specify a location</li>
<li>Applies to general inquiries</li>
<li>Can be your main office or headquarters</li>
</ul>

<h2 id="location-knowledge">Location-Specific Knowledge</h2>
<p>Associate knowledge sources with locations:</p>
<ul>
<li>Each location can have unique FAQ content</li>
<li>Location-specific documents and information</li>
<li>Property listings linked to communities</li>
</ul>

<div data-callout data-callout-type="info">When you add a knowledge source, you can optionally assign it to a specific location. This helps Ari give more relevant answers.</div>

<h2 id="managing-locations">Managing Locations</h2>
<p>Keep your locations up to date:</p>
<ul>
<li>Edit location details anytime</li>
<li>Deactivate locations that are temporarily closed</li>
<li>Delete locations that are permanently closed</li>
<li>Reorder locations to prioritize important ones</li>
</ul>

<h2 id="calendar-integration">Calendar Integration</h2>
<p>Connect calendars to locations for appointment scheduling:</p>
<ul>
<li>Each location can have its own Google Calendar</li>
<li>Appointments sync automatically</li>
<li>Availability is checked per location</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"integrations","title":"Integrations"},{"categoryId":"planner","articleSlug":"overview","title":"Using the Planner"}]''></div>',
    description = 'Configure multiple business locations.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'locations';

UPDATE platform_hc_articles 
SET content = '<p>Help Articles are a self-service knowledge base that appears in the chat widget. Visitors can browse articles to find answers without needing to chat with Ari.</p>

<h2 id="how-they-work">How Help Articles Work</h2>
<p>When enabled, a "Help" tab appears in the chat widget:</p>
<ul>
<li>Visitors can browse articles by category</li>
<li>Search for specific topics</li>
<li>Read articles directly in the widget</li>
<li>Switch to chat if they need more help</li>
</ul>

<div data-callout data-callout-type="tip">Well-organized help articles reduce the number of repetitive questions Ari receives, freeing it up for more complex conversations.</div>

<h2 id="creating-categories">Creating Categories</h2>
<p>Organize articles into logical categories:</p>
<ol>
<li>Navigate to <strong>Ari → Help Articles</strong></li>
<li>Click <strong>Add Category</strong></li>
<li>Enter a category name and optional icon</li>
<li>Save the category</li>
</ol>

<h3 id="example-categories">Example Categories</h3>
<ul>
<li>Getting Started</li>
<li>Pricing & Payments</li>
<li>Scheduling & Tours</li>
<li>Policies & FAQs</li>
<li>Contact & Support</li>
</ul>

<h2 id="writing-articles">Writing Articles</h2>
<ol>
<li>Select a category or create a new one</li>
<li>Click <strong>Add Article</strong></li>
<li>Enter a clear, descriptive title</li>
<li>Write the article content</li>
<li>Save and publish</li>
</ol>

<h3 id="article-tips">Tips for Great Articles</h3>
<ul>
<li><strong>Clear titles:</strong> Use questions visitors might ask</li>
<li><strong>Short paragraphs:</strong> Easy to scan on mobile</li>
<li><strong>Step-by-step:</strong> Use numbered lists for processes</li>
<li><strong>Visual aids:</strong> Add images when helpful</li>
<li><strong>Links:</strong> Reference related articles</li>
</ul>

<div data-callout data-callout-type="info">Article titles that match common questions help both visitors and Ari find the right information faster.</div>

<h2 id="rich-editor">Rich Text Editor</h2>
<p>The article editor supports:</p>
<ul>
<li>Headings and subheadings</li>
<li>Bold, italic, and underlined text</li>
<li>Bulleted and numbered lists</li>
<li>Links to external pages</li>
<li>Images and screenshots</li>
</ul>

<h2 id="article-order">Ordering Articles</h2>
<p>Control how articles appear:</p>
<ul>
<li>Drag and drop to reorder within categories</li>
<li>Most important articles should appear first</li>
<li>Categories can also be reordered</li>
</ul>

<h2 id="ari-integration">Integration with Ari</h2>
<p>Ari uses your help articles as a knowledge source:</p>
<ul>
<li>When visitors ask questions, Ari references articles</li>
<li>Ari can link to relevant articles in responses</li>
<li>Articles are automatically indexed for search</li>
</ul>

<h2 id="analytics">Article Analytics</h2>
<p>Track how articles perform:</p>
<ul>
<li>View counts for each article</li>
<li>Helpful/not helpful feedback from visitors</li>
<li>Search terms that lead to articles</li>
<li>Use data to improve content</li>
</ul>

<h2 id="best-practices">Best Practices</h2>
<ul>
<li>Start with your top 10 most common questions</li>
<li>Update articles when policies or processes change</li>
<li>Review feedback regularly to improve content</li>
<li>Keep articles focused on one topic each</li>
<li>Use consistent formatting across all articles</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Knowledge Sources"},{"categoryId":"ari","articleSlug":"announcements","title":"Announcements"}]''></div>',
    description = 'Create self-service content for visitors.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'help-articles';

UPDATE platform_hc_articles 
SET content = '<p>Announcements are eye-catching banners that appear at the top of the chat widget. Use them to highlight promotions, events, or important updates.</p>

<h2 id="how-they-work">How Announcements Work</h2>
<p>When visitors open the chat widget, they see your active announcements:</p>
<ul>
<li>Displayed as horizontal cards at the top of the widget</li>
<li>Can include images, text, and call-to-action buttons</li>
<li>Visitors can scroll through multiple announcements</li>
<li>Clicking an announcement can open a link or trigger an action</li>
</ul>

<h2 id="creating-announcement">Creating an Announcement</h2>
<div data-stepbystep>
<div data-step data-step-number="1" data-step-title="Navigate to Ari → Announcements">Open the Ari configurator and select the Announcements section.</div>
<div data-step data-step-number="2" data-step-title="Click Add Announcement">Click the Add Announcement button to create a new announcement.</div>
<div data-step data-step-number="3" data-step-title="Enter Title and Subtitle">Add a compelling headline (5-7 words max) and optional subtitle.</div>
<div data-step data-step-number="4" data-step-title="Add an Image (Optional)">Upload a background or featured image that matches your brand.</div>
<div data-step data-step-number="5" data-step-title="Set Colors">Choose background and text colors for high contrast and readability.</div>
<div data-step data-step-number="6" data-step-title="Add Action URL (Optional)">Enter a URL to open when visitors click the announcement.</div>
<div data-step data-step-number="7" data-step-title="Save and Activate">Save the announcement and toggle it on to make it visible.</div>
</div>

<div data-callout data-callout-type="tip">Use high-contrast colors and concise text. Announcements should be scannable in under 3 seconds.</div>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"appearance","title":"Customizing Appearance"},{"categoryId":"ari","articleSlug":"welcome-messages","title":"Welcome & Messages"},{"categoryId":"ari","articleSlug":"news","title":"News"}]''></div>',
    description = 'Display promotional banners in the widget.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'announcements';

UPDATE platform_hc_articles 
SET content = '<p>The News feature lets you share updates, blog posts, and stories directly in the chat widget.</p>

<h2 id="news-vs-announcements">News vs. Announcements</h2>
<ul>
<li><strong>Announcements:</strong> Short, urgent, promotional (like banners)</li>
<li><strong>News:</strong> Longer, informational, evergreen content (like blog posts)</li>
</ul>

<div data-callout data-callout-type="info">Only enable the News tab if you plan to publish content regularly.</div>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"announcements","title":"Announcements"}]''></div>',
    description = 'Share updates and stories with visitors.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'news';

UPDATE platform_hc_articles 
SET content = '<p>Custom Tools extend Ari''s capabilities by connecting to external services and APIs.</p>

<div data-callout data-callout-type="warning">Custom Tools require technical knowledge.</div>

<h2 id="creating-tool">Creating a Custom Tool</h2>
<div data-stepbystep>
<div data-step data-step-number="1" data-step-title="Navigate to Ari → Custom Tools">Open the Ari configurator and select Custom Tools.</div>
<div data-step data-step-number="2" data-step-title="Click Add Tool">Click the Add Tool button.</div>
<div data-step data-step-number="3" data-step-title="Enter Tool Details">Provide a name and description.</div>
<div data-step data-step-number="4" data-step-title="Set the Endpoint URL">Enter your API endpoint URL.</div>
<div data-step data-step-number="5" data-step-title="Define Parameters">Add input parameters Ari should collect.</div>
<div data-step data-step-number="6" data-step-title="Test and Enable">Test, then enable the tool.</div>
</div>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"webhooks","title":"Webhooks"},{"categoryId":"ari","articleSlug":"api-access","title":"API Access"}]''></div>',
    description = 'Extend Ari with custom API integrations.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'custom-tools';

UPDATE platform_hc_articles 
SET content = '<p>Webhooks allow Pilot to notify your external systems when events happen.</p>

<div data-callout data-callout-type="info">Unlike APIs where you request data, webhooks push data to you automatically.</div>

<h2 id="creating-webhook">Creating a Webhook</h2>
<div data-stepbystep>
<div data-step data-step-number="1" data-step-title="Navigate to Ari → Webhooks">Open the Ari configurator and select Webhooks.</div>
<div data-step data-step-number="2" data-step-title="Click Add Webhook">Click the Add Webhook button.</div>
<div data-step data-step-number="3" data-step-title="Enter Webhook Details">Provide name, endpoint URL, and select events.</div>
<div data-step data-step-number="4" data-step-title="Configure Authentication">Add required headers for your endpoint.</div>
<div data-step data-step-number="5" data-step-title="Save and Activate">Save the webhook and toggle it on.</div>
</div>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"custom-tools","title":"Custom Tools"},{"categoryId":"ari","articleSlug":"integrations","title":"Integrations"}]''></div>',
    description = 'Send real-time notifications to external systems.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'webhooks';

UPDATE platform_hc_articles 
SET content = '<p>Connect Pilot to your existing tools and services.</p>

<h2 id="calendar-integrations">Calendar Integrations</h2>
<ul>
<li><strong>Google Calendar:</strong> Two-way sync for bookings</li>
</ul>

<div data-callout data-callout-type="info">Calendar integrations enable real-time availability checking.</div>

<h2 id="connecting-integration">Connecting an Integration</h2>
<div data-stepbystep>
<div data-step data-step-number="1" data-step-title="Navigate to Ari → Integrations">Open the Integrations section.</div>
<div data-step data-step-number="2" data-step-title="Find Your Integration">Browse available integrations.</div>
<div data-step data-step-number="3" data-step-title="Click Connect">Click the Connect button.</div>
<div data-step data-step-number="4" data-step-title="Authenticate">Follow prompts to authorize.</div>
<div data-step data-step-number="5" data-step-title="Configure Settings">Set up sync preferences.</div>
</div>

<div data-related-articles data-articles=''[{"categoryId":"planner","articleSlug":"overview","title":"Using the Planner"},{"categoryId":"ari","articleSlug":"webhooks","title":"Webhooks"}]''></div>',
    description = 'Connect to calendars, CRMs, and more.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'integrations';

UPDATE platform_hc_articles 
SET content = '<p>The Pilot API allows developers to interact with Ari programmatically.</p>

<div data-callout data-callout-type="warning">API Access is an advanced feature intended for developers.</div>

<h2 id="api-keys">API Keys</h2>
<p>API keys authenticate your requests to the Pilot API.</p>

<h2 id="creating-key">Creating an API Key</h2>
<ol>
<li>Navigate to <strong>Ari → API Access</strong></li>
<li>Click <strong>Generate API Key</strong></li>
<li>Give the key a descriptive name</li>
<li>Copy the key immediately</li>
</ol>

<div data-callout data-callout-type="info">Store your API key securely. Never expose it in client-side code.</div>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"webhooks","title":"Webhooks"},{"categoryId":"ari","articleSlug":"custom-tools","title":"Custom Tools"}]''></div>',
    description = 'Use the API for custom integrations.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'api-access';

UPDATE platform_hc_articles 
SET content = '<p>Once you''ve configured Ari, it''s time to install the widget on your website.</p>

<h2 id="embed-code">Getting the Embed Code</h2>
<div data-stepbystep>
<div data-step data-step-number="1" data-step-title="Navigate to Ari → Installation">Open the Ari configurator, then click Installation.</div>
<div data-step data-step-number="2" data-step-title="Copy the Embed Code">Click the copy button to copy the embed code snippet.</div>
<div data-step data-step-number="3" data-step-title="Paste into Your Website">Add the code before the closing &lt;/body&gt; tag.</div>
</div>

<div data-callout data-callout-type="info">The embed code should be placed just before the closing &lt;/body&gt; tag.</div>

<h2 id="testing">Testing Your Installation</h2>
<ol>
<li>Visit your website</li>
<li>Look for the chat launcher</li>
<li>Click to open and test</li>
<li>Check your <a data-article-link data-category-id="inbox" data-article-slug="overview" href="/help-center?category=inbox&article=overview">Inbox</a></li>
</ol>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"appearance","title":"Customizing Appearance"},{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Adding Knowledge Sources"}]''></div>',
    description = 'Add Ari to your website in minutes.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'installation';

-- INBOX (2 articles)

UPDATE platform_hc_articles 
SET content = '<p>The Inbox is where you manage all conversations between Ari and your visitors.</p>

<h2 id="layout">Inbox Layout</h2>
<ul>
<li><strong>Sidebar</strong> – Filters and navigation</li>
<li><strong>Conversation List</strong> – All conversations matching your filters</li>
<li><strong>Conversation Detail</strong> – The selected conversation''s messages</li>
</ul>

<div data-callout data-callout-type="tip">Translation works automatically based on detected language.</div>

<div data-related-articles data-articles=''[{"categoryId":"inbox","articleSlug":"takeover","title":"Human Takeover"},{"categoryId":"leads","articleSlug":"overview","title":"Lead Management"}]''></div>',
    description = 'View and manage all visitor conversations.',
    updated_at = NOW()
WHERE category_id = 'inbox' AND slug = 'overview';

UPDATE platform_hc_articles 
SET content = '<p>The takeover feature lets you seamlessly step in and take control of a conversation.</p>

<h2 id="how-to-takeover">How to Take Over</h2>
<ol>
<li>Open the conversation in the <a data-article-link data-category-id="inbox" data-article-slug="overview" href="/help-center?category=inbox&article=overview">Inbox</a></li>
<li>Click the <strong>Take Over</strong> button</li>
<li>The visitor will see that a human has joined</li>
<li>Start typing your response</li>
</ol>

<div data-callout data-callout-type="info">When you take over, Ari stops responding automatically.</div>

<div data-related-articles data-articles=''[{"categoryId":"inbox","articleSlug":"overview","title":"Managing Conversations"},{"categoryId":"settings","articleSlug":"notifications","title":"Notification Preferences"}]''></div>',
    description = 'Take over conversations from Ari when needed.',
    updated_at = NOW()
WHERE category_id = 'inbox' AND slug = 'takeover';

-- LEADS (2 articles)

UPDATE platform_hc_articles 
SET content = '<p>The Leads section helps you manage and track potential customers.</p>

<h2 id="lead-sources">How Leads Are Captured</h2>
<ul>
<li>Submit a <a data-article-link data-category-id="ari" data-article-slug="lead-capture" href="/help-center?category=ari&article=lead-capture">contact form</a> before chatting</li>
<li>Provide email or phone during a conversation</li>
<li>Book an appointment through calendar integration</li>
</ul>

<div data-callout data-callout-type="tip">Customize your stages to match your sales process.</div>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"lead-capture","title":"Lead Capture Settings"},{"categoryId":"inbox","articleSlug":"overview","title":"Managing Conversations"}]''></div>',
    description = 'Capture and manage leads from conversations.',
    updated_at = NOW()
WHERE category_id = 'leads' AND slug = 'overview';

UPDATE platform_hc_articles 
SET content = '<p>Lead stages help you organize and track leads through your sales process.</p>

<h2 id="customizing-stages">Customizing Stages</h2>
<div data-stepbystep>
<div data-step data-step-number="1" data-step-title="Open the Manage Stages dialog">Navigate to Leads and click Manage Stages.</div>
<div data-step data-step-number="2" data-step-title="Add a new stage">Click Add Stage, enter a name and choose a color.</div>
<div data-step data-step-number="3" data-step-title="Set a default stage">Click the star icon to set default for new leads.</div>
<div data-step data-step-number="4" data-step-title="Reorder stages">Drag and drop to change order.</div>
</div>

<div data-callout data-callout-type="tip">Keep your stage count manageable – 5-7 stages is ideal.</div>

<div data-related-articles data-articles=''[{"categoryId":"leads","articleSlug":"overview","title":"Lead Management"}]''></div>',
    description = 'Organize leads with customizable stages.',
    updated_at = NOW()
WHERE category_id = 'leads' AND slug = 'stages';

-- PLANNER (1 article)

UPDATE platform_hc_articles 
SET content = '<p>The Planner helps you manage appointments, showings, and events.</p>

<h2 id="calendar-integration">Calendar Integration</h2>
<ul>
<li><strong>Google Calendar</strong> – Full two-way sync</li>
<li><strong>Microsoft Outlook</strong> – Full two-way sync</li>
</ul>

<div data-callout data-callout-type="info">Events from connected calendars sync automatically.</div>

<h2 id="ai-appointments">AI-Booked Appointments</h2>
<p>Configure Ari''s booking behavior in <a data-article-link data-category-id="ari" data-article-slug="custom-tools" href="/help-center?category=ari&article=custom-tools">Custom Tools</a>.</p>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"custom-tools","title":"Custom Tools"},{"categoryId":"leads","articleSlug":"overview","title":"Lead Management"}]''></div>',
    description = 'Schedule and manage bookings with the Planner.',
    updated_at = NOW()
WHERE category_id = 'planner' AND slug = 'overview';

-- ANALYTICS (2 articles)

UPDATE platform_hc_articles 
SET content = '<p>The Analytics section gives you insights into how Ari is performing.</p>

<h2 id="key-metrics">Key Metrics</h2>
<ul>
<li><strong>Total Conversations</strong> – Number of chat sessions started</li>
<li><strong>Leads Captured</strong> – Visitors who shared contact info</li>
<li><strong>Bookings Made</strong> – Appointments scheduled through Ari</li>
</ul>

<div data-callout data-callout-type="tip">Use peak time data to ensure your team is available during high-traffic periods.</div>

<h2 id="reports">Building Reports</h2>
<p>See the <a data-article-link data-category-id="analytics" data-article-slug="report-builder" href="/help-center?category=analytics&article=report-builder">Report Builder guide</a> for detailed instructions.</p>

<div data-related-articles data-articles=''[{"categoryId":"analytics","articleSlug":"report-builder","title":"Report Builder"},{"categoryId":"inbox","articleSlug":"overview","title":"Managing Conversations"}]''></div>',
    description = 'Gain insights from your conversation analytics.',
    updated_at = NOW()
WHERE category_id = 'analytics' AND slug = 'overview';

UPDATE platform_hc_articles 
SET content = '<p>The Report Builder helps you create comprehensive reports to share with your team.</p>

<h2 id="accessing-report-builder">Accessing Report Builder</h2>
<div data-stepbystep>
<div data-step data-step-number="1" data-step-title="Open Analytics">Navigate to Analytics from the sidebar.</div>
<div data-step data-step-number="2" data-step-title="Go to Reports Tab">Click the Reports tab.</div>
<div data-step data-step-number="3" data-step-title="Click Build Report">Click Build Report to open configuration.</div>
</div>

<div data-callout data-callout-type="tip">Start with a focused report featuring 2-3 sections.</div>

<div data-related-articles data-articles=''[{"categoryId":"analytics","articleSlug":"overview","title":"Analytics Overview"}]''></div>',
    description = 'Create and schedule custom reports.',
    updated_at = NOW()
WHERE category_id = 'analytics' AND slug = 'report-builder';

-- SETTINGS (7 articles)

UPDATE platform_hc_articles 
SET content = '<p>General settings control your organization''s basic information.</p>

<div data-callout data-callout-type="info">This information may appear on invoices and reports.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"profile","title":"Profile Settings"}]''></div>',
    description = 'Configure organization information and preferences.',
    updated_at = NOW()
WHERE category_id = 'settings' AND slug = 'general';

UPDATE platform_hc_articles 
SET content = '<p>Your profile contains your personal information and preferences.</p>

<div data-callout data-callout-type="tip">Use a clear, professional photo.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"general","title":"General Settings"}]''></div>',
    description = 'Manage your personal profile information.',
    updated_at = NOW()
WHERE category_id = 'settings' AND slug = 'profile';

UPDATE platform_hc_articles 
SET content = '<p>Invite team members to collaborate on Pilot.</p>

<div data-callout data-callout-type="info">Invitations expire after 7 days.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"general","title":"General Settings"}]''></div>',
    description = 'Invite team members and manage roles.',
    updated_at = NOW()
WHERE category_id = 'settings' AND slug = 'team';

UPDATE platform_hc_articles 
SET content = '<p>Manage your Pilot subscription, update payment methods, and view invoices.</p>

<div data-callout data-callout-type="info">When you upgrade, you''re immediately charged a prorated amount.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"usage","title":"Usage"}]''></div>',
    description = 'Manage your subscription and billing.',
    updated_at = NOW()
WHERE category_id = 'settings' AND slug = 'billing';

UPDATE platform_hc_articles 
SET content = '<p>The Usage page shows how your team is using Pilot.</p>

<div data-callout data-callout-type="tip">Rising takeover rates might indicate gaps in Ari''s knowledge.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"billing","title":"Billing & Subscription"}]''></div>',
    description = 'Monitor your conversation and API usage.',
    updated_at = NOW()
WHERE category_id = 'settings' AND slug = 'usage';

UPDATE platform_hc_articles 
SET content = '<p>Control how and when Pilot notifies you about important events.</p>

<div data-callout data-callout-type="tip">Enable email notifications for critical events you shouldn''t miss.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"team","title":"Managing Your Team"}]''></div>',
    description = 'Control how and when you receive notifications.',
    updated_at = NOW()
WHERE category_id = 'settings' AND slug = 'notifications';

UPDATE platform_hc_articles 
SET content = '<p>Sessions show you where your account is currently logged in.</p>

<div data-callout data-callout-type="warning">If you see a session you don''t recognize, sign it out immediately and change your password.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"profile","title":"Profile Settings"}]''></div>',
    description = 'Manage your active login sessions.',
    updated_at = NOW()
WHERE category_id = 'settings' AND slug = 'sessions';