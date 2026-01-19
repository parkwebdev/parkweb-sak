-- Complete all remaining Help Center articles with full content from TSX sources
-- This migration updates 13 articles that were previously stubs

-- ========================================
-- SETTINGS CATEGORY (7 articles)
-- ========================================

-- 1. General Settings
UPDATE platform_hc_articles
SET content = '<p>General settings control your organization''s basic information and how it appears throughout Pilot.</p>

<h2 id="organization-info">Organization Information</h2>
<p>Your organization settings include:</p>
<ul>
  <li><strong>Organization Name</strong> – Displayed in reports and team invites</li>
  <li><strong>Business Type</strong> – Helps Ari understand your industry context</li>
  <li><strong>Timezone</strong> – Used for analytics, scheduling, and timestamps</li>
  <li><strong>Default Language</strong> – Primary language for your team interface</li>
</ul>

<h2 id="branding">Branding Settings</h2>
<p>Upload your logo and configure brand colors that appear in:</p>
<ul>
  <li>Email notifications</li>
  <li>PDF reports</li>
  <li>Team invitation emails</li>
</ul>

<div data-callout data-callout-type="info">This information may appear on invoices and reports sent to your team and customers.</div>

<h2 id="data-preferences">Data Preferences</h2>
<p>Configure how Pilot handles your data:</p>
<ul>
  <li><strong>Data Retention</strong> – How long conversation history is kept</li>
  <li><strong>Export Settings</strong> – Default formats for data exports</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"profile","title":"Profile Settings"},{"categoryId":"settings","articleSlug":"billing","title":"Billing & Subscription"}]''></div>',
    updated_at = now()
WHERE slug = 'general' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'settings');

-- 2. Profile Settings
UPDATE platform_hc_articles
SET content = '<p>Your profile contains your personal information and preferences that affect how you interact with Pilot.</p>

<h2 id="personal-info">Personal Information</h2>
<p>Update your profile details:</p>
<ul>
  <li><strong>Display Name</strong> – How your name appears to team members and in conversations</li>
  <li><strong>Email Address</strong> – Used for notifications and account recovery</li>
  <li><strong>Phone Number</strong> – Optional, for SMS notifications if enabled</li>
  <li><strong>Avatar</strong> – Your profile photo shown in conversations and team views</li>
</ul>

<div data-callout data-callout-type="tip">Use a clear, professional photo so your team and visitors can easily identify you during conversations.</div>

<h2 id="preferences">Display Preferences</h2>
<p>Customize your Pilot experience:</p>
<ul>
  <li><strong>Theme</strong> – Choose between light, dark, or system theme</li>
  <li><strong>Language</strong> – Your preferred interface language</li>
  <li><strong>Date Format</strong> – How dates are displayed throughout the app</li>
  <li><strong>Time Format</strong> – 12-hour or 24-hour clock</li>
</ul>

<h2 id="changing-password">Changing Your Password</h2>
<p>To update your password:</p>
<ol>
  <li>Click <strong>Change Password</strong></li>
  <li>Enter your current password</li>
  <li>Enter and confirm your new password</li>
  <li>Click <strong>Save</strong></li>
</ol>

<div data-callout data-callout-type="info">Password changes take effect immediately. You may need to sign in again on other devices.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"general","title":"General Settings"},{"categoryId":"settings","articleSlug":"sessions","title":"Active Sessions"}]''></div>',
    updated_at = now()
WHERE slug = 'profile' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'settings');

-- 3. Team Management
UPDATE platform_hc_articles
SET content = '<p>Invite team members to collaborate on Pilot and manage their access levels.</p>

