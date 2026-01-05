/**
 * Report Builder Article
 */

import { KBCallout, KBStepByStep, KBRelatedArticles } from '@/components/knowledge-base';

export default function ReportBuilderArticle() {
  return (
    <>
      <p>
        The Report Builder helps you create comprehensive reports to share with 
        your team or stakeholders. Generate PDF reports or schedule automated 
        email delivery.
      </p>

      <h2 id="accessing-report-builder">Accessing Report Builder</h2>
      <p>
        To create a new report:
      </p>
      <KBStepByStep
        steps={[
          {
            title: 'Open Analytics',
            description: 'Navigate to Analytics from the sidebar.',
          },
          {
            title: 'Go to Reports Tab',
            description: 'Click the Reports tab at the top of the Analytics page.',
          },
          {
            title: 'Click Build Report',
            description: 'Click the Build Report button to open the report configuration.',
          },
        ]}
      />

      <h2 id="configuring-report">Configuring Your Report</h2>
      <p>
        When building a report, you can configure:
      </p>
      <ul>
        <li><strong>Report Title</strong> – Give your report a descriptive name</li>
        <li><strong>Date Range</strong> – Select the time period to include</li>
        <li><strong>Sections</strong> – Choose which data sections to include</li>
      </ul>

      <h2 id="available-sections">Available Report Sections</h2>
      <p>
        Include any combination of these sections in your report:
      </p>
      <ul>
        <li><strong>Conversations</strong> – Volume, trends, and response metrics</li>
        <li><strong>Leads</strong> – Capture rates, stage distribution, conversion</li>
        <li><strong>Bookings</strong> – Appointment volume and scheduling patterns</li>
        <li><strong>AI Performance</strong> – Containment rate, CSAT scores, handoff rate</li>
        <li><strong>Sources</strong> – Traffic sources and referral data</li>
      </ul>

      <KBCallout variant="tip">
        Start with a focused report featuring 2-3 sections. You can always 
        create additional reports for specific audiences or purposes.
      </KBCallout>

      <h2 id="exporting-pdf">Exporting as PDF</h2>
      <p>
        After configuring your report:
      </p>
      <ol>
        <li>Review the report preview</li>
        <li>Click <strong>Export PDF</strong></li>
        <li>The PDF downloads to your device</li>
      </ol>
      <p>
        PDF reports include charts, tables, and summaries in a professional 
        format suitable for presentations or archiving.
      </p>

      <h2 id="exporting-csv">Exporting as CSV</h2>
      <p>
        For data analysis in spreadsheets:
      </p>
      <ol>
        <li>Configure your report sections</li>
        <li>Click <strong>Export CSV</strong></li>
        <li>Open in Excel, Google Sheets, or your preferred tool</li>
      </ol>

      <h2 id="scheduled-reports">Scheduling Recurring Reports</h2>
      <p>
        Automate report delivery on a schedule:
      </p>
      <KBStepByStep
        steps={[
          {
            title: 'Configure Report',
            description: 'Set up the report with your desired sections and date range type.',
          },
          {
            title: 'Enable Scheduling',
            description: 'Toggle on "Schedule this report" in the report settings.',
          },
          {
            title: 'Set Frequency',
            description: 'Choose daily, weekly, or monthly delivery.',
          },
          {
            title: 'Add Recipients',
            description: 'Enter email addresses for team members who should receive the report.',
          },
          {
            title: 'Save Schedule',
            description: 'Click Save to activate the scheduled report.',
          },
        ]}
      />

      <h3 id="frequency-options">Frequency Options</h3>
      <ul>
        <li><strong>Daily</strong> – Sent every morning with previous day's data</li>
        <li><strong>Weekly</strong> – Sent on your chosen day with past week's data</li>
        <li><strong>Monthly</strong> – Sent on the 1st with previous month's data</li>
      </ul>

      <KBCallout variant="info">
        Scheduled reports are sent in the morning based on your account timezone. 
        Configure your timezone in Settings → General.
      </KBCallout>

      <h2 id="managing-scheduled">Managing Scheduled Reports</h2>
      <p>
        View and manage all scheduled reports:
      </p>
      <ul>
        <li>See a list of all active scheduled reports</li>
        <li>Edit report configuration or recipients</li>
        <li>Pause or resume scheduled delivery</li>
        <li>Delete reports you no longer need</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Create separate reports for different audiences (executives vs. team leads)</li>
        <li>Use weekly reports for ongoing monitoring, monthly for trend analysis</li>
        <li>Include only relevant sections to keep reports focused</li>
        <li>Review scheduled reports periodically to ensure they're still useful</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'analytics', articleSlug: 'overview', title: 'Analytics Overview' },
          { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' },
        ]}
      />
    </>
  );
}
