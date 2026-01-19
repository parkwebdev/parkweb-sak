/**
 * Related Articles Node Extension for TipTap
 * 
 * Provides a block for linking to related Help Center articles
 * with styled link pills.
 * 
 * @see docs/HC_DATABASE_MIGRATION_PLAN.md
 * @module components/admin/knowledge/RelatedArticlesNode
 */

import { Node, mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';

export interface RelatedArticle {
  categoryId: string;
  articleSlug: string;
  title: string;
}

export interface RelatedArticlesOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    relatedArticles: {
      /**
       * Insert a related articles block
       */
      setRelatedArticles: (attrs?: { articles?: RelatedArticle[] }) => ReturnType;
      /**
       * Update the articles in the related articles block
       */
      updateRelatedArticles: (articles: RelatedArticle[]) => ReturnType;
      /**
       * Remove the related articles block
       */
      unsetRelatedArticles: () => ReturnType;
    };
  }
}

/**
 * Related articles block node
 */
export const RelatedArticlesNode = Node.create<RelatedArticlesOptions>({
  name: 'relatedArticles',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  // Atom means it's treated as a single unit, not editable inline
  atom: true,

  addAttributes() {
    return {
      articles: {
        default: [],
        parseHTML: (element) => {
          const articlesAttr = element.getAttribute('data-articles');
          if (articlesAttr) {
            try {
              return JSON.parse(articlesAttr);
            } catch {
              return [];
            }
          }
          // Fallback: parse from child anchor elements
          const links = element.querySelectorAll('a');
          const articles: RelatedArticle[] = [];
          links.forEach((link) => {
            const href = link.getAttribute('href') || '';
            const match = href.match(/category=([^&]+)&article=([^&]+)/);
            if (match) {
              articles.push({
                categoryId: match[1],
                articleSlug: match[2],
                title: link.textContent || '',
              });
            }
          });
          return articles;
        },
        renderHTML: (attributes) => ({
          'data-articles': JSON.stringify(attributes.articles),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-related-articles]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }): DOMOutputSpec {
    const articles = (node.attrs.articles as RelatedArticle[]) || [];

    // Store articles as JSON in data attribute, CSS/JS will handle visual rendering
    const containerAttrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-related-articles': '',
      'data-articles': JSON.stringify(articles),
      class: 'related-articles mt-8 pt-6 border-t border-border',
    });

    return ['div', containerAttrs, 0];
  },

  addCommands() {
    return {
      setRelatedArticles:
        (attrs) =>
        ({ commands }) => {
          const articles = attrs?.articles || [];
          return commands.insertContent({
            type: this.name,
            attrs: { articles },
          });
        },
      updateRelatedArticles:
        (articles) =>
        ({ tr, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          
          if (node?.type.name === 'relatedArticles') {
            tr.setNodeMarkup(selection.from, undefined, { articles });
            return true;
          }
          return false;
        },
      unsetRelatedArticles:
        () =>
        ({ commands }) => {
          return commands.deleteSelection();
        },
    };
  },
});
