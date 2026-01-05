/**
 * Lead Management Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function LeadsOverviewArticle() {
  return (
    <>
      <p>
        Pilot automatically captures lead information from conversations. 
        The Leads section helps you organize, track, and follow up with 
        potential customers.
      </p>

      <h2 id="how-leads-are-captured">How Leads Are Captured</h2>
      <p>
        Leads are created when visitors share their contact information with Ari:
      </p>
      <ul>
        <li>Name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Company name</li>
        <li>Any custom fields you've configured</li>
      </ul>

      <KBCallout variant="tip">
        Configure lead capture settings in <strong>Ari → Lead Capture</strong> to 
        control when and how Ari collects visitor information.
      </KBCallout>

      <h2 id="leads-view">Viewing Leads</h2>
      <p>
        The Leads section offers two views:
      </p>
      <ul>
        <li><strong>Table View</strong> – A spreadsheet-like view for quick scanning</li>
        <li><strong>Kanban View</strong> – Visual cards organized by stage</li>
      </ul>

      <h2 id="lead-details">Lead Details</h2>
      <p>
        Click on any lead to see:
      </p>
      <ul>
        <li>Contact information</li>
        <li>Conversation history</li>
        <li>Activity timeline</li>
        <li>Notes and comments from your team</li>
        <li>Associated bookings or events</li>
      </ul>

      <h2 id="filtering-leads">Filtering & Sorting</h2>
      <p>
        Find the leads you need:
      </p>
      <ul>
        <li>Search by name, email, or company</li>
        <li>Filter by stage or status</li>
        <li>Filter by date created</li>
        <li>Sort by any column</li>
      </ul>

      <h2 id="exporting">Exporting Leads</h2>
      <p>
        Export your leads to a CSV file for use in other tools or for backup:
      </p>
      <ol>
        <li>Apply any filters you want</li>
        <li>Click the Export button</li>
        <li>Download the CSV file</li>
      </ol>

      <KBCallout variant="info">
        Leads are automatically linked to their conversation history, making it 
        easy to see the full context of each potential customer.
      </KBCallout>
    </>
  );
}