<h2 id="inviting-members">Inviting Team Members</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Go to Team Settings" data-step-description="Navigate to Settings → Team from the sidebar."></div>
  <div data-step data-step-number="2" data-step-title="Click Invite Member" data-step-description="Click the Invite Member button in the top right."></div>
  <div data-step data-step-number="3" data-step-title="Enter Email Address" data-step-description="Enter the email address of the person you want to invite."></div>
  <div data-step data-step-number="4" data-step-title="Select Role" data-step-description="Choose the appropriate role for the new team member."></div>
  <div data-step data-step-number="5" data-step-title="Send Invitation" data-step-description="Click Send Invite. They''ll receive an email with instructions."></div>
</div>

<div data-callout data-callout-type="info">Invitations expire after 7 days. You can resend an invitation if it expires.</div>

<h2 id="team-roles">Team Roles</h2>
<p>Pilot offers different roles with varying permissions:</p>
<ul>
  <li><strong>Owner</strong> – Full access including billing and account deletion</li>
  <li><strong>Admin</strong> – Can manage team, settings, and all features</li>
  <li><strong>Member</strong> – Can use Inbox, Leads, and Planner</li>
  <li><strong>Viewer</strong> – Read-only access to conversations and leads</li>
</ul>

<h2 id="managing-members">Managing Existing Members</h2>
<p>For each team member, you can:</p>
<ul>
  <li>Change their role</li>
  <li>Revoke their access</li>
  <li>View their activity history</li>
</ul>

<div data-callout data-callout-type="warning">Removing a team member is immediate. They will lose access to all Pilot features instantly.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"general","title":"General Settings"},{"categoryId":"settings","articleSlug":"notifications","title":"Notification Preferences"}]''></div>',
    updated_at = now()
WHERE slug = 'team' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'settings');

-- 4. Billing & Subscription
UPDATE platform_hc_articles
SET content = '<p>Manage your Pilot subscription, update payment methods, and view invoices.</p>

<h2 id="current-plan">Your Current Plan</h2>
<p>View your subscription details including:</p>
<ul>
  <li><strong>Plan Name</strong> – Your current subscription tier</li>
  <li><strong>Billing Cycle</strong> – Monthly or annual billing</li>
  <li><strong>Next Billing Date</strong> – When your next payment is due</li>
  <li><strong>Included Features</strong> – What''s available on your plan</li>
</ul>

<h2 id="upgrading">Upgrading Your Plan</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Go to Billing" data-step-description="Navigate to Settings → Billing."></div>
  <div data-step data-step-number="2" data-step-title="Click Upgrade" data-step-description="Click the Upgrade button next to your current plan."></div>
  <div data-step data-step-number="3" data-step-title="Choose New Plan" data-step-description="Select the plan that best fits your needs."></div>
  <div data-step data-step-number="4" data-step-title="Confirm Payment" data-step-description="Review the prorated amount and confirm."></div>
</div>

<div data-callout data-callout-type="info">When you upgrade, you''re immediately charged a prorated amount for the remainder of your billing period.</div>

<h2 id="payment-methods">Payment Methods</h2>
<p>Add or update your payment information:</p>
<ul>
  <li>Credit or debit cards</li>
  <li>Update expiring cards before they expire</li>
  <li>Set a default payment method</li>
</ul>

<h2 id="invoices">Invoices & Receipts</h2>
<p>Access your billing history:</p>
<ul>
  <li>View past invoices</li>
  <li>Download PDF receipts</li>
  <li>Update billing email address</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"usage","title":"Usage"},{"categoryId":"settings","articleSlug":"team","title":"Managing Your Team"}]''></div>',
    updated_at = now()
WHERE slug = 'billing' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'settings');

-- 5. Usage
UPDATE platform_hc_articles
SET content = '<p>The Usage page shows how your team is using Pilot and helps you understand consumption patterns.</p>

<h2 id="key-metrics">Key Usage Metrics</h2>
<p>Track your team''s activity:</p>
<ul>
  <li><strong>Total Conversations</strong> – Number of chat sessions this period</li>
  <li><strong>Messages Sent</strong> – AI and human messages combined</li>
  <li><strong>Leads Captured</strong> – New contacts collected</li>
  <li><strong>Appointments Booked</strong> – Calendar events created via Ari</li>
