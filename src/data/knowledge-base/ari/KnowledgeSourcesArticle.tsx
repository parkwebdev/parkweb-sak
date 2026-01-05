/**
 * Adding Knowledge Sources Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function KnowledgeSourcesArticle() {
  return (
    <>
      <p>
        Knowledge sources are how Ari learns about your business. The more relevant 
        information you provide, the better Ari can assist your visitors.
      </p>

      <h2 id="types-of-sources">Types of Knowledge Sources</h2>

      <h3 id="website-urls">Website URLs</h3>
      <p>
        Point Ari to your website pages and it will automatically extract and index 
        the content. Great for:
      </p>
      <ul>
        <li>Product and service pages</li>
        <li>FAQ sections</li>
        <li>Blog posts</li>
        <li>About and contact pages</li>
      </ul>

      <h3 id="documents">Documents</h3>
      <p>
        Upload PDFs, Word documents, or other files. Ideal for:
      </p>
      <ul>
        <li>Product manuals</li>
        <li>Policy documents</li>
        <li>Pricing sheets</li>
        <li>Training materials</li>
      </ul>

      <h3 id="manual-text">Manual Text Entry</h3>
      <p>
        Directly enter information that might not exist elsewhere:
      </p>
      <ul>
        <li>Common questions and answers</li>
        <li>Special instructions</li>
        <li>Edge cases and exceptions</li>
      </ul>

      <KBCallout variant="tip" title="Pro Tip">
        Add your most frequently asked questions first – these will have the 
        biggest immediate impact on customer satisfaction.
      </KBCallout>

      <h2 id="managing-sources">Managing Sources</h2>
      <p>
        From the Knowledge section, you can:
      </p>
      <ul>
        <li><strong>Add</strong> new sources at any time</li>
        <li><strong>Refresh</strong> website sources to pick up changes</li>
        <li><strong>Delete</strong> outdated or irrelevant sources</li>
        <li><strong>View</strong> the status and last sync time</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>
      <ol>
        <li>Start with your most important pages and FAQs</li>
        <li>Keep content up-to-date by refreshing sources regularly</li>
        <li>Review conversations to identify knowledge gaps</li>
        <li>Remove outdated information that might confuse Ari</li>
      </ol>

      <KBCallout variant="info">
        It may take a few minutes for new knowledge sources to be processed 
        and available to Ari.
      </KBCallout>
    </>
  );
}
