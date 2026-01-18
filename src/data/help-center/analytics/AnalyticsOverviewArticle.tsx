/**
 * Understanding Your Data Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';
import { KBArticleLink, KBRelatedArticles } from '@/components/knowledge-base/KBArticleLink';

export default function AnalyticsOverviewArticle() {
  return (
    <>
      <p>
        The Analytics section gives you insights into how Ari is performing and 
        how visitors are engaging with your business.
      </p>

      <h2 id="accessing-analytics">Accessing Analytics</h2>
      <p>
        Navigate to <strong>Analytics</strong> from the sidebar. You'll see a section menu 
        on the left where you can switch between different analytics views.
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
        View data for different time periods using the date picker:
      </p>
      <ul>
        <li>Today</li>
        <li>Last 7 days</li>
        <li>Last 30 days</li>
        <li>Last 90 days</li>
        <li>This month</li>
        <li>Last month</li>
      </ul>

      <h2 id="analytics-sections">Analytics Sections</h2>

      <h3 id="conversations">Conversations</h3>
      <p>
        Understand your conversation patterns:
      </p>
      <ul>
        <li>Conversation volume trends over time</li>
        <li>Funnel analysis from started to completed</li>
        <li>Average conversation length</li>
        <li>Peak conversation times</li>
      </ul>

      <h3 id="leads">Leads</h3>
      <p>
        Track your lead generation performance:
      </p>
      <ul>
        <li>Lead capture rate (conversations → leads)</li>
        <li>Stage distribution across your pipeline</li>
        <li>Lead sources and channels</li>
        <li>Conversion trends over time</li>
      </ul>

      <h3 id="bookings">Bookings</h3>
      <p>
        Monitor appointment activity:
      </p>
      <ul>
        <li>Booking volume by day/week</li>
        <li>Types of appointments scheduled</li>
        <li>Booking completion rate</li>
        <li>Most popular booking times</li>
      </ul>

      <h3 id="ai-performance">AI Performance</h3>
      <p>
        Evaluate how well Ari is handling conversations:
      </p>
      <ul>
        <li>Containment rate (% handled without human takeover)</li>
        <li>Customer satisfaction (CSAT) scores</li>
        <li>Handoff rate to human agents</li>
        <li>Response quality metrics</li>
      </ul>

      <KBCallout variant="tip">
        Use peak time data to ensure your team is available during high-traffic 
        periods for takeovers.
      </KBCallout>

      <h3 id="sources">Sources</h3>
      <p>
        Understand where your traffic comes from:
      </p>
      <ul>
        <li>Referral sources driving conversations</li>
        <li>UTM campaign performance</li>
        <li>Direct vs. organic traffic</li>
      </ul>

      <h3 id="pages">Pages</h3>
      <p>
        See which pages generate the most engagement:
      </p>
      <ul>
        <li>Top pages where conversations start</li>
        <li>Page-level conversion rates</li>
        <li>Engagement by page type</li>
      </ul>

      <h3 id="geography">Geography</h3>
      <p>
        View visitor distribution by location:
      </p>
      <ul>
        <li>Interactive map showing visitor locations</li>
        <li>Top cities and regions</li>
        <li>Timezone distribution</li>
      </ul>

      <h2 id="satisfaction">Customer Satisfaction</h2>
      <p>
        Monitor how visitors feel about their experience:
      </p>
      <ul>
        <li>Satisfaction ratings distribution</li>
        <li>Feedback comments from visitors</li>
        <li>CSAT trends over time</li>
      </ul>

      <h2 id="reports">Building Reports</h2>
      <p>
        Create custom reports to share with your team. See the{' '}
        <KBArticleLink categoryId="analytics" articleSlug="report-builder">
          Report Builder guide
        </KBArticleLink>{' '}
        for detailed instructions on:
      </p>
      <ol>
        <li>Creating custom reports with selected metrics</li>
        <li>Exporting as PDF or CSV</li>
        <li>Scheduling automated report delivery</li>
      </ol>

      <KBCallout variant="info">
        Scheduled reports are sent automatically to the recipients you specify, 
        keeping your team informed without manual effort.
      </KBCallout>

      <KBRelatedArticles
        articles={[
          { categoryId: 'analytics', articleSlug: 'report-builder', title: 'Report Builder' },
          { categoryId: 'inbox', articleSlug: 'overview', title: 'Managing Conversations' },
          { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' },
        ]}
      />
    </>
  );
}
