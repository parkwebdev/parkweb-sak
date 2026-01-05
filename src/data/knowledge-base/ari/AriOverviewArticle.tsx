/**
 * Understanding Ari Article
 * 
 * Learn what Ari is and how it can help your business.
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function AriOverviewArticle() {
  return (
    <>
      <p>
        <strong>Ari</strong> is your AI-powered assistant that engages with website visitors 
        24/7. Built on advanced language models, Ari can understand context, provide helpful 
        responses, and take actions on behalf of your business.
      </p>

      <h2 id="what-ari-does">What Ari Can Do</h2>
      <p>
        Ari is designed to handle a wide range of customer interactions:
      </p>

      <h3 id="answer-questions">Answer Questions</h3>
      <p>
        Using your knowledge base, Ari can answer questions about your products, services, 
        pricing, policies, and more. The responses are natural and conversational, not 
        robotic or scripted.
      </p>

      <h3 id="capture-leads">Capture Leads</h3>
      <p>
        Ari can collect visitor information like name, email, and phone number when 
        appropriate, automatically creating leads in your CRM.
      </p>

      <h3 id="schedule-appointments">Schedule Appointments</h3>
      <p>
        When integrated with your calendar, Ari can check availability and book 
        appointments directly during conversations.
      </p>

      <h3 id="handoff">Hand Off to Humans</h3>
      <p>
        For complex issues that require human attention, Ari can seamlessly transfer 
        the conversation to your team while providing full context.
      </p>

      <KBCallout variant="tip" title="Best Practice">
        Start with a focused set of knowledge sources and gradually expand. 
        This helps Ari provide more accurate responses.
      </KBCallout>

      <h2 id="how-ari-works">How Ari Works</h2>
      <p>
        Behind the scenes, Ari uses several technologies to provide intelligent responses:
      </p>
      <ol>
        <li><strong>Natural Language Understanding</strong> – Ari comprehends the intent behind visitor messages</li>
        <li><strong>Knowledge Retrieval</strong> – Relevant information is pulled from your knowledge base</li>
        <li><strong>Response Generation</strong> – A contextual, helpful response is crafted</li>
        <li><strong>Action Execution</strong> – When needed, Ari can trigger actions like creating leads or bookings</li>
      </ol>

      <h2 id="customizing-ari">Customizing Ari</h2>
      <p>
        Every business is unique, so Ari is highly customizable:
      </p>
      <ul>
        <li><strong>Personality</strong> – Define how Ari communicates (formal, friendly, professional)</li>
        <li><strong>Appearance</strong> – Match your brand colors and add your logo</li>
        <li><strong>Behavior</strong> – Control when Ari asks for information or offers assistance</li>
        <li><strong>Knowledge</strong> – Add content from websites, documents, or manual entries</li>
      </ul>

      <h2 id="getting-started-ari">Getting Started</h2>
      <p>
        Ready to configure your AI agent? Start with these sections:
      </p>
      <ul>
        <li><strong>Model & Behavior</strong> – Choose the AI model and set response parameters</li>
        <li><strong>System Prompt</strong> – Define Ari's personality and guidelines</li>
        <li><strong>Knowledge</strong> – Add sources for Ari to learn from</li>
        <li><strong>Appearance</strong> – Customize the look of the chat widget</li>
      </ul>
    </>
  );
}
