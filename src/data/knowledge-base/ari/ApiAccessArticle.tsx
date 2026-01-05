/**
 * API Access Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function ApiAccessArticle() {
  return (
    <>
      <p>
        The Pilot API allows developers to interact with Ari programmatically. 
        Build custom integrations, automate workflows, or embed Ari in your 
        own applications.
      </p>

      <KBCallout variant="warning">
        API Access is an advanced feature intended for developers. 
        You'll need programming knowledge to use the API effectively.
      </KBCallout>

      <h2 id="api-keys">API Keys</h2>
      <p>
        API keys authenticate your requests to the Pilot API:
      </p>
      <ul>
        <li>Each key has a unique identifier</li>
        <li>Keys can be named for easy management</li>
        <li>Rate limits protect against abuse</li>
        <li>Keys can be revoked if compromised</li>
      </ul>

      <h2 id="creating-key">Creating an API Key</h2>
      <ol>
        <li>Navigate to <strong>Ari → API Access</strong></li>
        <li>Click <strong>Generate API Key</strong></li>
        <li>Give the key a descriptive name</li>
        <li>Copy the key immediately (it won't be shown again)</li>
      </ol>

      <KBCallout variant="info">
        Store your API key securely. Never expose it in client-side code, 
        public repositories, or share it with unauthorized users.
      </KBCallout>

      <h2 id="api-endpoint">API Endpoint</h2>
      <p>
        Your unique API endpoint is displayed in the API Access section:
      </p>
      <ul>
        <li>Base URL for all API requests</li>
        <li>Unique to your agent</li>
        <li>Use with your API key for authentication</li>
      </ul>

      <h2 id="use-cases">API Use Cases</h2>
      <ul>
        <li><strong>Custom chat interfaces:</strong> Embed Ari in your mobile app</li>
        <li><strong>Backend integrations:</strong> Process conversations server-side</li>
        <li><strong>Automation:</strong> Trigger Ari responses from workflows</li>
        <li><strong>Analytics:</strong> Pull conversation data for custom reporting</li>
        <li><strong>Testing:</strong> Automated testing of Ari's responses</li>
      </ul>

      <h2 id="authentication">Authentication</h2>
      <p>
        Include your API key in request headers:
      </p>
      <ul>
        <li>Header name: <code>X-API-Key</code></li>
        <li>Header value: Your API key</li>
      </ul>

      <h2 id="rate-limits">Rate Limits</h2>
      <p>
        API requests are rate-limited to ensure fair usage:
      </p>
      <ul>
        <li><strong>Per minute:</strong> Limited requests per minute</li>
        <li><strong>Per day:</strong> Daily request quota</li>
        <li>Limits are displayed in the API Access section</li>
        <li>Exceeding limits returns a 429 error</li>
      </ul>

      <KBCallout variant="tip">
        Monitor your API usage in the API Access section. If you consistently 
        hit rate limits, contact support about increasing your quota.
      </KBCallout>

      <h2 id="managing-keys">Managing API Keys</h2>

      <h3 id="viewing-usage">Viewing Usage</h3>
      <p>
        Track how your API keys are being used:
      </p>
      <ul>
        <li>Total requests made</li>
        <li>Last used timestamp</li>
        <li>Request counts by time period</li>
      </ul>

      <h3 id="revoking-keys">Revoking Keys</h3>
      <p>
        If a key is compromised or no longer needed:
      </p>
      <ol>
        <li>Find the key in the API Keys list</li>
        <li>Click <strong>Revoke</strong></li>
        <li>Confirm the revocation</li>
      </ol>

      <KBCallout variant="warning">
        Revoking a key is immediate and cannot be undone. Any applications 
        using that key will stop working immediately.
      </KBCallout>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Use separate API keys for different applications</li>
        <li>Name keys descriptively (e.g., "Mobile App Production")</li>
        <li>Rotate keys periodically for security</li>
        <li>Monitor usage for unexpected patterns</li>
        <li>Never commit API keys to version control</li>
        <li>Use environment variables for key storage</li>
      </ul>

      <h2 id="error-handling">Error Handling</h2>
      <p>
        Common API errors:
      </p>
      <ul>
        <li><strong>401 Unauthorized:</strong> Invalid or missing API key</li>
        <li><strong>403 Forbidden:</strong> Key doesn't have permission</li>
        <li><strong>429 Too Many Requests:</strong> Rate limit exceeded</li>
        <li><strong>500 Internal Error:</strong> Server-side issue, retry later</li>
      </ul>

      <h2 id="support">Getting Help</h2>
      <p>
        For API-related questions:
      </p>
      <ul>
        <li>View API use cases by clicking "View Use Cases"</li>
        <li>Check the API documentation for detailed endpoint info</li>
        <li>Contact support for integration assistance</li>
      </ul>
    </>
  );
}
