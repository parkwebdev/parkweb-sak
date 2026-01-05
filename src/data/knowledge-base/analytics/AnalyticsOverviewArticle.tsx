/**
 * Understanding Your Data Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function AnalyticsOverviewArticle() {
  return (
    <>
      <p>
        The Analytics section gives you insights into how Ari is performing and 
        how visitors are engaging with your business.
      </p>

      <h2 id="key-metrics">Key Metrics</h2>
      <p>
        Track the metrics that matter most:
      </p>
      <ul>
        <li><strong>Total Conversations</strong> – Number of chat sessions started</li>
        <li><strong>Messages</strong> – Total messages exchanged</li>
        <li><strong>Leads Captured</strong> – Visitors who shared contact info</li>
        <li><strong>Bookings Made</strong> – Appointments scheduled through Ari</li>
        <li><strong>Response Time</strong> – How quickly Ari responds</li>
      </ul>

      <h2 id="date-ranges">Date Ranges</h2>
      <p>
        View data for different time periods:
      </p>
      <ul>
        <li>Last 7 days</li>
        <li>Last 30 days</li>
        <li>Last 90 days</li>
        <li>Custom date range</li>
      </ul>

      <h2 id="conversation-analytics">Conversation Analytics</h2>
      <p>
        Understand your conversation patterns:
      </p>
      <ul>
        <li>Peak conversation times</li>
        <li>Average conversation length</li>
        <li>Common topics and questions</li>
        <li>Resolution rates</li>
      </ul>

      <KBCallout variant="tip">
        Use peak time data to ensure your team is available during high-traffic 
        periods for takeovers.
      </KBCallout>

      <h2 id="lead-analytics">Lead Analytics</h2>
      <p>
        Track your lead generation:
      </p>
      <ul>
        <li>Lead capture rate</li>
        <li>Lead sources and channels</li>
        <li>Stage progression</li>
        <li>Conversion rates</li>
      </ul>

      <h2 id="satisfaction">Customer Satisfaction</h2>
      <p>
        Monitor how visitors feel about their experience:
      </p>
      <ul>
        <li>Satisfaction ratings (if enabled)</li>
        <li>Feedback comments</li>
        <li>Trends over time</li>
      </ul>

      <h2 id="reports">Building Reports</h2>
      <p>
        Create custom reports to share with your team:
      </p>
      <ol>
        <li>Go to the Report Builder</li>
        <li>Select the metrics you want to include</li>
        <li>Choose your date range</li>
        <li>Export as PDF or schedule recurring emails</li>
      </ol>

      <KBCallout variant="info">
        Scheduled reports are sent automatically to the recipients you specify, 
        keeping your team informed without manual effort.
      </KBCallout>
    </>
  );
}
