/**
 * Lead Stages Article
 */

import { KBCallout, KBStepByStep, KBRelatedArticles } from '@/components/knowledge-base';

export default function LeadStagesArticle() {
  return (
    <>
      <p>
        Lead stages help you organize and track leads through your sales process. 
        Customize stages to match your workflow and easily see where each lead 
        stands.
      </p>

      <h2 id="default-stages">Default Stages</h2>
      <p>
        Pilot comes with five default stages that work for most businesses:
      </p>
      <ul>
        <li><strong>New</strong> – Freshly captured leads (default for new leads)</li>
        <li><strong>Contacted</strong> – Initial outreach has been made</li>
        <li><strong>Qualified</strong> – Confirmed as a good fit for your business</li>
        <li><strong>Converted</strong> – Successfully converted to a customer</li>
        <li><strong>Lost</strong> – Did not convert</li>
      </ul>

      <h2 id="customizing-stages">Customizing Stages</h2>
      <p>
        Create stages that match your specific sales process:
      </p>

      <KBStepByStep
        steps={[
          {
            title: 'Open the Manage Stages dialog',
            description: 'Navigate to the Leads page and click the Manage Stages button (stacked layers icon) in the header toolbar.',
          },
          {
            title: 'Add a new stage',
            description: 'Click the "Add Stage" button, enter a name, and choose a color for the stage.',
          },
          {
            title: 'Edit existing stages',
            description: 'Click on any stage name to rename it, or click the color swatch to change its color.',
          },
          {
            title: 'Set a default stage',
            description: 'Click the star icon next to a stage to make it the default for new leads.',
          },
          {
            title: 'Reorder stages',
            description: 'Drag and drop stages using the handle on the left to change their order.',
          },
        ]}
      />

      <KBCallout variant="tip">
        Keep your stage count manageable – 5-7 stages usually provides good 
        visibility without overwhelming complexity.
      </KBCallout>

      <KBCallout variant="warning">
        You can only delete a stage if no leads are currently assigned to it. 
        Move or reassign leads first before deleting a stage.
      </KBCallout>

      <h2 id="moving-leads">Moving Leads Between Stages</h2>
      <p>
        Update a lead's stage in several ways:
      </p>
      <ul>
        <li><strong>Kanban view</strong> – Drag and drop cards between stage columns</li>
        <li><strong>Lead detail panel</strong> – Select a new stage from the dropdown in the lead's detail view</li>
        <li><strong>Bulk actions</strong> – Select multiple leads in the table view and update their stage together</li>
      </ul>

      <h2 id="viewing-stages">Viewing by Stage</h2>
      <p>
        The Leads page offers two views to see your leads organized by stage:
      </p>
      <ul>
        <li><strong>Kanban view</strong> – Visual columns for each stage, perfect for pipeline management</li>
        <li><strong>Table view</strong> – Spreadsheet-style view with a stage column for quick sorting and filtering</li>
      </ul>
      <p>
        Toggle between views using the view switcher in the header toolbar.
      </p>

      <KBCallout variant="info">
        The Kanban view automatically groups leads by stage and shows the count 
        of leads in each column, giving you a quick overview of your pipeline.
      </KBCallout>

      <KBRelatedArticles
        articles={[
          { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' },
          { categoryId: 'ari', articleSlug: 'lead-capture', title: 'Lead Capture' },
        ]}
      />
    </>
  );
}
