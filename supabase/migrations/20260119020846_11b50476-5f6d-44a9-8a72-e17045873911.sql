-- Fix the 2 articles that failed due to SQL escaping issues

UPDATE platform_hc_articles 
SET content = '<p><strong>Ari</strong> is your AI-powered assistant that engages with website visitors 24/7. Built on advanced language models, Ari can understand context, provide helpful responses, and take actions on behalf of your business.</p>

<h2 id="what-ari-does">What Ari Can Do</h2>
<p>Ari is designed to handle a wide range of customer interactions:</p>

<div data-feature-grid data-columns="2">
<div data-feature-card data-feature-icon="MessageTextCircle01" data-feature-title="Answer Questions" data-feature-description="Using your knowledge base, Ari provides natural, conversational responses about your products, services, and policies."></div>
<div data-feature-card data-feature-icon="Users01" data-feature-title="Capture Leads" data-feature-description="Ari collects visitor information like name, email, and phone, automatically creating leads in your CRM."></div>
<div data-feature-card data-feature-icon="Calendar" data-feature-title="Schedule Appointments" data-feature-description="When integrated with your calendar, Ari checks availability and books appointments during conversations."></div>
<div data-feature-card data-feature-icon="Repeat04" data-feature-title="Hand Off to Humans" data-feature-description="For complex issues, Ari seamlessly transfers conversations to your team with full context."></div>
</div>

<div data-callout data-callout-type="tip"><strong>Best Practice</strong> Start with a focused set of knowledge sources and gradually expand. This helps Ari provide more accurate responses.</div>

<h2 id="how-ari-works">How Ari Works</h2>
<p>Behind the scenes, Ari uses several technologies to provide intelligent responses:</p>
<ol>
<li><strong>Natural Language Understanding</strong> – Ari comprehends the intent behind visitor messages</li>
<li><strong>Knowledge Retrieval</strong> – Relevant information is pulled from your knowledge base</li>
<li><strong>Response Generation</strong> – A contextual, helpful response is crafted</li>
<li><strong>Action Execution</strong> – When needed, Ari can trigger actions like creating leads or bookings</li>
</ol>

<h2 id="customizing-ari">Customizing Ari</h2>
<p>Every business is unique, so Ari is highly customizable:</p>
<ul>
<li><strong>Personality</strong> – Define how Ari communicates (formal, friendly, professional)</li>
<li><strong>Appearance</strong> – Match your brand colors with gradient headers</li>
<li><strong>Behavior</strong> – Control when Ari asks for information or offers assistance</li>
<li><strong>Knowledge</strong> – Add content from websites, documents, or manual entries</li>
</ul>

<h2 id="getting-started-ari">Getting Started</h2>
<p>Ready to configure your AI agent? Start with these sections:</p>
<ul>
<li><a data-article-link data-category-id="ari" data-article-slug="system-prompt" href="/help-center?category=ari&article=system-prompt">System Prompt</a> – Define Ari''s personality and guidelines</li>
<li><a data-article-link data-category-id="ari" data-article-slug="knowledge-sources" href="/help-center?category=ari&article=knowledge-sources">Knowledge</a> – Add sources for Ari to learn from</li>
<li><a data-article-link data-category-id="ari" data-article-slug="appearance" href="/help-center?category=ari&article=appearance">Appearance</a> – Customize the look of the chat widget</li>
</ul>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Adding Knowledge Sources"},{"categoryId":"ari","articleSlug":"installation","title":"Installing the Widget"}]''></div>',
    description = 'Learn what Ari is and how it can help your business.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'overview';

UPDATE platform_hc_articles 
SET content = '<p>The System Prompt is the foundation of Ari''s personality and behavior. It''s a set of instructions that guides how Ari responds to visitors, handles conversations, and represents your brand.</p>

<h2 id="what-is-system-prompt">What is a System Prompt?</h2>
<p>Think of the system prompt as Ari''s "job description." It tells Ari:</p>
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
<li>You''ll see a large text area with your current prompt</li>
</ol>

<h2 id="writing-tips">Tips for Writing Effective Prompts</h2>

<h3 id="be-specific">Be Specific About Identity</h3>
<p>Start by clearly defining who Ari is:</p>
<ul>
<li>"You are Ari, a friendly assistant for [Company Name]..."</li>
<li>Include your company''s mission or values</li>
<li>Specify the industry or context</li>
</ul>

<h3 id="set-tone">Set the Tone</h3>
<p>Define how Ari should communicate:</p>
<ul>
<li><strong>Professional:</strong> "Use formal language and maintain a business-like tone"</li>
<li><strong>Friendly:</strong> "Be warm, approachable, and use conversational language"</li>
<li><strong>Helpful:</strong> "Always prioritize solving the visitor''s problem"</li>
</ul>

<h3 id="include-guidelines">Include Specific Guidelines</h3>
<p>Add rules for common scenarios:</p>
<ul>
<li>"Always offer to schedule a tour when discussing properties"</li>
<li>"If asked about pricing, provide general ranges and offer to connect with a specialist"</li>
<li>"Never discuss competitor products"</li>
</ul>

<div data-callout data-callout-type="tip">Use bullet points in your system prompt to make instructions clear and easy for Ari to follow. Short, direct sentences work better than long paragraphs.</div>

<h2 id="example-prompt">Example System Prompt</h2>
<p>Here''s a template you can customize:</p>
<blockquote>
<p>You are Ari, a helpful assistant for [Company Name]. Your role is to welcome visitors, answer their questions, and help them find what they need.</p>
<p>Guidelines:</p>
<ul>
<li>Be friendly and professional</li>
<li>Keep responses concise but helpful</li>
<li>Offer to schedule appointments when appropriate</li>
<li>If you don''t know something, admit it and offer to connect with a team member</li>
</ul>
</blockquote>

<h2 id="auto-save">Auto-Save Feature</h2>
<p>Your changes are automatically saved as you type. You''ll see a confirmation when your prompt has been saved successfully.</p>

<div data-callout data-callout-type="info">Changes to the system prompt take effect immediately for new conversations. Existing conversations will continue with the previous prompt.</div>

<h2 id="testing-changes">Testing Your Changes</h2>
<p>After updating your system prompt:</p>
<ol>
<li>Open your website where Ari is installed</li>
<li>Start a new conversation</li>
<li>Test different scenarios to see how Ari responds</li>
<li>Refine your prompt based on the results</li>
</ol>

<div data-related-articles data-articles=''[{"categoryId":"ari","articleSlug":"knowledge-sources","title":"Knowledge Sources"},{"categoryId":"ari","articleSlug":"appearance","title":"Customizing Appearance"}]''></div>',
    description = 'Define Ari''s personality and guidelines.',
    updated_at = NOW()
WHERE category_id = 'ari' AND slug = 'system-prompt';