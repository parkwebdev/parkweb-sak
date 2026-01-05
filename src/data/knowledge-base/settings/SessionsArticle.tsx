/**
 * Sessions Settings Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function SessionsArticle() {
  return (
    <>
      <p>
        Sessions show you where your account is currently logged in. 
        Review and manage active sessions to maintain account security.
      </p>

      <h2 id="accessing-sessions">Accessing Sessions</h2>
      <ol>
        <li>Click <strong>Settings</strong> in the sidebar</li>
        <li>Select the <strong>Sessions</strong> tab</li>
      </ol>

      <h2 id="understanding-sessions">Understanding Sessions</h2>
      <p>
        Each session represents an active login:
      </p>
      <ul>
        <li><strong>Current session:</strong> The device you're using now</li>
        <li><strong>Other sessions:</strong> Other devices where you're logged in</li>
      </ul>

      <h3 id="session-details">Session Details</h3>
      <p>
        For each session, you can see:
      </p>
      <ul>
        <li><strong>Device/Browser:</strong> What device was used to log in</li>
        <li><strong>Location:</strong> Approximate location based on IP</li>
        <li><strong>Last active:</strong> When the session was last used</li>
        <li><strong>IP Address:</strong> Network identifier</li>
      </ul>

      <KBCallout variant="info">
        Location is approximate and based on IP address. VPNs and mobile 
        networks may show unexpected locations.
      </KBCallout>

      <h2 id="security-review">Security Review</h2>
      <p>
        Regularly review your sessions to:
      </p>
      <ul>
        <li>Identify unfamiliar devices or locations</li>
        <li>Spot potential unauthorized access</li>
        <li>Clean up old or forgotten logins</li>
      </ul>

      <KBCallout variant="warning">
        If you see a session you don't recognize, sign it out immediately 
        and change your password.
      </KBCallout>

      <h2 id="signing-out">Signing Out Sessions</h2>

      <h3 id="single-session">Signing Out a Single Session</h3>
      <ol>
        <li>Find the session you want to end</li>
        <li>Click <strong>Sign Out</strong> next to it</li>
        <li>The session is terminated immediately</li>
      </ol>

      <h3 id="all-sessions">Signing Out All Sessions</h3>
      <ol>
        <li>Click <strong>Sign Out All Other Sessions</strong></li>
        <li>Confirm the action</li>
        <li>All sessions except your current one are terminated</li>
      </ol>

      <h2 id="when-to-sign-out">When to Sign Out Sessions</h2>
      <ul>
        <li>Using a shared or public computer</li>
        <li>Lost or stolen device</li>
        <li>Suspicious activity detected</li>
        <li>Cleaning up old logins</li>
        <li>After changing your password</li>
      </ul>

      <h2 id="session-expiry">Session Expiry</h2>
      <p>
        Sessions automatically expire after:
      </p>
      <ul>
        <li>Extended periods of inactivity</li>
        <li>Password changes</li>
        <li>Account security events</li>
      </ul>

      <h2 id="best-practices">Security Best Practices</h2>
      <ul>
        <li>Review sessions at least monthly</li>
        <li>Sign out of devices you no longer use</li>
        <li>Use unique, strong passwords</li>
        <li>Enable two-factor authentication when available</li>
        <li>Don't stay logged in on shared computers</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'settings', articleSlug: 'profile', title: 'Profile Settings' },
        ]}
      />
    </>
  );
}