</ul>

<h2 id="ai-usage">AI Usage</h2>
<p>Monitor your AI consumption:</p>
<ul>
  <li><strong>AI Responses</strong> – Messages generated by Ari</li>
  <li><strong>Knowledge Queries</strong> – RAG searches performed</li>
  <li><strong>Tool Calls</strong> – External API calls made by Ari</li>
</ul>

<div data-callout data-callout-type="tip">Rising takeover rates might indicate gaps in Ari''s knowledge. Check your knowledge sources if takeovers are increasing.</div>

<h2 id="team-activity">Team Activity</h2>
<p>See how your team is engaging:</p>
<ul>
  <li><strong>Active Users</strong> – Team members who logged in</li>
  <li><strong>Takeovers</strong> – Conversations where humans stepped in</li>
  <li><strong>Response Times</strong> – Average time to first human response</li>
</ul>

<h2 id="usage-trends">Usage Trends</h2>
<p>View historical data to identify patterns:</p>
<ul>
  <li>Daily, weekly, or monthly views</li>
  <li>Peak usage hours</li>
  <li>Growth over time</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"billing","title":"Billing & Subscription"},{"categoryId":"analytics","articleSlug":"overview","title":"Analytics Overview"}]''></div>',
    updated_at = now()
WHERE slug = 'usage' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'settings');

-- 6. Notifications
UPDATE platform_hc_articles
SET content = '<p>Control how and when Pilot notifies you about important events.</p>

<h2 id="notification-channels">Notification Channels</h2>
<p>Choose how you want to receive notifications:</p>
<ul>
  <li><strong>In-App</strong> – Notifications within Pilot (always on)</li>
  <li><strong>Email</strong> – Delivered to your account email</li>
  <li><strong>Browser Push</strong> – Desktop notifications when Pilot is closed</li>
  <li><strong>Mobile Push</strong> – If you have the mobile app installed</li>
</ul>

<h2 id="event-types">Notification Events</h2>
<p>Configure notifications for different events:</p>

<h3>Conversations</h3>
<ul>
  <li>New conversation started</li>
  <li>Takeover requested by visitor</li>
  <li>Conversation assigned to you</li>
  <li>New message in taken-over conversation</li>
</ul>

<h3>Leads</h3>
<ul>
  <li>New lead captured</li>
  <li>Lead assigned to you</li>
  <li>Lead stage changed</li>
</ul>

<h3>Calendar</h3>
<ul>
  <li>New appointment booked</li>
  <li>Appointment cancelled</li>
  <li>Appointment reminder</li>
</ul>

<div data-callout data-callout-type="tip">Enable email notifications for critical events you shouldn''t miss, like takeover requests and new lead assignments.</div>

<h2 id="quiet-hours">Quiet Hours</h2>
<p>Set times when you don''t want to receive notifications:</p>
<ul>
  <li>Define start and end times</li>
  <li>Choose which days apply</li>
  <li>Set timezone for quiet hours</li>
</ul>

<div data-callout data-callout-type="info">Critical notifications like security alerts will still be delivered during quiet hours.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"team","title":"Managing Your Team"},{"categoryId":"inbox","articleSlug":"takeover","title":"Human Takeover"}]''></div>',
    updated_at = now()
WHERE slug = 'notifications' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'settings');

-- 7. Active Sessions
UPDATE platform_hc_articles
SET content = '<p>Sessions show you where your account is currently logged in, helping you maintain security.</p>

<h2 id="viewing-sessions">Viewing Active Sessions</h2>
<p>For each session, you can see:</p>
<ul>
  <li><strong>Device Type</strong> – Desktop, mobile, or tablet</li>
  <li><strong>Browser</strong> – Chrome, Firefox, Safari, etc.</li>
  <li><strong>Location</strong> – Approximate location based on IP</li>
  <li><strong>Last Active</strong> – When the session was last used</li>
  <li><strong>Current Session</strong> – Marked if it''s your current browser</li>
