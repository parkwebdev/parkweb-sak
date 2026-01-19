/**
 * Help Center Database Article Renderer
 * 
 * Renders HTML content from the database with DOMPurify sanitization.
 * Uses CSS-only styling for custom data-* blocks for performance
 * and to avoid React hydration complexity.
 * 
 * Custom blocks supported:
 * - data-callout (info, tip/success, warning, error)
 * - data-stepbystep with data-step children
 * - data-feature-grid with data-feature-card children
 * - data-related-articles
 * - data-article-link (inline links)
 * 
 * @module components/help-center/HCDatabaseArticleRenderer
 */

import { useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';

/** 
 * Allowed HTML tags for sanitization.
 * Includes standard HTML elements plus custom block containers.
 */
const ALLOWED_TAGS = [
  // Standard text elements
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'span',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Links and media
  'a', 'img',
  // Lists
  'ul', 'ol', 'li',
  // Code
  'code', 'pre', 'kbd',
  // Tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  // Structural
  'div', 'section', 'blockquote', 'hr',
];

/**
 * Allowed HTML attributes for sanitization.
 * Includes standard attributes plus data-* for custom blocks.
 */
const ALLOWED_ATTR = [
  // Standard attributes
  'href', 'target', 'rel', 'class', 'id',
  'src', 'alt', 'width', 'height', 'loading',
  'style',
  // Callout attributes
  'data-callout', 'data-callout-type',
  // Step-by-step attributes
  'data-stepbystep', 'data-step', 'data-step-number',
  'data-step-title', 'data-step-description', 'data-step-screenshot',
  // Feature grid/card attributes
  'data-feature-grid', 'data-columns',
  'data-feature-card', 'data-feature-icon', 'data-feature-title', 'data-feature-description',
  // Related articles attributes
  'data-related-articles', 'data-articles',
  // Article link attributes
  'data-article-link', 'data-category-id', 'data-article-slug',
  // Table attributes
  'colspan', 'rowspan',
];

interface HCDatabaseArticleRendererProps {
  /** HTML content from the database */
  content: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Renders sanitized HTML content from the database.
 * Custom blocks are styled via CSS selectors in index.css.
 */
export function HCDatabaseArticleRenderer({ content, className }: HCDatabaseArticleRendererProps) {
  const [sanitizedContent, setSanitizedContent] = useState('');
  
  useEffect(() => {
    // Sanitize the HTML content
    const clean = DOMPurify.sanitize(content, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      // Allow data-* attributes
      ADD_ATTR: ['data-*'],
    });
    setSanitizedContent(clean);
  }, [content]);
  
  if (!sanitizedContent) {
    return null;
  }
  
  return (
    <div 
      className={cn('hc-article-content hc-database-content', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

/**
 * Re-export allowed lists for use in widget and other renderers.
 */
export { ALLOWED_TAGS, ALLOWED_ATTR };
