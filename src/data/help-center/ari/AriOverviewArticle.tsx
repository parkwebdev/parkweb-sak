/**
 * Understanding Ari Article
 * 
 * Learn what Ari is and how it can help your business.
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBFeatureCard, KBFeatureGrid } from '@/components/knowledge-base/KBFeatureCard';
import { KBArticleLink, KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';
import { MessageTextCircle01, Users01, Calendar, Repeat04 } from '@untitledui/icons';

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

      <KBFeatureGrid columns={2}>
        <KBFeatureCard
          title="Answer Questions"
          description="Using your knowledge base, Ari provides natural, conversational responses about your products, services, and policies."
          icon={<MessageTextCircle01 size={20} aria-hidden="true" />}
        />
        <KBFeatureCard
          title="Capture Leads"
          description="Ari collects visitor information like name, email, and phone, automatically creating leads in your CRM."
          icon={<Users01 size={20} aria-hidden="true" />}
        />
        <KBFeatureCard
          title="Schedule Appointments"
          description="When integrated with your calendar, Ari checks availability and books appointments during conversations."
          icon={<Calendar size={20} aria-hidden="true" />}
        />
        <KBFeatureCard
          title="Hand Off to Humans"
          description="For complex issues, Ari seamlessly transfers conversations to your team with full context."
          icon={<Repeat04 size={20} aria-hidden="true" />}
        />
      </KBFeatureGrid>

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
        <li><strong>Appearance</strong> – Match your brand colors with gradient headers</li>
        <li><strong>Behavior</strong> – Control when Ari asks for information or offers assistance</li>
        <li><strong>Knowledge</strong> – Add content from websites, documents, or manual entries</li>
      </ul>

      <h2 id="getting-started-ari">Getting Started</h2>
      <p>
        Ready to configure your AI agent? Start with these sections:
      </p>
      <ul>
        <li>
          <KBArticleLink categoryId="ari" articleSlug="system-prompt">
            System Prompt
          </KBArticleLink>{' '}
          – Define Ari's personality and guidelines
        </li>
        <li>
          <KBArticleLink categoryId="ari" articleSlug="knowledge-sources">
            Knowledge
          </KBArticleLink>{' '}
          – Add sources for Ari to learn from
        </li>
        <li>
          <KBArticleLink categoryId="ari" articleSlug="appearance">
            Appearance
          </KBArticleLink>{' '}
          – Customize the look of the chat widget
        </li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'knowledge-sources', title: 'Adding Knowledge Sources' },
          { categoryId: 'ari', articleSlug: 'installation', title: 'Installing the Widget' },
        ]}
      />
    </>
  );
}