</ul>

<div data-callout data-callout-type="warning">If you see a session you don''t recognize, sign it out immediately and change your password.</div>

<h2 id="managing-sessions">Managing Sessions</h2>
<p>You can manage your active sessions:</p>
<ul>
  <li><strong>Sign Out</strong> – End a specific session</li>
  <li><strong>Sign Out All</strong> – End all sessions except current</li>
</ul>

<h2 id="security-tips">Security Best Practices</h2>
<ul>
  <li>Review your sessions regularly</li>
  <li>Sign out from shared or public computers</li>
  <li>Enable two-factor authentication for added security</li>
  <li>Use unique, strong passwords</li>
</ul>

<div data-callout data-callout-type="tip">If you''re signing out of a session on a device you still use, you''ll need to sign in again on that device.</div>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"profile","title":"Profile Settings"},{"categoryId":"settings","articleSlug":"team","title":"Managing Your Team"}]''></div>',
    updated_at = now()
WHERE slug = 'sessions' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'settings');

-- ========================================
-- INBOX CATEGORY (2 articles)
-- ========================================

-- 8. Inbox Overview
UPDATE platform_hc_articles
SET content = '<p>The Inbox is your central hub for managing all conversations between Ari and your visitors.</p>

<h2 id="layout">Inbox Layout</h2>
<p>The Inbox is organized into three main areas:</p>
<ul>
  <li><strong>Sidebar</strong> – Filters, folders, and navigation</li>
  <li><strong>Conversation List</strong> – All conversations matching your current filters</li>
  <li><strong>Conversation Detail</strong> – The selected conversation''s messages and actions</li>
</ul>

<h2 id="filters">Filtering Conversations</h2>
<p>Use filters to find specific conversations:</p>
<ul>
  <li><strong>Status</strong> – Active, waiting, closed</li>
  <li><strong>Assigned To</strong> – Filter by team member</li>
  <li><strong>Location</strong> – If you have multiple locations</li>
  <li><strong>Date Range</strong> – Conversations from specific time periods</li>
  <li><strong>Has Lead</strong> – Only conversations with captured leads</li>
</ul>

<h2 id="conversation-actions">Conversation Actions</h2>
<p>For each conversation, you can:</p>
<ul>
  <li><strong>Take Over</strong> – Step in and respond as a human</li>
  <li><strong>Assign</strong> – Assign to a team member</li>
  <li><strong>Close</strong> – Mark the conversation as resolved</li>
  <li><strong>View Lead</strong> – Jump to the associated lead profile</li>
</ul>

<div data-callout data-callout-type="tip">Use keyboard shortcuts for faster navigation: <kbd>J</kbd>/<kbd>K</kbd> to move between conversations, <kbd>T</kbd> to take over.</div>

<h2 id="translation">Automatic Translation</h2>
<p>Pilot automatically detects the visitor''s language and can translate messages in real-time. You can:</p>
<ul>
  <li>View original message text</li>
  <li>See translated version</li>
  <li>Reply in your language (auto-translated for visitor)</li>
</ul>

<div data-callout data-callout-type="info">Translation works automatically based on detected language. No configuration needed.</div>

<h2 id="search">Searching Conversations</h2>
<p>Use the search bar to find conversations by:</p>
<ul>
  <li>Visitor name or email</li>
  <li>Message content</li>
  <li>Lead information</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"inbox","articleSlug":"takeover","title":"Human Takeover"},{"categoryId":"leads","articleSlug":"overview","title":"Lead Management"}]''></div>',
    updated_at = now()
WHERE slug = 'overview' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'inbox');

-- 9. Human Takeover
UPDATE platform_hc_articles
SET content = '<p>The takeover feature lets you seamlessly step in and take control of a conversation from Ari.</p>

