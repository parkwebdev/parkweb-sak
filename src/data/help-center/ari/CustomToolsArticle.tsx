/**
 * Custom Tools Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBStepByStep } from '@/components/knowledge-base/KBStepByStep';
import { KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';

export default function CustomToolsArticle() {
  return (
    <>
      <p>
        Custom Tools extend Ari's capabilities by connecting to external services 
        and APIs. This is an advanced feature for developers who want to add 
        specialized functionality.
      </p>

      <KBCallout variant="warning">
        Custom Tools require technical knowledge. If you're not a developer, 
        you may want to work with your technical team to set these up.
      </KBCallout>

      <h2 id="what-are-tools">What Are Custom Tools?</h2>
      <p>
        Custom Tools are functions that Ari can call during conversations:
      </p>
      <ul>
        <li>Look up information from your database</li>
        <li>Check inventory or availability</li>
        <li>Calculate pricing or quotes</li>
        <li>Submit forms to external systems</li>
        <li>Trigger actions in third-party services</li>
      </ul>

      <h2 id="how-they-work">How Custom Tools Work</h2>
      <ol>
        <li>You define a tool with a name, description, and parameters</li>
        <li>You provide an API endpoint that handles the tool's logic</li>
        <li>When relevant, Ari calls your endpoint with the parameters</li>
        <li>Your endpoint returns data that Ari uses in its response</li>
      </ol>

      <h2 id="creating-tool">Creating a Custom Tool</h2>
      <KBStepByStep
        steps={[
          {
            title: 'Navigate to Ari → Custom Tools',
            description: 'Open the Ari configurator and select the Custom Tools section.',
          },
          {
            title: 'Click Add Tool',
            description: 'Click the Add Tool button to create a new custom tool.',
          },
          {
            title: 'Enter Tool Details',
            description: 'Provide a name and a clear description of what the tool does (Ari uses this to decide when to call it).',
          },
          {
            title: 'Set the Endpoint URL',
            description: 'Enter the URL of your API endpoint that will handle the tool\'s logic.',
          },
          {
            title: 'Define Parameters',
            description: 'Add the input parameters Ari should collect and pass to your endpoint.',
          },
          {
            title: 'Configure Authentication',
            description: 'Add any required headers (API keys, tokens) for your endpoint.',
          },
          {
            title: 'Test and Enable',
            description: 'Use the test feature to verify it works, then enable the tool.',
          },
        ]}
      />

      <h3 id="tool-configuration">Tool Configuration</h3>
      <ul>
        <li><strong>Name:</strong> Internal identifier (e.g., "check_availability")</li>
        <li><strong>Description:</strong> Explains what the tool does (Ari uses this to decide when to call it)</li>
        <li><strong>Endpoint URL:</strong> Your API endpoint</li>
        <li><strong>Parameters:</strong> Input data the tool accepts</li>
        <li><strong>Headers:</strong> Authentication and custom headers</li>
        <li><strong>Timeout:</strong> Maximum wait time for response</li>
      </ul>

      <KBCallout variant="tip">
        Write clear, specific descriptions. The description helps Ari understand 
        when to use the tool. Example: "Check if a specific unit is available 
        for move-in on a given date."
      </KBCallout>

      <h2 id="parameters">Defining Parameters</h2>
      <p>
        Parameters define what data Ari passes to your tool:
      </p>
      <ul>
        <li><strong>Name:</strong> Parameter identifier</li>
        <li><strong>Type:</strong> string, number, boolean, etc.</li>
        <li><strong>Description:</strong> What the parameter represents</li>
        <li><strong>Required:</strong> Whether it's mandatory</li>
      </ul>

      <h3 id="example-parameters">Example Parameters</h3>
      <p>For a "check_availability" tool:</p>
      <ul>
        <li><code>unit_id</code> (string, required): "The unit to check"</li>
        <li><code>move_in_date</code> (string, required): "Desired move-in date in YYYY-MM-DD format"</li>
        <li><code>lease_term</code> (number, optional): "Lease length in months"</li>
      </ul>

      <h2 id="endpoint-requirements">Endpoint Requirements</h2>
      <p>
        Your API endpoint should:
      </p>
      <ul>
        <li>Accept POST requests with JSON body</li>
        <li>Return JSON responses</li>
        <li>Respond within the configured timeout</li>
        <li>Handle errors gracefully with appropriate status codes</li>
        <li>Be secured with authentication (API key or OAuth)</li>
      </ul>

      <h2 id="authentication">Authentication</h2>
      <p>
        Secure your endpoints:
      </p>
      <ul>
        <li><strong>API Key:</strong> Passed in request headers</li>
        <li><strong>Bearer Token:</strong> OAuth-style authentication</li>
        <li><strong>Custom Headers:</strong> Any headers your API requires</li>
      </ul>

      <KBCallout variant="info">
        Never expose sensitive API keys. Store them securely in the headers 
        configuration, which is encrypted at rest.
      </KBCallout>

      <h2 id="testing">Testing Tools</h2>
      <ol>
        <li>Use the test feature to send sample requests</li>
        <li>Verify responses are formatted correctly</li>
        <li>Check error handling with invalid inputs</li>
        <li>Test in actual conversations before going live</li>
      </ol>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Keep tool descriptions specific and actionable</li>
        <li>Return concise, relevant data (not huge payloads)</li>
        <li>Implement proper error messages</li>
        <li>Set appropriate timeouts (5-10 seconds max)</li>
        <li>Monitor tool performance and errors</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'webhooks', title: 'Webhooks' },
          { categoryId: 'ari', articleSlug: 'api-access', title: 'API Access' },
          { categoryId: 'ari', articleSlug: 'integrations', title: 'Integrations' },
        ]}
      />
    </>
  );
}
