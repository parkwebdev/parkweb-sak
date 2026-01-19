UPDATE platform_hc_articles 
SET content = '<p>The Analytics section gives you insights into how Ari is performing.</p>

<h2 id="key-metrics">Key Metrics</h2>
<ul>
<li><strong>Total Conversations</strong> – Number of chat sessions started</li>
<li><strong>Leads Captured</strong> – Visitors who shared contact info</li>
<li><strong>Bookings Made</strong> – Appointments scheduled through Ari</li>
</ul>

<div data-callout data-callout-type="tip">Use peak time data to ensure your team is available during high-traffic periods.</div>

<h2 id="reports">Building Reports</h2>
<p>See the <a data-article-link data-category-id="analytics" data-article-slug="report-builder" href="/help-center?category=analytics&article=report-builder">Report Builder guide</a> for detailed instructions.</p>

<div data-related-articles data-articles=''[{"categoryId":"analytics","articleSlug":"report-builder","title":"Report Builder"},{"categoryId":"inbox","articleSlug":"overview","title":"Managing Conversations"}]''></div>',
    description = 'Gain insights from your conversation analytics.',
    updated_at = NOW()
WHERE category_id = 'analytics' AND slug = 'overview';