<h2 id="when-to-takeover">When to Take Over</h2>
<p>Consider taking over when:</p>
<ul>
  <li>The visitor requests to speak with a human</li>
  <li>The conversation involves complex or sensitive issues</li>
  <li>Ari is struggling to answer correctly</li>
  <li>You want to personally close a sale or booking</li>
</ul>

<h2 id="how-to-takeover">How to Take Over</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Open the Conversation" data-step-description="Find and select the conversation in your Inbox."></div>
  <div data-step data-step-number="2" data-step-title="Click Take Over" data-step-description="Click the Take Over button in the conversation header."></div>
  <div data-step data-step-number="3" data-step-title="Visitor Notification" data-step-description="The visitor will see a message that a human has joined the chat."></div>
  <div data-step data-step-number="4" data-step-title="Start Responding" data-step-description="Type your message and send. You''re now in control."></div>
</div>

<div data-callout data-callout-type="info">When you take over, Ari stops responding automatically. All messages from this point will be from you.</div>

<h2 id="during-takeover">During a Takeover</h2>
<p>While you''re in control:</p>
<ul>
  <li>All your messages are marked as coming from you</li>
  <li>You can see Ari''s suggested responses (optional)</li>
  <li>You have access to the visitor''s lead profile</li>
  <li>You can use quick replies and saved responses</li>
</ul>

<h2 id="returning-to-ai">Returning to AI</h2>
<p>When you''re done:</p>
<ul>
  <li>Click <strong>Return to Ari</strong> to let the AI resume</li>
  <li>Or click <strong>Close Conversation</strong> to end the chat</li>
</ul>

<div data-callout data-callout-type="tip">Before returning to Ari, add a summary note so the AI has context for any follow-up questions.</div>

<h2 id="takeover-notifications">Getting Notified</h2>
<p>Set up notifications to know when takeovers are needed:</p>
<ul>
  <li>Visitor explicitly requests human help</li>
  <li>Ari indicates low confidence</li>
  <li>Conversation has been waiting too long</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"inbox","articleSlug":"overview","title":"Managing Conversations"},{"categoryId":"settings","articleSlug":"notifications","title":"Notification Preferences"}]''></div>',
    updated_at = now()
WHERE slug = 'takeover' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'inbox');

-- ========================================
-- LEADS CATEGORY (2 articles)
-- ========================================

-- 10. Leads Overview
UPDATE platform_hc_articles
SET content = '<p>The Leads section helps you manage and track potential customers captured through Ari.</p>

<h2 id="lead-sources">How Leads Are Captured</h2>
<p>Visitors become leads when they:</p>
<ul>
  <li>Submit a <a data-article-link data-category-id="ari" data-article-slug="lead-capture">contact form</a> before chatting</li>
  <li>Provide their email or phone during a conversation</li>
  <li>Book an appointment through calendar integration</li>
  <li>Are manually added by your team</li>
</ul>

<h2 id="lead-list">The Lead List</h2>
<p>View all your leads with key information:</p>
<ul>
  <li><strong>Name & Contact</strong> – Email, phone, company</li>
  <li><strong>Stage</strong> – Where they are in your pipeline</li>
  <li><strong>Assigned To</strong> – Team member responsible</li>
  <li><strong>Last Activity</strong> – Most recent interaction</li>
  <li><strong>Source</strong> – How they were captured</li>
</ul>

<h2 id="lead-views">List vs. Kanban View</h2>
<p>Toggle between two views:</p>
<ul>
  <li><strong>List View</strong> – Traditional table with sorting and filtering</li>
  <li><strong>Kanban View</strong> – Visual pipeline with drag-and-drop stages</li>
</ul>

<div data-callout data-callout-type="tip">Customize your stages to match your sales process. Keep it simple – 5-7 stages is ideal for most teams.</div>

<h2 id="lead-actions">Managing Leads</h2>
<p>For each lead, you can:</p>
<ul>
  <li>View their full profile and history</li>
  <li>See all associated conversations</li>
  <li>Add notes and comments</li>
  <li>Change their stage</li>
  <li>Assign to team members</li>
  <li>Schedule follow-ups</li>
