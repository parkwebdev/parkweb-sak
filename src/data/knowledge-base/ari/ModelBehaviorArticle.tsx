/**
 * Model & Behavior Settings Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function ModelBehaviorArticle() {
  return (
    <>
      <p>
        The Model & Behavior settings control how Ari thinks and responds. 
        These settings affect the quality, speed, and style of responses.
      </p>

      <h2 id="ai-model">AI Model Selection</h2>
      <p>
        Pilot supports multiple AI models, each with different capabilities:
      </p>
      <ul>
        <li><strong>GPT-4o</strong> – Best for complex reasoning and nuanced responses</li>
        <li><strong>GPT-4o Mini</strong> – Fast and efficient for most use cases</li>
        <li><strong>Claude 3.5</strong> – Excellent for detailed, thoughtful responses</li>
      </ul>

      <KBCallout variant="tip">
        GPT-4o Mini offers the best balance of speed and quality for most businesses.
      </KBCallout>

      <h2 id="temperature">Temperature Setting</h2>
      <p>
        Temperature controls how creative or predictable Ari's responses are:
      </p>
      <ul>
        <li><strong>Low (0.0-0.3)</strong> – Consistent, predictable responses. Best for factual Q&A.</li>
        <li><strong>Medium (0.4-0.7)</strong> – Balanced creativity and consistency.</li>
        <li><strong>High (0.8-1.0)</strong> – More varied, creative responses. Use with caution.</li>
      </ul>

      <h2 id="max-tokens">Max Tokens</h2>
      <p>
        This limits how long Ari's responses can be. A token is roughly 4 characters.
        Longer limits allow for more detailed responses but may affect speed.
      </p>

      <h2 id="system-prompt">System Prompt</h2>
      <p>
        The system prompt defines Ari's personality, tone, and guidelines. This is where you:
      </p>
      <ul>
        <li>Set the communication style (formal, casual, friendly)</li>
        <li>Define what Ari should and shouldn't discuss</li>
        <li>Provide business-specific instructions</li>
        <li>Set boundaries and escalation rules</li>
      </ul>

      <KBCallout variant="warning">
        Avoid including sensitive information in the system prompt as it may be 
        referenced in responses.
      </KBCallout>
    </>
  );
}
