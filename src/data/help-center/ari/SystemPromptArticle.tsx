/**
 * System Prompt Article
 */

import { HCCallout, HCRelatedArticles } from '@/components/help-center';

export default function SystemPromptArticle() {
  return (
    <>
      <p>
        The System Prompt is the foundation of Ari's personality and behavior. 
        It's a set of instructions that guides how Ari responds to visitors, 
        handles conversations, and represents your brand.
      </p>

      <h2 id="what-is-system-prompt">What is a System Prompt?</h2>
      <p>
        Think of the system prompt as Ari's "job description." It tells Ari:
      </p>
      <ul>
        <li>Who it is and what role it plays</li>
        <li>How to communicate (tone, style, formality)</li>
        <li>What topics to focus on or avoid</li>
        <li>How to handle specific situations</li>
      </ul>

      <h2 id="accessing-system-prompt">Accessing the System Prompt</h2>
      <ol>
        <li>Navigate to <strong>Ari</strong> from the sidebar</li>
        <li>Select <strong>System Prompt</strong> in the configuration menu</li>
        <li>You'll see a large text area with your current prompt</li>
      </ol>

      <h2 id="writing-tips">Tips for Writing Effective Prompts</h2>
      
      <h3 id="be-specific">Be Specific About Identity</h3>
      <p>
        Start by clearly defining who Ari is:
      </p>
      <ul>
        <li>"You are Ari, a friendly assistant for [Company Name]..."</li>
        <li>Include your company's mission or values</li>
        <li>Specify the industry or context</li>
      </ul>

      <h3 id="set-tone">Set the Tone</h3>
      <p>
        Define how Ari should communicate:
      </p>
      <ul>
        <li><strong>Professional:</strong> "Use formal language and maintain a business-like tone"</li>
        <li><strong>Friendly:</strong> "Be warm, approachable, and use conversational language"</li>
        <li><strong>Helpful:</strong> "Always prioritize solving the visitor's problem"</li>
      </ul>

      <h3 id="include-guidelines">Include Specific Guidelines</h3>
      <p>
        Add rules for common scenarios:
      </p>
      <ul>
        <li>"Always offer to schedule a tour when discussing properties"</li>
        <li>"If asked about pricing, provide general ranges and offer to connect with a specialist"</li>
        <li>"Never discuss competitor products"</li>
      </ul>

      <HCCallout variant="tip">
        Use bullet points in your system prompt to make instructions clear and easy 
        for Ari to follow. Short, direct sentences work better than long paragraphs.
      </HCCallout>

      <h2 id="example-prompt">Example System Prompt</h2>
      <p>
        Here's a template you can customize:
      </p>
      <blockquote>
        <p>
          You are Ari, a helpful assistant for [Company Name]. Your role is to 
          welcome visitors, answer their questions, and help them find what they need.
        </p>
        <p>
          Guidelines:
        </p>
        <ul>
          <li>Be friendly and professional</li>
          <li>Keep responses concise but helpful</li>
          <li>Offer to schedule appointments when appropriate</li>
          <li>If you don't know something, admit it and offer to connect with a team member</li>
        </ul>
      </blockquote>

      <h2 id="auto-save">Auto-Save Feature</h2>
      <p>
        Your changes are automatically saved as you type. You'll see a confirmation 
        when your prompt has been saved successfully.
      </p>

      <HCCallout variant="info">
        Changes to the system prompt take effect immediately for new conversations. 
        Existing conversations will continue with the previous prompt.
      </HCCallout>

      <h2 id="testing-changes">Testing Your Changes</h2>
      <p>
        After updating your system prompt:
      </p>
      <ol>
        <li>Open your website where Ari is installed</li>
        <li>Start a new conversation</li>
        <li>Test different scenarios to see how Ari responds</li>
        <li>Refine your prompt based on the results</li>
      </ol>

      <HCRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'knowledge-sources', title: 'Knowledge Sources' },
          { categoryId: 'ari', articleSlug: 'appearance', title: 'Customizing Appearance' },
        ]}
      />
    </>
  );
}