</ul>

<h2 id="lead-search">Finding Leads</h2>
<p>Use search and filters to find specific leads:</p>
<ul>
  <li>Search by name, email, phone, or company</li>
  <li>Filter by stage, assignee, or date range</li>
  <li>Sort by any column</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"leads","articleSlug":"stages","title":"Lead Stages"},{"categoryId":"ari","articleSlug":"lead-capture","title":"Lead Capture Settings"},{"categoryId":"inbox","articleSlug":"overview","title":"Managing Conversations"}]''></div>',
    updated_at = now()
WHERE slug = 'overview' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'leads');

-- 11. Lead Stages
UPDATE platform_hc_articles
SET content = '<p>Lead stages help you organize and track leads through your sales process.</p>

<h2 id="default-stages">Default Stages</h2>
<p>Pilot comes with these default stages:</p>
<ul>
  <li><strong>New</strong> – Freshly captured leads</li>
  <li><strong>Contacted</strong> – Initial outreach made</li>
  <li><strong>Qualified</strong> – Confirmed as a good fit</li>
  <li><strong>Proposal</strong> – Offer or quote sent</li>
  <li><strong>Won</strong> – Successfully converted</li>
  <li><strong>Lost</strong> – Did not convert</li>
</ul>

<h2 id="customizing-stages">Customizing Stages</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Open the Manage Stages Dialog" data-step-description="Navigate to Leads and click Manage Stages in the toolbar."></div>
  <div data-step data-step-number="2" data-step-title="Add a New Stage" data-step-description="Click Add Stage, enter a name, and choose a color."></div>
  <div data-step data-step-number="3" data-step-title="Set a Default Stage" data-step-description="Click the star icon next to a stage to make it the default for new leads."></div>
  <div data-step data-step-number="4" data-step-title="Reorder Stages" data-step-description="Drag and drop stages to change their order in the pipeline."></div>
</div>

<div data-callout data-callout-type="tip">Keep your stage count manageable – 5-7 stages is ideal for most sales processes.</div>

<h2 id="stage-colors">Stage Colors</h2>
<p>Colors help you quickly identify lead status:</p>
<ul>
  <li>Use consistent colors across your team</li>
  <li>Consider color meanings (green for won, red for lost)</li>
  <li>Colors appear in Kanban view and badges</li>
</ul>

<h2 id="moving-leads">Moving Leads Between Stages</h2>
<p>Change a lead''s stage by:</p>
<ul>
  <li>Dragging in Kanban view</li>
  <li>Selecting from dropdown in list view</li>
  <li>Updating in the lead detail panel</li>
</ul>

<div data-callout data-callout-type="info">Stage changes are tracked in the lead''s activity history.</div>

<h2 id="stage-automation">Stage-Based Actions</h2>
<p>Configure what happens when leads enter certain stages:</p>
<ul>
  <li>Send notification to team member</li>
  <li>Trigger webhook to external system</li>
  <li>Assign to specific team member</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"leads","articleSlug":"overview","title":"Lead Management"},{"categoryId":"ari","articleSlug":"lead-capture","title":"Lead Capture Settings"}]''></div>',
    updated_at = now()
WHERE slug = 'stages' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'leads');

-- ========================================
-- ARI CATEGORY (1 article)
-- ========================================

-- 12. News
UPDATE platform_hc_articles
SET content = '<p>The News feature lets you share updates, blog posts, and stories directly in the chat widget.</p>

<h2 id="news-vs-announcements">News vs. Announcements</h2>
<p>Understanding the difference:</p>
<ul>
  <li><strong>Announcements</strong> – Short, urgent, promotional messages that appear as banners at the top of the widget. Great for sales, limited-time offers, or important notices.</li>
  <li><strong>News</strong> – Longer, informational, evergreen content displayed in a dedicated tab. Think of it like a mini blog or news feed within your widget.</li>
</ul>

