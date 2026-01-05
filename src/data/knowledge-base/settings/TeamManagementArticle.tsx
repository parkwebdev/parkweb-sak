/**
 * Managing Your Team Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function TeamManagementArticle() {
  return (
    <>
      <p>
        Invite team members to collaborate on Pilot. Assign roles to control 
        what each person can access and do.
      </p>

      <h2 id="inviting-members">Inviting Team Members</h2>
      <ol>
        <li>Go to Settings → Team</li>
        <li>Click <strong>Invite Member</strong></li>
        <li>Enter their email address</li>
        <li>Select a role</li>
        <li>Send the invitation</li>
      </ol>

      <KBCallout variant="info">
        Invited members receive an email with a link to create their account 
        and join your team.
      </KBCallout>

      <h2 id="roles">Understanding Roles</h2>
      <p>
        Each role has different permissions:
      </p>

      <h3 id="admin">Admin</h3>
      <ul>
        <li>Full access to all features</li>
        <li>Manage team members and roles</li>
        <li>Access billing and subscription</li>
        <li>Configure Ari and all settings</li>
      </ul>

      <h3 id="manager">Manager</h3>
      <ul>
        <li>View and manage conversations</li>
        <li>Manage leads and bookings</li>
        <li>View analytics</li>
        <li>Cannot access billing or team management</li>
      </ul>

      <h3 id="agent">Agent</h3>
      <ul>
        <li>View and respond to conversations</li>
        <li>View leads (limited actions)</li>
        <li>Cannot access settings or analytics</li>
      </ul>

      <h2 id="changing-roles">Changing Roles</h2>
      <p>
        Update a team member's role:
      </p>
      <ol>
        <li>Go to Settings → Team</li>
        <li>Click the member's row</li>
        <li>Select a new role</li>
        <li>Save changes</li>
      </ol>

      <h2 id="removing-members">Removing Team Members</h2>
      <p>
        When someone leaves your organization:
      </p>
      <ol>
        <li>Go to Settings → Team</li>
        <li>Click the member's row</li>
        <li>Click <strong>Remove</strong></li>
        <li>Confirm the removal</li>
      </ol>

      <KBCallout variant="warning">
        Removed members immediately lose access. Any conversations they were 
        handling will need to be reassigned.
      </KBCallout>

      <h2 id="pending-invitations">Pending Invitations</h2>
      <p>
        View and manage pending invitations:
      </p>
      <ul>
        <li>See who hasn't accepted yet</li>
        <li>Resend invitation emails</li>
        <li>Cancel invitations if needed</li>
      </ul>
    </>
  );
}
