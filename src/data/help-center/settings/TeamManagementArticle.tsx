/**
 * Managing Your Team Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function TeamManagementArticle() {
  return (
    <>
      <p>
        Invite team members to collaborate on Pilot. Assign roles and customize 
        permissions to control what each person can access and do.
      </p>

      <h2 id="inviting-members">Inviting Team Members</h2>
      <ol>
        <li>Go to <strong>Settings → Team</strong></li>
        <li>Click <strong>Invite Member</strong></li>
        <li>Enter their first name, last name, and email address</li>
        <li>Select a role</li>
        <li>Send the invitation</li>
      </ol>

      <KBCallout variant="info">
        Invited members receive an email with a link to create their account 
        and join your team. Invitations expire after 7 days.
      </KBCallout>

      <h2 id="roles">Understanding Roles</h2>
      <p>
        Pilot has three user roles, each with different default permissions:
      </p>

      <h3 id="admin">Admin</h3>
      <p>
        Full control over everything:
      </p>
      <ul>
        <li>Configure Ari and all agent settings</li>
        <li>Manage team members and roles</li>
        <li>Access billing and subscription</li>
        <li>View and manage all conversations, leads, and bookings</li>
        <li>Set up integrations, webhooks, and API access</li>
      </ul>

      <h3 id="manager">Manager</h3>
      <p>
        Operational access without admin capabilities:
      </p>
      <ul>
        <li>Configure Ari and knowledge sources</li>
        <li>View and manage conversations</li>
        <li>Manage leads and bookings</li>
        <li>View analytics dashboard</li>
        <li>View team members (cannot manage roles)</li>
        <li>Cannot access billing or integrations</li>
      </ul>

      <h3 id="member">Member</h3>
      <p>
        Day-to-day operational access:
      </p>
      <ul>
        <li>View dashboard and analytics</li>
        <li>View and respond to conversations</li>
        <li>View and manage leads</li>
        <li>View bookings</li>
        <li>Cannot configure Ari or access settings</li>
      </ul>

      <h2 id="custom-permissions">Custom Permissions</h2>
      <p>
        Beyond roles, you can customize individual permissions:
      </p>
      <ul>
        <li><strong>Dashboard & Analytics:</strong> View insights and metrics</li>
        <li><strong>Ari Agent:</strong> Configure AI settings</li>
        <li><strong>Conversations:</strong> View and/or manage chats</li>
        <li><strong>Leads:</strong> View and/or manage leads</li>
        <li><strong>Bookings:</strong> View and/or manage calendar</li>
        <li><strong>Knowledge Base:</strong> Manage knowledge sources</li>
        <li><strong>Help Center:</strong> Manage help articles</li>
        <li><strong>Team:</strong> View and/or manage team</li>
        <li><strong>Billing:</strong> View and/or manage subscription</li>
        <li><strong>Integrations:</strong> Connect third-party services</li>
        <li><strong>Webhooks:</strong> Configure webhooks</li>
        <li><strong>API Keys:</strong> Manage API access</li>
      </ul>

      <KBCallout variant="tip">
        Use custom permissions when a role doesn't quite fit. For example, 
        give a member billing view access without full admin rights.
      </KBCallout>

      <h2 id="changing-roles">Changing Roles & Permissions</h2>
      <p>
        Update a team member's access:
      </p>
      <ol>
        <li>Go to <strong>Settings → Team</strong></li>
        <li>Click on the team member's row</li>
        <li>In the dialog, select a new role</li>
        <li>Toggle individual permissions as needed</li>
        <li>Click <strong>Update</strong> to save</li>
      </ol>

      <h2 id="removing-members">Removing Team Members</h2>
      <p>
        When someone leaves your organization:
      </p>
      <ol>
        <li>Go to <strong>Settings → Team</strong></li>
        <li>Click on the team member's row</li>
        <li>Click <strong>Remove Member</strong></li>
        <li>Confirm the removal</li>
      </ol>

      <KBCallout variant="warning">
        Removed members immediately lose access. Any active conversations they 
        were handling will need to be reassigned or returned to Ari.
      </KBCallout>

      <h2 id="pending-invitations">Pending Invitations</h2>
      <p>
        Manage outstanding invitations:
      </p>
      <ul>
        <li>See who hasn't accepted yet</li>
        <li>Resend invitation emails</li>
        <li>Cancel invitations if needed</li>
        <li>Invitations automatically expire after 7 days</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Use the principle of least privilege—give only necessary access</li>
        <li>Review team permissions quarterly</li>
        <li>Remove access immediately when team members leave</li>
        <li>Have at least two Admins for business continuity</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'settings', articleSlug: 'general', title: 'General Settings' },
          { categoryId: 'settings', articleSlug: 'billing', title: 'Billing & Subscription' },
        ]}
      />
    </>
  );
}