<h2 id="enabling-news">Enabling the News Tab</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Go to Ari Settings" data-step-description="Navigate to Ari → Welcome & Messages."></div>
  <div data-step data-step-number="2" data-step-title="Enable News Tab" data-step-description="Toggle on the News tab option in Bottom Navigation."></div>
  <div data-step data-step-number="3" data-step-title="Save Changes" data-step-description="Your widget will now show a News tab."></div>
</div>

<div data-callout data-callout-type="info">Only enable the News tab if you plan to publish content regularly. An empty news feed looks unprofessional.</div>

<h2 id="creating-news">Creating News Items</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Navigate to Ari → News" data-step-description="Open the News section in your Ari configuration."></div>
  <div data-step data-step-number="2" data-step-title="Click Add News Item" data-step-description="Start creating a new news entry."></div>
  <div data-step data-step-number="3" data-step-title="Add Content" data-step-description="Enter a title, optional featured image, and your content."></div>
  <div data-step data-step-number="4" data-step-title="Publish" data-step-description="Toggle the item to published when ready."></div>
</div>

<h2 id="news-content">News Content Tips</h2>
<ul>
  <li>Keep titles short and engaging</li>
  <li>Use featured images to catch attention</li>
  <li>Write scannable content with clear headings</li>
  <li>Include calls to action where appropriate</li>
  <li>Update regularly to keep content fresh</li>
</ul>

<div data-callout data-callout-type="tip">Link news items to relevant Help Articles to provide more context without cluttering the news feed.</div>

<h2 id="managing-news">Managing News Items</h2>
<p>Control your news feed:</p>
<ul>
  <li>Reorder items by dragging</li>
  <li>Unpublish old content</li>
  <li>Edit existing items anytime</li>
  <li>Delete items you no longer need</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"announcements","title":"Announcements"},{"categoryId":"ari","articleSlug":"welcome-messages","title":"Welcome Messages"}]''></div>',
    updated_at = now()
WHERE slug = 'news' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'ari');

-- ========================================
-- ANALYTICS CATEGORY (2 articles)
-- ========================================

-- 13. Analytics Overview
UPDATE platform_hc_articles
SET content = '<p>The Analytics section gives you insights into how Ari is performing and how visitors are engaging with your widget.</p>

<h2 id="key-metrics">Key Metrics</h2>
<p>Track your most important numbers:</p>
<ul>
  <li><strong>Total Conversations</strong> – Number of chat sessions started in the period</li>
  <li><strong>Leads Captured</strong> – Visitors who shared their contact information</li>
  <li><strong>Bookings Made</strong> – Appointments scheduled through Ari</li>
  <li><strong>Takeover Rate</strong> – Percentage of chats requiring human intervention</li>
  <li><strong>Average Response Time</strong> – How quickly Ari responds</li>
  <li><strong>Customer Satisfaction</strong> – Based on end-of-chat ratings</li>
</ul>

<h2 id="time-periods">Viewing Different Periods</h2>
<p>Analyze data across timeframes:</p>
<ul>
  <li>Today / Yesterday</li>
  <li>Last 7 days / Last 30 days</li>
  <li>This month / Last month</li>
  <li>Custom date range</li>
</ul>

<h2 id="conversation-analytics">Conversation Insights</h2>
<p>Understand your conversations better:</p>
<ul>
  <li><strong>Peak Hours</strong> – When visitors are most active</li>
  <li><strong>Average Duration</strong> – How long conversations last</li>
  <li><strong>Messages per Conversation</strong> – Engagement depth</li>
  <li><strong>Resolution Rate</strong> – Chats closed without human help</li>
</ul>

<div data-callout data-callout-type="tip">Use peak hour data to ensure your team is available during high-traffic periods for quick takeovers.</div>

<h2 id="lead-analytics">Lead Analytics</h2>
<p>Track your lead capture performance:</p>
<ul>
  <li><strong>Conversion Rate</strong> – Visitors who become leads</li>
  <li><strong>Lead Sources</strong> – Where leads come from</li>
  <li><strong>Stage Distribution</strong> – Leads by pipeline stage</li>
