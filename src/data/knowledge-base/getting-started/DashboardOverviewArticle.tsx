/**
 * Dashboard Overview Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function DashboardOverviewArticle() {
  return (
    <>
      <p>
        The Dashboard is your command center after completing initial setup. 
        It provides a quick overview of your Ari deployment status and key actions.
      </p>

      <KBCallout variant="info">
        The Dashboard is only visible to account administrators after completing 
        the initial setup checklist. Team members will see the Inbox as their default view.
      </KBCallout>

      <h2 id="accessing-dashboard">Accessing the Dashboard</h2>
      <p>
        The Dashboard appears after you've completed the initial setup checklist. 
        Before that, you'll see the "Get Set Up" page with your setup progress.
      </p>

      <KBCallout variant="tip">
        Complete all setup steps to unlock the Dashboard. This includes 
        configuring Ari, adding knowledge, and installing the widget.
      </KBCallout>

      <h2 id="dashboard-sections">Dashboard Sections</h2>

      <h3 id="status-overview">Status Overview</h3>
      <p>
        At a glance, see:
      </p>
      <ul>
        <li>Whether Ari is deployed and active</li>
        <li>Your subscription status</li>
        <li>Quick links to common actions</li>
      </ul>

      <h3 id="quick-actions">Quick Actions</h3>
      <p>
        Jump to frequently used features:
      </p>
      <ul>
        <li><strong>View Conversations:</strong> Check recent chats in the Inbox</li>
        <li><strong>Manage Leads:</strong> Review captured leads</li>
        <li><strong>Configure Ari:</strong> Adjust AI settings</li>
        <li><strong>Invite Team:</strong> Add team members</li>
      </ul>

      <h3 id="help-resources">Help Resources</h3>
      <p>
        Access helpful resources:
      </p>
      <ul>
        <li>Explore the Knowledge Base (this help center)</li>
        <li>View documentation and guides</li>
      </ul>

      <h2 id="setup-checklist">Setup Checklist</h2>
      <p>
        If you haven't completed setup, you'll see progress indicators for:
      </p>
      <ol>
        <li>Configure Ari's personality and behavior</li>
        <li>Add knowledge sources</li>
        <li>Customize widget appearance</li>
        <li>Install the widget on your website</li>
      </ol>

      <KBCallout variant="tip">
        Complete all setup steps to ensure Ari works optimally. Each step 
        builds on the previous one for the best visitor experience.
      </KBCallout>

      <h2 id="navigation">Navigating from Dashboard</h2>
      <p>
        From the Dashboard, you can quickly access:
      </p>
      <ul>
        <li><strong>Sidebar:</strong> Main navigation to all features</li>
        <li><strong>Settings:</strong> Configure your account and team</li>
        <li><strong>Ari:</strong> Adjust AI configuration</li>
      </ul>

      <h2 id="permissions">Dashboard Permissions</h2>
      <p>
        The Dashboard is visible to users with the <strong>View Dashboard</strong> 
        permission. All roles have this permission by default.
      </p>

      <KBRelatedArticles
        articles={[
          { categoryId: 'analytics', articleSlug: 'overview', title: 'Analytics Overview' },
          { categoryId: 'inbox', articleSlug: 'overview', title: 'Inbox Overview' },
        ]}
      />
    </>
  );
}
