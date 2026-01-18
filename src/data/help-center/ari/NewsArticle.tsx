/**
 * News Article
 */

import { HCCallout, HCRelatedArticles } from '@/components/help-center';

export default function NewsArticle() {
  return (
    <>
      <p>The News feature lets you share updates, blog posts, and stories directly in the chat widget.</p>
      <h2 id="news-vs-announcements">News vs. Announcements</h2>
      <ul>
        <li><strong>Announcements:</strong> Short, urgent, promotional (like banners)</li>
        <li><strong>News:</strong> Longer, informational, evergreen content (like blog posts)</li>
      </ul>
      <HCCallout variant="info">Only enable the News tab if you plan to publish content regularly.</HCCallout>
      <HCRelatedArticles articles={[{ categoryId: 'ari', articleSlug: 'announcements', title: 'Announcements' }]} />
    </>
  );
}
