/**
 * Leads Overview Article
 */

import { KBCallout, KBRelatedArticles, KBArticleLink } from '@/components/knowledge-base';

export default function LeadsOverviewArticle() {
  return (
    <>
      <p>
        The Leads section helps you manage and track potential customers who've 
        interacted with Ari. View lead details, track their progress through 
        your pipeline, and follow up effectively.
      </p>

      <h2 id="lead-sources">How Leads Are Captured</h2>
      <p>
        Leads are created when visitors:
      </p>
      <ul>
        <li>Submit a{' '}
          <KBArticleLink categoryId="ari" articleSlug="lead-capture">
            contact form
          </KBArticleLink>{' '}
          before chatting
        </li>
        <li>Provide their email or phone during a conversation</li>
        <li>Book an appointment through the calendar integration</li>
      </ul>

      <h2 id="views">Viewing Leads</h2>
      <p>
        Switch between two views using the toggle in the header:
      </p>
      <ul>
        <li><strong>Table View</strong> – A detailed list with sortable columns. 
        Best for searching and filtering large numbers of leads.</li>
        <li><strong>Kanban View</strong> – A visual pipeline with drag-and-drop. 
        Best for tracking leads through stages.</li>
      </ul>

      <h2 id="lead-details">Lead Details</h2>
      <p>
        Click any lead to open its detail panel. Information includes:
      </p>
      <ul>
        <li><strong>Contact info</strong> – Name, email, phone, company</li>
        <li><strong>Stage</strong> – Current pipeline stage</li>
        <li><strong>Priority</strong> – Lead priority level</li>
        <li><strong>Assignees</strong> – Team members responsible for the lead</li>
        <li><strong>Location</strong> – Associated location (if applicable)</li>
        <li><strong>Source</strong> – How the lead was captured</li>
        <li><strong>Custom fields</strong> – Any additional data collected</li>
        <li><strong>Conversation link</strong> – Jump to their chat history</li>
        <li><strong>Activity timeline</strong> – All actions taken on this lead</li>
        <li><strong>Comments</strong> – Internal notes from your team</li>
      </ul>

      <h2 id="stages">Lead Stages</h2>
      <p>
        Organize leads through your sales pipeline with customizable stages:
      </p>
      <ul>
        <li><strong>New</strong> – Just captured, needs initial contact</li>
        <li><strong>Contacted</strong> – You've reached out</li>
        <li><strong>Qualified</strong> – Confirmed as a good fit</li>
        <li><strong>Proposal</strong> – Sent pricing or proposal</li>
        <li><strong>Won</strong> – Successfully converted</li>
        <li><strong>Lost</strong> – Did not convert</li>
      </ul>
      <p>
        Drag leads between columns in Kanban view, or use the dropdown in the 
        lead detail panel to change stages.
      </p>

      <KBCallout variant="tip">
        Customize your stages to match your sales process. Go to Settings to 
        add, rename, or reorder stages.
      </KBCallout>

      <h2 id="priority">Priority Levels</h2>
      <p>
        Assign priority to help your team focus on the most important leads:
      </p>
      <ul>
        <li><strong>Urgent</strong> – Requires immediate attention</li>
        <li><strong>High</strong> – Important, follow up soon</li>
        <li><strong>Medium</strong> – Standard priority</li>
        <li><strong>Low</strong> – Can wait, less urgent</li>
      </ul>
      <p>
        Priority is displayed as a colored badge on lead cards and in the table.
      </p>

      <h2 id="assignees">Assignees</h2>
      <p>
        Assign team members to leads for accountability:
      </p>
      <ul>
        <li>Click the assignee field in the lead detail panel</li>
        <li>Select one or more team members</li>
        <li>Assignees can filter to see only their leads</li>
      </ul>
      <p>
        Use the "Assigned to me" filter to quickly find leads you're responsible for.
      </p>

      <h2 id="filtering">Filtering and Search</h2>
      <p>
        Find specific leads using:
      </p>
      <ul>
        <li><strong>Search</strong> – Filter by name, email, phone, or company</li>
        <li><strong>Stage filter</strong> – Show only leads in specific stages</li>
        <li><strong>Assignee filter</strong> – Show leads assigned to specific people</li>
        <li><strong>Date range</strong> – Filter by when leads were created</li>
      </ul>

      <h2 id="sorting">Sorting</h2>
      <p>
        In table view, click column headers to sort:
      </p>
      <ul>
        <li>Name (alphabetical)</li>
        <li>Email</li>
        <li>Stage</li>
        <li>Created date</li>
        <li>Updated date</li>
      </ul>
      <p>
        Click again to reverse the sort order.
      </p>

      <h2 id="view-customization">Customizing Your View</h2>
      <p>
        Personalize how leads are displayed:
      </p>

      <h3 id="table-columns">Table Columns</h3>
      <ul>
        <li>Click the <strong>Properties</strong> button to show/hide columns</li>
        <li>Drag columns to reorder them</li>
        <li>Your preferences are saved automatically</li>
      </ul>

      <h3 id="kanban-cards">Kanban Card Fields</h3>
      <ul>
        <li>Click <strong>Properties</strong> in Kanban view</li>
        <li>Toggle which fields appear on cards</li>
        <li>Drag fields to reorder them on cards</li>
      </ul>

      <KBCallout variant="info">
        View customizations are saved per-user. Each team member can have their 
        own preferred layout.
      </KBCallout>

      <h2 id="bulk-actions">Bulk Actions</h2>
      <p>
        Perform actions on multiple leads at once:
      </p>
      <ol>
        <li>Select leads using the checkboxes in table view</li>
        <li>A floating action bar appears at the bottom</li>
        <li>Choose an action:
          <ul>
            <li><strong>Delete</strong> – Remove selected leads</li>
          </ul>
        </li>
      </ol>
      <p>
        When deleting leads, you can optionally delete their associated 
        conversations as well.
      </p>

      <KBCallout variant="warning">
        Bulk delete is permanent. Make sure you've selected the correct leads 
        before confirming.
      </KBCallout>

      <h2 id="comments">Comments and Notes</h2>
      <p>
        Add internal notes to leads:
      </p>
      <ul>
        <li>Open the lead detail panel</li>
        <li>Scroll to the Comments section</li>
        <li>Type your note and submit</li>
      </ul>
      <p>
        Comments are visible to all team members and include timestamps and 
        author information.
      </p>

      <h2 id="activity-history">Activity History</h2>
      <p>
        Track everything that happens with a lead:
      </p>
      <ul>
        <li>Stage changes</li>
        <li>Assignee updates</li>
        <li>Comments added</li>
        <li>Conversations linked</li>
        <li>Field updates</li>
      </ul>
      <p>
        The activity timeline shows who did what and when.
      </p>

      <h2 id="exporting">Exporting Leads</h2>
      <p>
        Export your leads for external use:
      </p>
      <ol>
        <li>Apply any filters to narrow down the list</li>
        <li>Click the <strong>Export</strong> button</li>
        <li>Choose your format (CSV)</li>
        <li>Download the file</li>
      </ol>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'lead-capture', title: 'Lead Capture Settings' },
          { categoryId: 'inbox', articleSlug: 'overview', title: 'Managing Conversations' },
          { categoryId: 'analytics', articleSlug: 'overview', title: 'Understanding Your Data' },
        ]}
      />
    </>
  );
}
