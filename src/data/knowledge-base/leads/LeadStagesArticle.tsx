/**
 * Lead Stages Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

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
        Pilot comes with default stages that work for most businesses:
      </p>
      <ul>
        <li><strong>New</strong> – Freshly captured leads</li>
        <li><strong>Contacted</strong> – Initial outreach made</li>
        <li><strong>Qualified</strong> – Confirmed as a good fit</li>
        <li><strong>Proposal</strong> – Proposal or quote sent</li>
        <li><strong>Won</strong> – Successfully converted</li>
        <li><strong>Lost</strong> – Did not convert</li>
      </ul>

      <h2 id="customizing-stages">Customizing Stages</h2>
      <p>
        Create stages that match your specific sales process:
      </p>
      <ol>
        <li>Go to Settings → Leads</li>
        <li>Add, edit, or remove stages</li>
        <li>Set colors for easy visual identification</li>
        <li>Drag to reorder stages</li>
      </ol>

      <KBCallout variant="tip">
        Keep your stage count manageable – 5-7 stages usually provides good 
        visibility without overwhelming complexity.
      </KBCallout>

      <h2 id="moving-leads">Moving Leads Between Stages</h2>
      <p>
        Update a lead's stage in several ways:
      </p>
      <ul>
        <li><strong>Kanban view</strong> – Drag and drop cards between columns</li>
        <li><strong>Lead detail</strong> – Select a new stage from the dropdown</li>
        <li><strong>Bulk action</strong> – Select multiple leads and update together</li>
      </ul>

      <h2 id="stage-automation">Stage-Based Actions</h2>
      <p>
        Use stages to trigger notifications and workflows:
      </p>
      <ul>
        <li>Get notified when a lead moves to a specific stage</li>
        <li>Send automatic follow-up reminders</li>
        <li>Track conversion rates between stages</li>
      </ul>

      <h2 id="analytics">Stage Analytics</h2>
      <p>
        The Analytics section shows insights about your pipeline:
      </p>
      <ul>
        <li>How many leads are in each stage</li>
        <li>Average time in each stage</li>
        <li>Conversion rates between stages</li>
        <li>Stage movement over time</li>
      </ul>

      <KBCallout variant="info">
        Regularly review your stage analytics to identify bottlenecks in 
        your sales process.
      </KBCallout>
    </>
  );
}
