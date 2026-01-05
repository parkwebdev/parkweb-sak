/**
 * Quick Start Guide Article
 * 
 * Get up and running with Pilot quickly.
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBStepByStep } from '@/components/knowledge-base/KBStepByStep';

export default function QuickStartArticle() {
  return (
    <>
      <p>
        This guide will walk you through setting up Pilot and getting your AI agent 
        live on your website in just a few minutes.
      </p>

      <h2 id="setup-overview">Setup Overview</h2>
      <KBStepByStep
        steps={[
          {
            title: 'Configure Ari',
            description: 'Set up your AI agent\'s personality, model, and behavior in the Ari section.',
          },
          {
            title: 'Add Knowledge Sources',
            description: 'Give Ari information about your business by adding website URLs, documents, or text.',
          },
          {
            title: 'Customize Appearance',
            description: 'Match the chat widget to your brand with custom colors, avatar, and welcome messages.',
          },
          {
            title: 'Install the Widget',
            description: 'Copy the embed code and add it to your website to go live.',
          },
          {
            title: 'Monitor & Improve',
            description: 'Review conversations and analytics to continuously improve Ari\'s performance.',
          },
        ]}
      />

      <h2 id="step-1-configure-ari">Step 1: Configure Ari</h2>
      <p>
        Navigate to the <strong>Ari</strong> section in the sidebar to access your AI agent's 
        configuration. Here you can customize:
      </p>
      <ul>
        <li><strong>Model & Behavior</strong> – Choose the AI model and set response parameters</li>
        <li><strong>System Prompt</strong> – Define Ari's personality and instructions</li>
        <li><strong>Appearance</strong> – Customize colors, avatar, and branding</li>
        <li><strong>Welcome Messages</strong> – Set up greeting messages and quick actions</li>
      </ul>

      <KBCallout variant="tip">
        Start with the default settings and refine them as you learn how visitors interact with Ari.
      </KBCallout>

      <h2 id="step-2-add-knowledge">Step 2: Add Knowledge Sources</h2>
      <p>
        Ari's intelligence comes from your knowledge base. Add sources so Ari can answer 
        questions about your business:
      </p>
      <ol>
        <li>Go to <strong>Ari → Knowledge</strong></li>
        <li>Click <strong>Add Knowledge Source</strong></li>
        <li>Choose from website URLs, documents, or manual text entry</li>
        <li>Wait for Pilot to process and index your content</li>
      </ol>

      <KBCallout variant="info">
        The more relevant knowledge you provide, the better Ari can assist your visitors.
      </KBCallout>

      <h2 id="step-3-customize-appearance">Step 3: Customize Appearance</h2>
      <p>
        Make the chat widget feel like part of your brand:
      </p>
      <ul>
        <li>Set your <strong>primary color</strong> to match your brand</li>
        <li>Upload a custom <strong>avatar</strong> or logo</li>
        <li>Write a friendly <strong>welcome message</strong></li>
        <li>Configure <strong>quick action buttons</strong> for common queries</li>
      </ul>

      <h2 id="step-4-install-widget">Step 4: Install the Widget</h2>
      <p>
        Once you're happy with your configuration, it's time to go live:
      </p>
      <ol>
        <li>Navigate to <strong>Ari → Installation</strong></li>
        <li>Copy the embed code snippet</li>
        <li>Paste it into your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag</li>
        <li>Publish your website changes</li>
      </ol>

      <KBCallout variant="warning" title="Important">
        Make sure to test the widget on your staging environment before pushing to production.
      </KBCallout>

      <h2 id="step-5-monitor-and-improve">Step 5: Monitor and Improve</h2>
      <p>
        After launch, use these tools to optimize Ari's performance:
      </p>
      <ul>
        <li><strong>Inbox</strong> – Review conversations and identify common questions</li>
        <li><strong>Analytics</strong> – Track response quality and visitor engagement</li>
        <li><strong>Knowledge</strong> – Add more content to fill gaps in Ari's knowledge</li>
      </ul>

      <h2 id="next-steps">You're Ready!</h2>
      <p>
        Congratulations! Your AI agent is now live and ready to help your visitors. 
        Continue exploring the knowledge base to learn about advanced features like 
        lead capture, human takeover, and custom integrations.
      </p>
    </>
  );
}
