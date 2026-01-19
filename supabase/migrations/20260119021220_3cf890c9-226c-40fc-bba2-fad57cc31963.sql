UPDATE platform_hc_articles 
SET content = $$<p><strong>Ari</strong> is your AI-powered assistant that engages with website visitors 24/7. Built on advanced language models, Ari can understand context, provide helpful responses, and take actions on behalf of your business.</p>

<h2 id="what-ari-does">What Ari Can Do</h2>
<p>Ari is designed to handle a wide range of customer interactions:</p>

<div data-hc-feature-grid data-columns="2">
  <div data-hc-feature-card>
    <div data-hc-feature-icon>💬</div>
    <h3>Answer Questions</h3>
    <p>Using your knowledge base, Ari provides natural, conversational responses about your products, services, and policies.</p>
  </div>
  <div data-hc-feature-card>
    <div data-hc-feature-icon>👥</div>
    <h3>Capture Leads</h3>
    <p>Ari collects visitor information like name, email, and phone, automatically creating leads in your CRM.</p>
  </div>
  <div data-hc-feature-card>
    <div data-hc-feature-icon>📅</div>
    <h3>Schedule Appointments</h3>
    <p>When integrated with your calendar, Ari checks availability and books appointments during conversations.</p>
  </div>
  <div data-hc-feature-card>
    <div data-hc-feature-icon>🔄</div>
    <h3>Hand Off to Humans</h3>
    <p>For complex issues, Ari seamlessly transfers conversations to your team with full context.</p>
  </div>
</div>

<div data-hc-callout data-variant="tip" data-title="Best Practice">
  <p>Start with a focused set of knowledge sources and gradually expand. This helps Ari provide more accurate responses.</p>
</div>

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
  <li><a href="/help/ari/system-prompt">System Prompt</a> – Define Ari's personality and guidelines</li>
  <li><a href="/help/ari/knowledge-sources">Knowledge</a> – Add sources for Ari to learn from</li>
  <li><a href="/help/ari/appearance">Appearance</a> – Customize the look of the chat widget</li>
</ul>

<div data-hc-related-articles>
  <h3>Related Articles</h3>
  <ul>
    <li><a href="/help/ari/knowledge-sources">Adding Knowledge Sources</a></li>
    <li><a href="/help/ari/installation">Installing the Widget</a></li>
  </ul>
</div>$$,
    updated_at = NOW()
WHERE id = 'd06d857c-bf1b-4113-9e0e-baf0cd24c2cc';