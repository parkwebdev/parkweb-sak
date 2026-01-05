/**
 * Welcome to Pilot Article
 * 
 * Introduction to the Pilot platform.
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function WelcomeArticle() {
  return (
    <>
      <p>
        Welcome to <strong>Pilot</strong> – your AI-powered customer engagement platform. 
        Pilot helps you automate conversations, capture leads, and provide exceptional 
        support to your website visitors 24/7.
      </p>

      <h2 id="what-is-pilot">What is Pilot?</h2>
      <p>
        Pilot is a comprehensive platform that combines the power of AI with intuitive 
        tools to help you manage customer interactions. At the heart of Pilot is 
        <strong> Ari</strong>, your AI agent that can:
      </p>
      <ul>
        <li>Answer customer questions instantly using your knowledge base</li>
        <li>Capture and qualify leads automatically</li>
        <li>Schedule appointments and bookings</li>
        <li>Hand off complex conversations to your team</li>
        <li>Provide insights through detailed analytics</li>
      </ul>

      <h2 id="key-features">Key Features</h2>
      
      <h3 id="ai-agent">AI Agent (Ari)</h3>
      <p>
        Ari is your always-on assistant that learns from your knowledge base to provide 
        accurate, helpful responses to customer inquiries. Configure Ari's personality, 
        appearance, and capabilities to match your brand.
      </p>

      <h3 id="inbox">Unified Inbox</h3>
      <p>
        All conversations flow into a single inbox where you can monitor, take over, 
        or review interactions. Never miss an important message from a potential customer.
      </p>

      <h3 id="lead-management">Lead Management</h3>
      <p>
        Automatically capture visitor information and organize leads through customizable 
        stages. Track the journey from first contact to conversion.
      </p>

      <h3 id="planner">Planner & Bookings</h3>
      <p>
        Let Ari schedule appointments directly into your calendar. Integrate with 
        Google Calendar and manage all your bookings in one place.
      </p>

      <h3 id="analytics">Analytics & Insights</h3>
      <p>
        Understand how your AI is performing with detailed metrics on conversations, 
        response times, customer satisfaction, and more.
      </p>

      <KBCallout variant="tip" title="Getting Started">
        Ready to set up your first AI agent? Head to the <strong>Quick Start Guide</strong> to 
        get Ari up and running in minutes.
      </KBCallout>

      <h2 id="next-steps">Next Steps</h2>
      <p>
        Now that you understand what Pilot can do, here's how to get started:
      </p>
      <ol>
        <li>Complete the <strong>Quick Start Guide</strong> to configure Ari</li>
        <li>Add knowledge sources so Ari can answer questions about your business</li>
        <li>Customize the chat widget to match your brand</li>
        <li>Install the widget on your website</li>
        <li>Monitor conversations and refine Ari's responses</li>
      </ol>

      <p>
        Have questions? Our support team is here to help you succeed with Pilot.
      </p>
    </>
  );
}
