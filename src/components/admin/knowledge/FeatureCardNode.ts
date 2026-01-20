/**
 * Feature Card/Grid Node Extensions for TipTap
 * 
 * Provides feature card blocks with icons, titles, and descriptions,
 * and a grid container for grouping cards.
 * 
 * @module components/admin/knowledge/FeatureCardNode
 */

import { Node, mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';

export interface FeatureCardOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface FeatureGridOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    featureCard: {
      /**
       * Insert a single feature card
       */
      setFeatureCard: () => ReturnType;
    };
    featureGrid: {
      /**
       * Insert a feature grid with specified columns and card count
       */
      setFeatureGrid: (attrs?: { columns?: 2 | 3; cardCount?: number }) => ReturnType;
      /**
       * Remove the feature grid
       */
      unsetFeatureGrid: () => ReturnType;
    };
  }
}

/**
 * Container node for feature card grids
 */
export const FeatureGridNode = Node.create<FeatureGridOptions>({
  name: 'featureGrid',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'featureCard+',

  defining: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          const cols = element.getAttribute('data-columns');
          return cols ? parseInt(cols, 10) : 2;
        },
        renderHTML: (attributes) => ({
          'data-columns': attributes.columns,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-feature-grid]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }): DOMOutputSpec {
    const columns = node.attrs.columns || 2;
    const columnClasses =
      columns === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-feature-grid': '',
        'data-columns': columns,
        class: `feature-grid my-6 grid gap-4 ${columnClasses}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setFeatureGrid:
        (attrs) =>
        ({ commands }) => {
          const columns = attrs?.columns || 2;
          const cardCount = attrs?.cardCount || columns;

          // Create feature cards with content nodes only (no attrs for title/description)
          const cards = Array.from({ length: cardCount }, (_, i) => ({
            type: 'featureCard',
            content: [
              { 
                type: 'heading', 
                attrs: { level: 4 }, 
                content: [{ type: 'text', text: `Feature ${i + 1}` }] 
              },
              { 
                type: 'paragraph', 
                content: [{ type: 'text', text: 'Description here' }] 
              },
            ],
          }));

          return commands.insertContent({
            type: this.name,
            attrs: { columns },
            content: cards,
          });
        },
      unsetFeatureGrid:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});

/**
 * Individual feature card node
 * Content-based architecture: h4 for title, p for description
 */
export const FeatureCardNode = Node.create<FeatureCardOptions>({
  name: 'featureCard',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'block*',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-feature-card]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }): DOMOutputSpec {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-feature-card': '',
        class: 'feature-card rounded-lg border border-border bg-card p-4 shadow-sm',
      }),
      0,
    ];
  },

  addNodeView() {
    return () => {
      const dom = document.createElement('div');
      dom.setAttribute('data-feature-card', '');
      dom.className = 'feature-card rounded-lg border border-border bg-card p-4 shadow-sm';

      // Content hole for h4 + p (the actual editable content)
      const contentDOM = document.createElement('div');
      contentDOM.className = 'feature-card-content';
      dom.appendChild(contentDOM);

      return { dom, contentDOM };
    };
  },

  addCommands() {
    return {
      setFeatureCard:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              { 
                type: 'heading', 
                attrs: { level: 4 }, 
                content: [{ type: 'text', text: 'Feature Title' }] 
              },
              { 
                type: 'paragraph', 
                content: [{ type: 'text', text: 'Feature description here' }] 
              },
            ],
          });
        },
    };
  },
});