</ul>

<h2 id="ai-performance">AI Performance</h2>
<p>Monitor how well Ari is doing:</p>
<ul>
  <li><strong>Successful Responses</strong> – Questions answered correctly</li>
  <li><strong>Knowledge Gaps</strong> – Topics where Ari struggles</li>
  <li><strong>Fallback Rate</strong> – How often Ari can''t answer</li>
</ul>

<h2 id="reports">Building Reports</h2>
<p>See the <a data-article-link data-category-id="analytics" data-article-slug="report-builder">Report Builder guide</a> for detailed instructions on creating custom reports.</p>

<div data-related-articles data-articles=''[{"categoryId":"analytics","articleSlug":"report-builder","title":"Report Builder"},{"categoryId":"settings","articleSlug":"usage","title":"Usage"},{"categoryId":"inbox","articleSlug":"overview","title":"Managing Conversations"}]''></div>',
    updated_at = now()
WHERE slug = 'overview' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'analytics');

-- 14. Report Builder
UPDATE platform_hc_articles
SET content = '<p>The Report Builder helps you create comprehensive reports to share with your team or stakeholders.</p>

<h2 id="accessing-report-builder">Accessing Report Builder</h2>
<div data-stepbystep>
  <div data-step data-step-number="1" data-step-title="Open Analytics" data-step-description="Navigate to Analytics from the sidebar."></div>
  <div data-step data-step-number="2" data-step-title="Go to Reports Tab" data-step-description="Click the Reports tab at the top of the page."></div>
  <div data-step data-step-number="3" data-step-title="Click Build Report" data-step-description="Click the Build Report button to open the configuration panel."></div>
</div>

<h2 id="report-sections">Available Report Sections</h2>
<p>Choose which sections to include:</p>
<ul>
  <li><strong>Executive Summary</strong> – High-level overview of key metrics</li>
  <li><strong>Conversation Analytics</strong> – Detailed chat statistics</li>
  <li><strong>Lead Performance</strong> – Capture rates and pipeline status</li>
  <li><strong>AI Performance</strong> – Ari''s accuracy and knowledge gaps</li>
  <li><strong>Team Activity</strong> – Takeovers, response times, activity</li>
  <li><strong>Booking Analytics</strong> – Appointment trends and types</li>
</ul>

<div data-callout data-callout-type="tip">Start with a focused report featuring 2-3 sections. You can always add more sections later.</div>

<h2 id="configuring-reports">Configuring Your Report</h2>
<p>Customize your report:</p>
<ul>
  <li><strong>Date Range</strong> – Select the period to report on</li>
  <li><strong>Comparison</strong> – Compare to previous period</li>
  <li><strong>Branding</strong> – Include your logo and colors</li>
  <li><strong>Format</strong> – Choose PDF or web view</li>
</ul>

<h2 id="scheduling-reports">Scheduled Reports</h2>
<p>Set up automatic report generation:</p>
<ul>
  <li>Daily, weekly, or monthly schedules</li>
  <li>Email delivery to team members</li>
  <li>Consistent time and format</li>
</ul>

<h2 id="sharing-reports">Sharing Reports</h2>
<p>Distribute your reports:</p>
<ul>
  <li>Download as PDF</li>
  <li>Share via email</li>
  <li>Generate shareable link (time-limited)</li>
</ul>

<div data-callout data-callout-type="info">Shared links expire after 7 days for security. Generate a new link if needed.</div>

<div data-related-articles data-articles=''[{"categoryId":"analytics","articleSlug":"overview","title":"Analytics Overview"},{"categoryId":"settings","articleSlug":"usage","title":"Usage"}]''></div>',
    updated_at = now()
WHERE slug = 'report-builder' 
  AND category_id = (SELECT id FROM platform_hc_categories WHERE id = 'analytics');