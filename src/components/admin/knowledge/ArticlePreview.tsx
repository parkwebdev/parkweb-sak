/**
 * ArticlePreview Component
 * 
 * Preview component for help article content.
 * 
 * @module components/admin/knowledge/ArticlePreview
 */

interface ArticlePreviewProps {
  /** Article content to preview */
  content: string;
}

/**
 * Article preview component.
 */
export function ArticlePreview({ content }: ArticlePreviewProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}
