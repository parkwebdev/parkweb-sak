/**
 * Navigating the App Article
 * 
 * Learn how to navigate around Pilot efficiently.
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';

export default function NavigationArticle() {
  return (
    <>
      <p>
        Pilot is designed to be intuitive and easy to navigate. This guide will help you 
        find your way around the platform quickly.
      </p>

      <h2 id="sidebar-navigation">Sidebar Navigation</h2>
      <p>
        The main navigation is located in the left sidebar. It provides quick access to 
        all major sections of Pilot:
      </p>
      <ul>
        <li><strong>Dashboard</strong> – Your command center with key metrics at a glance</li>
        <li><strong>Ari</strong> – Configure and manage your AI agent</li>
        <li><strong>Inbox</strong> – View and manage all conversations</li>
        <li><strong>Planner</strong> – Calendar and booking management</li>
        <li><strong>Leads</strong> – Track and organize captured leads</li>
        <li><strong>Analytics</strong> – Insights and performance metrics</li>
        <li><strong>Knowledge Base</strong> – Documentation and help articles (you're here!)</li>
      </ul>

      <KBCallout variant="tip" title="Collapse the Sidebar">
        The sidebar automatically collapses when you move your mouse away, giving you more 
        screen space. Hover over it to expand.
      </KBCallout>

      <h2 id="global-search">Global Search</h2>
      <p>
        Press <kbd>⌘K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows) to open the global search. 
        From here you can:
      </p>
      <ul>
        <li>Search for conversations by visitor name or content</li>
        <li>Find leads quickly</li>
        <li>Navigate to any section of the app</li>
        <li>Access settings and preferences</li>
      </ul>

      <h2 id="keyboard-shortcuts">Keyboard Shortcuts</h2>
      <p>
        Power users can navigate faster with these keyboard shortcuts:
      </p>
      <table>
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd></td>
            <td>Open global search</td>
          </tr>
          <tr>
            <td><kbd>⌥D</kbd> / <kbd>Alt+D</kbd></td>
            <td>Go to Dashboard</td>
          </tr>
          <tr>
            <td><kbd>⌥A</kbd> / <kbd>Alt+A</kbd></td>
            <td>Go to Ari configuration</td>
          </tr>
          <tr>
            <td><kbd>⌥C</kbd> / <kbd>Alt+C</kbd></td>
            <td>Go to Inbox (Conversations)</td>
          </tr>
          <tr>
            <td><kbd>⌥L</kbd> / <kbd>Alt+L</kbd></td>
            <td>Go to Leads</td>
          </tr>
          <tr>
            <td><kbd>⌥P</kbd> / <kbd>Alt+P</kbd></td>
            <td>Go to Planner</td>
          </tr>
          <tr>
            <td><kbd>⌥Y</kbd> / <kbd>Alt+Y</kbd></td>
            <td>Go to Analytics</td>
          </tr>
          <tr>
            <td><kbd>⌥S</kbd> / <kbd>Alt+S</kbd></td>
            <td>Go to Settings</td>
          </tr>
        </tbody>
      </table>

      <h2 id="settings-menu">Settings & Account</h2>
      <p>
        Click on your profile avatar in the bottom of the sidebar to access:
      </p>
      <ul>
        <li><strong>Profile settings</strong> – Update your personal information</li>
        <li><strong>Team management</strong> – Invite and manage team members</li>
        <li><strong>Billing</strong> – Manage your subscription and payments</li>
        <li><strong>Notifications</strong> – Configure alert preferences</li>
        <li><strong>Theme</strong> – Switch between light and dark mode</li>
      </ul>

      <p>
        You can also access Settings by clicking the gear icon in the sidebar or 
        using the keyboard shortcut.
      </p>

      <h2 id="mobile-access">Mobile Access</h2>
      <p>
        Pilot is fully responsive and works on mobile devices. The sidebar becomes a 
        slide-out menu on smaller screens, and all features remain accessible.
      </p>

      <KBCallout variant="info">
        For the best experience on mobile, consider adding Pilot to your home screen 
        as a Progressive Web App (PWA). This gives you a native app-like experience 
        with quick access from your device.
      </KBCallout>

      <KBRelatedArticles
        articles={[
          { categoryId: 'getting-started', articleSlug: 'welcome', title: 'Welcome to Pilot' },
          { categoryId: 'getting-started', articleSlug: 'quick-start', title: 'Quick Start Guide' },
          { categoryId: 'getting-started', articleSlug: 'dashboard', title: 'Dashboard Overview' },
        ]}
      />
    </>
  );
}
