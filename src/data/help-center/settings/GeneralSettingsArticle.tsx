/**
 * General Settings Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function GeneralSettingsArticle() {
  return (
    <>
      <p>
        General settings control your organization's basic information and 
        preferences that apply across the platform.
      </p>

      <h2 id="accessing-general">Accessing General Settings</h2>
      <ol>
        <li>Click <strong>Settings</strong> in the sidebar</li>
        <li>The <strong>General</strong> tab is selected by default</li>
      </ol>

      <h2 id="organization-info">Organization Information</h2>
      <p>
        Set up your organization's basic details:
      </p>
      <ul>
        <li><strong>Organization Name:</strong> Your company or business name</li>
        <li><strong>Contact Email:</strong> Primary email for account communications</li>
        <li><strong>Phone Number:</strong> Business phone number</li>
        <li><strong>Address:</strong> Business address</li>
      </ul>

      <KBCallout variant="info">
        This information may appear on invoices, reports, and other 
        system-generated documents.
      </KBCallout>

      <h2 id="timezone">Timezone Settings</h2>
      <p>
        Set your organization's default timezone:
      </p>
      <ul>
        <li>Affects how times are displayed in the interface</li>
        <li>Used for scheduling and booking features</li>
        <li>Applied to analytics and reports</li>
      </ul>

      <KBCallout variant="tip">
        If you have multiple locations in different timezones, set the 
        timezone for each location in the Locations settings.
      </KBCallout>

      <h2 id="preferences">Preferences</h2>
      <p>
        Customize how Pilot works for your organization:
      </p>
      <ul>
        <li><strong>Date format:</strong> How dates are displayed</li>
        <li><strong>Time format:</strong> 12-hour or 24-hour clock</li>
        <li><strong>Week start:</strong> Sunday or Monday</li>
      </ul>

      <h2 id="data-management">Data Management</h2>
      <p>
        Options for managing your organization's data:
      </p>
      <ul>
        <li><strong>Export data:</strong> Download your organization's data</li>
        <li><strong>Data retention:</strong> How long data is kept</li>
      </ul>

      <h2 id="danger-zone">Account Actions</h2>
      <p>
        Critical account actions:
      </p>
      <ul>
        <li><strong>Delete account:</strong> Permanently delete your account and all data</li>
      </ul>

      <KBCallout variant="warning">
        Deleting your account is permanent and cannot be undone. 
        All data, including conversations, leads, and settings, will be lost.
      </KBCallout>

      <h2 id="saving-changes">Saving Changes</h2>
      <p>
        Most settings save automatically when you make changes. 
        You'll see a confirmation message when changes are saved.
      </p>

      <KBRelatedArticles
        articles={[
          { categoryId: 'settings', articleSlug: 'profile', title: 'Profile Settings' },
          { categoryId: 'settings', articleSlug: 'team', title: 'Managing Your Team' },
        ]}
      />
    </>
  );
}
