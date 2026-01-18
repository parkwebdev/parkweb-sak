/**
 * Welcome to Pilot Article
 * 
 * Introduction to the Pilot platform.
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBFeatureCard, KBFeatureGrid } from '@/components/knowledge-base/KBFeatureCard';
import { KBArticleLink, KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';
import { MessageChatCircle, MessageSquare01, Users01, Calendar, BarChart01 } from '@untitledui/icons';

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
      
      <KBFeatureGrid columns={2}>
        <KBFeatureCard
          title="AI Agent (Ari)"
          description="Your always-on assistant that learns from your knowledge base to provide accurate, helpful responses."
          icon={<MessageChatCircle size={20} aria-hidden="true" />}
        />
        <KBFeatureCard
          title="Unified Inbox"
          description="All conversations flow into a single inbox where you can monitor, take over, or review interactions."
          icon={<MessageSquare01 size={20} aria-hidden="true" />}
        />
        <KBFeatureCard
          title="Lead Management"
          description="Automatically capture visitor information and organize leads through customizable stages."
          icon={<Users01 size={20} aria-hidden="true" />}
        />
        <KBFeatureCard
          title="Planner & Bookings"
          description="Let Ari schedule appointments directly into your calendar with Google Calendar integration."
          icon={<Calendar size={20} aria-hidden="true" />}
        />
        <KBFeatureCard
          title="Analytics & Insights"
          description="Understand how your AI is performing with detailed metrics on conversations and satisfaction."
          icon={<BarChart01 size={20} aria-hidden="true" />}
        />
      </KBFeatureGrid>

      <KBCallout variant="tip" title="Getting Started">
        Ready to set up your first AI agent? Head to the{' '}
        <KBArticleLink categoryId="getting-started" articleSlug="quick-start">
          Quick Start Guide
        </KBArticleLink>{' '}
        to get Ari up and running in minutes.
      </KBCallout>

      <h2 id="next-steps">Next Steps</h2>
      <p>
        Now that you understand what Pilot can do, here's how to get started:
      </p>
      <ol>
        <li>
          Complete the{' '}
          <KBArticleLink categoryId="getting-started" articleSlug="quick-start">
            Quick Start Guide
          </KBArticleLink>{' '}
          to configure Ari
        </li>
        <li>
          <KBArticleLink categoryId="ari" articleSlug="knowledge-sources">
            Add knowledge sources
          </KBArticleLink>{' '}
          so Ari can answer questions about your business
        </li>
        <li>
          <KBArticleLink categoryId="ari" articleSlug="appearance">
            Customize the chat widget
          </KBArticleLink>{' '}
          to match your brand
        </li>
        <li>
          <KBArticleLink categoryId="ari" articleSlug="installation">
            Install the widget
          </KBArticleLink>{' '}
          on your website
        </li>
        <li>Monitor conversations and refine Ari's responses</li>
      </ol>

      <p>
        Have questions? Our support team is here to help you succeed with Pilot.
      </p>

      <KBRelatedArticles
        articles={[
          { categoryId: 'getting-started', articleSlug: 'quick-start', title: 'Quick Start Guide' },
          { categoryId: 'ari', articleSlug: 'overview', title: 'Understanding Ari' },
          { categoryId: 'getting-started', articleSlug: 'navigation', title: 'Navigating the App' },
        ]}
      />
    </>
  );
}
