/**
 * Article Link Mark Extension for TipTap
 * 
 * Provides an inline mark for linking to other Help Center articles.
 * Similar to the regular link mark but with article-specific attributes.
 * 
 * @module components/admin/knowledge/ArticleLinkMark
 */

import { Mark, mergeAttributes } from '@tiptap/core';

export interface ArticleLinkMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articleLink: {
      /**
       * Set an article link mark on the selected text
       */
      setArticleLink: (attrs: { categoryId: string; articleSlug: string; title?: string }) => ReturnType;
      /**
       * Toggle an article link mark on the selected text
       */
      toggleArticleLink: (attrs: { categoryId: string; articleSlug: string; title?: string }) => ReturnType;
      /**
       * Remove the article link mark from the selected text
       */
      unsetArticleLink: () => ReturnType;
    };
  }
}

/**
 * Inline mark for linking to Help Center articles
 */
export const ArticleLinkMark = Mark.create<ArticleLinkMarkOptions>({
  name: 'articleLink',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  // Priority lower than regular link to avoid conflicts
  priority: 1000,

  // Make it exclusive with regular links
  excludes: 'link',

  addAttributes() {
    return {
      categoryId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-category-id'),
        renderHTML: (attributes) => ({
          'data-category-id': attributes.categoryId,
        }),
      },
      articleSlug: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-article-slug'),
        renderHTML: (attributes) => ({
          'data-article-slug': attributes.articleSlug,
        }),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('title'),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      href: {
        default: null,
        parseHTML: (element) => element.getAttribute('href'),
        renderHTML: (attributes) => ({
          href: `/help-center?category=${attributes.categoryId}&article=${attributes.articleSlug}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-article-link]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-article-link': '',
        class: 'article-link inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer',
        target: '_self',
      }),
      0,
      // Arrow icon after content
      ['span', { class: 'article-link-arrow text-xs ml-0.5', 'aria-hidden': 'true' }, '→'],
    ];
  },

  addCommands() {
    return {
      setArticleLink:
        (attrs) =>
        ({ commands }) => {
          return commands.setMark(this.name, attrs);
        },
      toggleArticleLink:
        (attrs) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attrs);
        },
      unsetArticleLink:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
