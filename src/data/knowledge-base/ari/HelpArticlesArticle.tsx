/**
 * Help Articles Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function HelpArticlesArticle() {
  return (
    <>
      <p>
        Help Articles are a self-service knowledge base that appears in the chat 
        widget. Visitors can browse articles to find answers without needing to 
        chat with Ari.
      </p>

      <h2 id="how-they-work">How Help Articles Work</h2>
      <p>
        When enabled, a "Help" tab appears in the chat widget:
      </p>
      <ul>
        <li>Visitors can browse articles by category</li>
        <li>Search for specific topics</li>
        <li>Read articles directly in the widget</li>
        <li>Switch to chat if they need more help</li>
      </ul>

      <KBCallout variant="tip">
        Well-organized help articles reduce the number of repetitive questions 
        Ari receives, freeing it up for more complex conversations.
      </KBCallout>

      <h2 id="creating-categories">Creating Categories</h2>
      <p>
        Organize articles into logical categories:
      </p>
      <ol>
        <li>Navigate to <strong>Ari → Help Articles</strong></li>
        <li>Click <strong>Add Category</strong></li>
        <li>Enter a category name and optional icon</li>
        <li>Save the category</li>
      </ol>

      <h3 id="example-categories">Example Categories</h3>
      <ul>
        <li>Getting Started</li>
        <li>Pricing & Payments</li>
        <li>Scheduling & Tours</li>
        <li>Policies & FAQs</li>
        <li>Contact & Support</li>
      </ul>

      <h2 id="writing-articles">Writing Articles</h2>
      <ol>
        <li>Select a category or create a new one</li>
        <li>Click <strong>Add Article</strong></li>
        <li>Enter a clear, descriptive title</li>
        <li>Write the article content</li>
        <li>Save and publish</li>
      </ol>

      <h3 id="article-tips">Tips for Great Articles</h3>
      <ul>
        <li><strong>Clear titles:</strong> Use questions visitors might ask</li>
        <li><strong>Short paragraphs:</strong> Easy to scan on mobile</li>
        <li><strong>Step-by-step:</strong> Use numbered lists for processes</li>
        <li><strong>Visual aids:</strong> Add images when helpful</li>
        <li><strong>Links:</strong> Reference related articles</li>
      </ul>

      <KBCallout variant="info">
        Article titles that match common questions help both visitors and Ari 
        find the right information faster.
      </KBCallout>

      <h2 id="rich-editor">Rich Text Editor</h2>
      <p>
        The article editor supports:
      </p>
      <ul>
        <li>Headings and subheadings</li>
        <li>Bold, italic, and underlined text</li>
        <li>Bulleted and numbered lists</li>
        <li>Links to external pages</li>
        <li>Images and screenshots</li>
      </ul>

      <h2 id="article-order">Ordering Articles</h2>
      <p>
        Control how articles appear:
      </p>
      <ul>
        <li>Drag and drop to reorder within categories</li>
        <li>Most important articles should appear first</li>
        <li>Categories can also be reordered</li>
      </ul>

      <h2 id="ari-integration">Integration with Ari</h2>
      <p>
        Ari uses your help articles as a knowledge source:
      </p>
      <ul>
        <li>When visitors ask questions, Ari references articles</li>
        <li>Ari can link to relevant articles in responses</li>
        <li>Articles are automatically indexed for search</li>
      </ul>

      <h2 id="analytics">Article Analytics</h2>
      <p>
        Track how articles perform:
      </p>
      <ul>
        <li>View counts for each article</li>
        <li>Helpful/not helpful feedback from visitors</li>
        <li>Search terms that lead to articles</li>
        <li>Use data to improve content</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Start with your top 10 most common questions</li>
        <li>Update articles when policies or processes change</li>
        <li>Review feedback regularly to improve content</li>
        <li>Keep articles focused on one topic each</li>
        <li>Use consistent formatting across all articles</li>
      </ul>
    </>
  );
}
