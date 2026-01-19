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
      setFeatureCard: (attrs?: { title?: string; description?: string; iconName?: string }) => ReturnType;
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

          // Create empty feature cards
          const cards = Array.from({ length: cardCount }, (_, i) => ({
            type: 'featureCard',
            attrs: {
              title: `Feature ${i + 1}`,
              description: 'Description here',
              iconName: '',
            },
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

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: (element) => {
          const titleEl = element.querySelector('[data-feature-title]');
          return titleEl?.textContent || element.getAttribute('data-feature-title') || '';
        },
        renderHTML: (attributes) => ({
          'data-feature-title': attributes.title,
        }),
      },
      description: {
        default: '',
        parseHTML: (element) => {
          const descEl = element.querySelector('[data-feature-description]');
          return descEl?.textContent || element.getAttribute('data-feature-description') || '';
        },
        renderHTML: (attributes) => ({
          'data-feature-description': attributes.description,
        }),
      },
      iconName: {
        default: '',
        parseHTML: (element) => {
          const iconEl = element.querySelector('[data-feature-icon]');
          return iconEl?.textContent || element.getAttribute('data-icon-name') || '';
        },
        renderHTML: (attributes) => ({
          'data-icon-name': attributes.iconName,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-feature-card]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }): DOMOutputSpec {
    const title = node.attrs.title || '';
    const description = node.attrs.description || '';
    const iconName = node.attrs.iconName || '';

    // Store all data in attributes, CSS will handle visual rendering
    const cardAttrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-feature-card': '',
      'data-feature-title': title,
      'data-feature-description': description,
      'data-icon-name': iconName,
      class: 'feature-card rounded-lg border border-border bg-card p-4 shadow-sm',
    });

    return ['div', cardAttrs, 0];
  },

  addCommands() {
    return {
      setFeatureCard:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              title: attrs?.title || 'Feature Title',
              description: attrs?.description || 'Feature description here',
              iconName: attrs?.iconName || '',
            },
          });
        },
    };
  },
});
