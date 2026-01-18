/**
 * News Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function NewsArticle() {
  return (
    <>
      <p>
        The News feature lets you share updates, blog posts, and stories directly 
        in the chat widget. Keep visitors informed and engaged with fresh content.
      </p>

      <h2 id="news-vs-announcements">News vs. Announcements</h2>
      <p>
        While both appear in the widget, they serve different purposes:
      </p>
      <ul>
        <li><strong>Announcements:</strong> Short, urgent, promotional (like banners)</li>
        <li><strong>News:</strong> Longer, informational, evergreen content (like blog posts)</li>
      </ul>

      <h2 id="enabling-news">Enabling the News Tab</h2>
      <ol>
        <li>Navigate to <strong>Ari → News</strong></li>
        <li>Toggle <strong>Enable News Tab</strong> to show it in the widget</li>
        <li>When enabled, visitors see a "News" tab in the widget</li>
      </ol>

      <KBCallout variant="info">
        Only enable the News tab if you plan to publish content regularly. 
        An empty or outdated news section can hurt credibility.
      </KBCallout>

      <h2 id="creating-news">Creating a News Item</h2>
      <ol>
        <li>Navigate to <strong>Ari → News</strong></li>
        <li>Click <strong>Add News</strong></li>
        <li>Fill in the news item details</li>
        <li>Save and publish</li>
      </ol>

      <h3 id="news-fields">News Item Fields</h3>
      <ul>
        <li><strong>Title:</strong> Headline for the news item</li>
        <li><strong>Body:</strong> Full content with rich text formatting</li>
        <li><strong>Featured Image:</strong> Visual for the news card</li>
        <li><strong>Author Name:</strong> Who wrote it</li>
        <li><strong>Author Avatar:</strong> Photo of the author</li>
        <li><strong>Primary CTA:</strong> Main action button</li>
        <li><strong>Secondary CTA:</strong> Optional second action</li>
      </ul>

      <h2 id="content-ideas">Content Ideas</h2>
      <ul>
        <li><strong>Company updates:</strong> New hires, milestones, awards</li>
        <li><strong>Industry news:</strong> Market trends, insights</li>
        <li><strong>Tips and guides:</strong> Helpful content for your audience</li>
        <li><strong>Event recaps:</strong> Photos and summaries from events</li>
        <li><strong>Customer stories:</strong> Testimonials and case studies</li>
      </ul>

      <KBCallout variant="tip">
        News items with author photos and names feel more personal and 
        trustworthy than anonymous content.
      </KBCallout>

      <h2 id="publishing">Publishing and Scheduling</h2>

      <h3 id="draft-vs-published">Draft vs. Published</h3>
      <ul>
        <li><strong>Draft:</strong> Saved but not visible to visitors</li>
        <li><strong>Published:</strong> Visible in the widget's News tab</li>
      </ul>

      <h3 id="ordering-news">Ordering News</h3>
      <p>
        Control how news appears:
      </p>
      <ul>
        <li>Newest items appear first by default</li>
        <li>Pin important items to the top</li>
        <li>Drag and drop to reorder manually</li>
      </ul>

      <h2 id="cta-buttons">Call-to-Action Buttons</h2>
      <p>
        Add buttons to drive action:
      </p>
      <ul>
        <li><strong>Primary CTA:</strong> Main action ("Read More", "Learn More")</li>
        <li><strong>Secondary CTA:</strong> Alternative action ("Share", "Contact Us")</li>
        <li>Both can link to external URLs or trigger widget actions</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Publish consistently (weekly or bi-weekly)</li>
        <li>Use compelling featured images</li>
        <li>Keep headlines under 60 characters</li>
        <li>Break up long content with headings</li>
        <li>Include a clear call-to-action</li>
        <li>Archive outdated news items</li>
      </ul>

      <h2 id="integration">Integration with Ari</h2>
      <p>
        Ari can reference your news content:
      </p>
      <ul>
        <li>When visitors ask about updates, Ari can point to news items</li>
        <li>News content is indexed for relevant responses</li>
        <li>Keep news current so Ari provides accurate information</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'announcements', title: 'Announcements' },
          { categoryId: 'ari', articleSlug: 'appearance', title: 'Customizing Appearance' },
        ]}
      />
    </>
  );
}
