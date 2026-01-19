UPDATE platform_hc_articles 
SET content = '<p>Invite team members to collaborate on Pilot.</p>

<h2 id="inviting-members">Inviting Team Members</h2>
<ol>
<li>Go to <strong>Settings → Team</strong></li>
<li>Click <strong>Invite Member</strong></li>
<li>Enter their email address</li>
<li>Select their role</li>
<li>Click <strong>Send Invitation</strong></li>
</ol>

<h2 id="roles">Team Roles</h2>
<ul>
<li><strong>Admin</strong> – Full access to all features and settings</li>
<li><strong>Manager</strong> – Can manage conversations, leads, and view analytics</li>
<li><strong>Agent</strong> – Can handle conversations and view assigned leads</li>
</ul>

<div data-callout data-callout-type="info">Invitations expire after 7 days. You can resend an invitation if it expires.</div>

<h2 id="managing-members">Managing Existing Members</h2>
<p>From the Team page, you can:</p>
<ul>
<li>Change a member''s role</li>
<li>Remove team members</li>
<li>View invitation status</li>
<li>Resend pending invitations</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"settings","articleSlug":"general","title":"General Settings"}]''></div>',
    description = 'Invite team members and manage roles.',
    updated_at = NOW()
WHERE category_id = 'settings' AND slug = 'team';