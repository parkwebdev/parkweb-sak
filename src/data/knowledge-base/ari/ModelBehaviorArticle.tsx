/**
 * Model & Behavior Settings Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function ModelBehaviorArticle() {
  return (
    <>
      <p>
        The Model & Behavior settings control how Ari thinks and responds. 
        These settings affect the quality, speed, cost, and style of responses.
      </p>

      <h2 id="ai-model">AI Model Selection</h2>
      <p>
        Pilot supports 12 AI models from leading providers, each with different 
        capabilities and cost tiers:
      </p>

      <h3 id="google-models">Google Models</h3>
      <ul>
        <li><strong>Gemini 2.5 Flash</strong> – Fast and efficient for most use cases (Recommended)</li>
        <li><strong>Gemini 2.5 Pro</strong> – Premium quality for complex reasoning</li>
      </ul>

      <h3 id="openai-models">OpenAI Models</h3>
      <ul>
        <li><strong>ChatGPT-5.1</strong> – Latest flagship with advanced capabilities (Recommended)</li>
        <li><strong>GPT-4o</strong> – Excellent balance of speed and quality</li>
        <li><strong>GPT-4o Mini</strong> – Budget-friendly for simple queries</li>
      </ul>

      <h3 id="anthropic-models">Anthropic Models</h3>
      <ul>
        <li><strong>Claude Sonnet 4</strong> – Best for detailed, thoughtful responses (Recommended)</li>
        <li><strong>Claude Opus 4.1</strong> – Premium quality for complex tasks</li>
        <li><strong>Claude 3.5 Haiku</strong> – Fast and cost-effective</li>
      </ul>

      <h3 id="open-source-models">Open Source Models</h3>
      <ul>
        <li><strong>Qwen 2.5 72B</strong> – Competitive quality at lower cost</li>
        <li><strong>Mistral Medium 3.1</strong> – European-hosted option</li>
        <li><strong>Llama 3.3 70B</strong> – Meta's flagship open model</li>
        <li><strong>DeepSeek V3</strong> – Budget-friendly option</li>
      </ul>

      <KBCallout variant="tip">
        Gemini 2.5 Flash offers the best balance of speed, quality, and cost for most 
        businesses. Consider premium models only for complex reasoning needs.
      </KBCallout>

      <h2 id="cost-tiers">Cost Tiers</h2>
      <p>
        Models are grouped into three cost tiers:
      </p>
      <ul>
        <li><strong>Budget</strong> – Lowest cost per request (~$0.002-0.005)</li>
        <li><strong>Standard</strong> – Balanced cost and quality (~$0.01-0.02)</li>
        <li><strong>Premium</strong> – Highest quality, higher cost (~$0.05-0.10)</li>
      </ul>
      <p>
        Enterprise users see estimated costs per request based on their model and 
        token settings.
      </p>

      <h2 id="response-length">Response Length</h2>
      <p>
        Control how long Ari's responses can be with presets or custom values:
      </p>
      <ul>
        <li><strong>Concise (500 tokens)</strong> – Short, direct answers. Best for FAQs.</li>
        <li><strong>Balanced (2000 tokens)</strong> – Standard responses with good detail.</li>
        <li><strong>Detailed (4000 tokens)</strong> – In-depth explanations when needed.</li>
        <li><strong>Custom</strong> – Set your own token limit (128-8000).</li>
      </ul>

      <KBCallout variant="info">
        A token is roughly 4 characters or 3/4 of a word. 500 tokens is about 
        375 words or 1-2 paragraphs.
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

      <h2 id="advanced-parameters">Advanced Behavior Parameters</h2>
      <p>
        Fine-tune response generation with advanced settings. Not all models support 
        all parameters—unavailable options will be disabled.
      </p>

      <h3 id="top-p">Top P (Nucleus Sampling)</h3>
      <p>
        Controls response diversity by limiting token selection to a probability threshold:
      </p>
      <ul>
        <li><strong>Lower values (0.1-0.5)</strong> – More focused, predictable text</li>
        <li><strong>Higher values (0.8-1.0)</strong> – More diverse vocabulary and ideas</li>
      </ul>
      <p>
        <em>Supported by: All models</em>
      </p>

      <h3 id="top-k">Top K</h3>
      <p>
        Limits token selection to the top K most likely options:
      </p>
      <ul>
        <li><strong>Lower values (1-10)</strong> – Very focused responses</li>
        <li><strong>Higher values (40-100)</strong> – More varied word choices</li>
      </ul>
      <p>
        <em>Supported by: Google and Anthropic models only</em>
      </p>

      <h3 id="presence-penalty">Presence Penalty</h3>
      <p>
        Encourages the model to discuss new topics:
      </p>
      <ul>
        <li><strong>Zero (0.0)</strong> – No penalty for repeating topics</li>
        <li><strong>Positive (0.5-2.0)</strong> – Explores more diverse subjects</li>
      </ul>
      <p>
        <em>Supported by: OpenAI models only</em>
      </p>

      <h3 id="frequency-penalty">Frequency Penalty</h3>
      <p>
        Reduces word and phrase repetition:
      </p>
      <ul>
        <li><strong>Zero (0.0)</strong> – No penalty for repeating words</li>
        <li><strong>Positive (0.5-2.0)</strong> – Avoids repeating the same phrases</li>
      </ul>
      <p>
        <em>Supported by: OpenAI models only</em>
      </p>

      <KBCallout variant="warning">
        Adjusting advanced parameters significantly can produce unexpected results. 
        Start with small changes and test thoroughly.
      </KBCallout>

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

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'system-prompt', title: 'System Prompt' },
          { categoryId: 'ari', articleSlug: 'knowledge', title: 'Knowledge Sources' },
          { categoryId: 'ari', articleSlug: 'overview', title: 'Understanding Ari' },
        ]}
      />
    </>
  );
}
