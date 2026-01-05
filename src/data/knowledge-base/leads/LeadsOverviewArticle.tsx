/**
 * Lead Management Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBArticleLink, KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';

export default function LeadsOverviewArticle() {
  return (
    <>
      <p>
        Pilot automatically captures leads when visitors share their contact information 
        during conversations. The Leads section helps you organize, track, and manage 
        these potential customers.
      </p>

      <h2 id="how-leads-captured">How Leads Are Captured</h2>
      <p>
        Ari collects visitor information when:
      </p>
      <ul>
        <li>A visitor proactively shares their email or phone</li>
        <li>Ari asks for contact info based on your lead capture settings</li>
        <li>A visitor fills out a contact form in the widget</li>
        <li>A booking is made (visitor info is saved)</li>
      </ul>

      <KBCallout variant="tip">
        Configure when and how Ari collects visitor information in{' '}
        <KBArticleLink categoryId="ari" articleSlug="lead-capture">
          Ari → Lead Capture
        </KBArticleLink>. 
        You can set required fields, enable/disable lead collection, and customize 
        the form behavior.
      </KBCallout>

      <h2 id="viewing-leads">Viewing Leads</h2>
      <p>
        Access your leads from <strong>Leads</strong> in the sidebar. You'll see two view options 
        in the header:
      </p>
      <ul>
        <li>
          <strong>Table View</strong> – Sortable list with columns for name, email, phone, 
          stage, and date. Great for bulk actions and data export.
        </li>
        <li>
          <strong>Kanban View</strong> – Visual board organized by stage. Perfect for 
          tracking lead progression and drag-and-drop stage changes.
        </li>
      </ul>

      <p>
        Toggle between views using the icons in the header bar.
      </p>

      <h2 id="lead-details">Lead Details</h2>
      <p>
        Click on any lead to see their full profile:
      </p>
      <ul>
        <li>Contact information (name, email, phone)</li>
        <li>Company name (if provided)</li>
        <li>Current stage in your pipeline</li>
        <li>Linked conversation history</li>
        <li>Activity timeline</li>
        <li>Notes and comments from your team</li>
      </ul>

      <h2 id="lead-stages">Lead Stages</h2>
      <p>
        Organize leads through customizable stages. See the{' '}
        <KBArticleLink categoryId="leads" articleSlug="stages">
          Lead Stages guide
        </KBArticleLink>{' '}
        for instructions on customizing your pipeline.
      </p>

      <h2 id="filtering-sorting">Filtering & Sorting</h2>
      <p>
        Find leads quickly with filters:
      </p>
      <ul>
        <li>Filter by stage, date range, or assignee</li>
        <li>Search by name, email, or company</li>
        <li>Sort by date, name, or stage</li>
        <li>Save filter presets for quick access</li>
      </ul>

      <h2 id="exporting">Exporting Leads</h2>
      <p>
        Export your leads for use in other tools:
      </p>
      <ol>
        <li>Apply any filters to narrow down the leads you want</li>
        <li>Click the <strong>Export</strong> button in the header</li>
        <li>Choose CSV format</li>
        <li>Download the file</li>
      </ol>

      <KBRelatedArticles
        articles={[
          { categoryId: 'leads', articleSlug: 'stages', title: 'Lead Stages' },
          { categoryId: 'ari', articleSlug: 'lead-capture', title: 'Lead Capture Settings' },
          { categoryId: 'inbox', articleSlug: 'overview', title: 'Managing Conversations' },
        ]}
      />
    </>
  );
}
