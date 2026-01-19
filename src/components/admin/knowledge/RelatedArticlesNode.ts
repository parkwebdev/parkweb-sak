/**
 * Related Articles Node Extension for TipTap
 * 
 * Provides a block for linking to related Help Center articles
 * with styled link pills.
 * 
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

    // atom: true nodes must NOT have a content hole (0) - they are leaf nodes
    return ['div', containerAttrs];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-related-articles', '');
      dom.className = 'related-articles mt-8 pt-6 border-t border-border';

      // Add "Related Articles" heading
      const heading = document.createElement('span');
      heading.className = 'text-sm font-medium text-muted-foreground block mb-3';
      heading.textContent = 'Related Articles';
      dom.appendChild(heading);

      // Add container for article links
      const linksContainer = document.createElement('div');
      linksContainer.className = 'flex flex-wrap gap-2';

      const articles = (node.attrs.articles || []) as RelatedArticle[];

      if (articles.length === 0) {
        // Show placeholder for empty state
        const placeholder = document.createElement('span');
        placeholder.className = 'text-sm text-muted-foreground italic';
        placeholder.textContent = 'Click to add related articles...';
        linksContainer.appendChild(placeholder);
      } else {
        // Render each article as a styled pill
        articles.forEach((article) => {
          const pill = document.createElement('span');
          pill.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm text-foreground';
          pill.textContent = article.title;
          
          const arrow = document.createElement('span');
          arrow.className = 'text-muted-foreground ml-1';
          arrow.textContent = '→';
          pill.appendChild(arrow);
          
          linksContainer.appendChild(pill);
        });
      }

      dom.appendChild(linksContainer);

      return { dom };
    };
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
