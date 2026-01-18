/**
 * Profile Settings Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function ProfileSettingsArticle() {
  return (
    <>
      <p>
        Your profile contains your personal information and preferences. 
        Keep it updated so your team can identify you and communicate effectively.
      </p>

      <h2 id="accessing-profile">Accessing Your Profile</h2>
      <ol>
        <li>Click <strong>Settings</strong> in the sidebar</li>
        <li>Select the <strong>Profile</strong> tab</li>
      </ol>

      <h2 id="profile-information">Profile Information</h2>
      <p>
        You can update the following:
      </p>
      <ul>
        <li><strong>Display Name:</strong> How your name appears to team members</li>
        <li><strong>Email:</strong> Your contact email (used for notifications)</li>
        <li><strong>Avatar:</strong> Your profile picture</li>
      </ul>

      <h3 id="changing-avatar">Changing Your Avatar</h3>
      <ol>
        <li>Click on your current avatar or the placeholder</li>
        <li>Upload a new image</li>
        <li>The image is cropped and saved automatically</li>
      </ol>

      <KBCallout variant="tip">
        Use a clear, professional photo. It helps team members identify you 
        in conversations and team lists.
      </KBCallout>

      <h2 id="company-information">Company Information</h2>
      <p>
        If you're the account owner, you can also set:
      </p>
      <ul>
        <li><strong>Company Name:</strong> Your organization's name</li>
        <li><strong>Company Address:</strong> Business address</li>
        <li><strong>Company Phone:</strong> Main contact number</li>
      </ul>

      <KBCallout variant="info">
        Company information may be used in invoices, notifications, 
        and other system-generated content.
      </KBCallout>

      <h2 id="saving-changes">Saving Changes</h2>
      <p>
        Profile changes save automatically. You'll see a confirmation when 
        your updates have been saved successfully.
      </p>

      <h2 id="email-changes">Changing Your Email</h2>
      <p>
        To change your login email:
      </p>
      <ol>
        <li>Update the email field in your profile</li>
        <li>You may need to verify the new email address</li>
        <li>Use the new email for future logins</li>
      </ol>

      <h2 id="privacy">Privacy Notes</h2>
      <ul>
        <li>Your email is visible to team admins</li>
        <li>Your display name is visible to all team members</li>
        <li>Your avatar appears in conversations you handle</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'settings', articleSlug: 'general', title: 'General Settings' },
          { categoryId: 'settings', articleSlug: 'notifications', title: 'Notification Settings' },
        ]}
      />
    </>
  );
}
