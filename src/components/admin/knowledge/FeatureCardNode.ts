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

          // Create feature cards with actual content nodes for proper HTML output
          const cards = Array.from({ length: cardCount }, (_, i) => ({
            type: 'featureCard',
            attrs: {
              title: `Feature ${i + 1}`,
              description: 'Description here',
              iconName: '',
            },
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

    const cardAttrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-feature-card': '',
      'data-feature-title': title,
      'data-feature-description': description,
      'data-icon-name': iconName,
      class: 'feature-card rounded-lg border border-border bg-card p-4 shadow-sm',
    });

    return ['div', cardAttrs, 0];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-feature-card', '');
      dom.className = 'feature-card rounded-lg border border-border bg-card p-4 shadow-sm';

      // Icon placeholder (optional)
      if (node.attrs.iconName) {
        const iconContainer = document.createElement('div');
        iconContainer.className = 'mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary';
        iconContainer.innerHTML = `<span class="text-sm font-medium">${node.attrs.iconName.slice(0, 2).toUpperCase()}</span>`;
        dom.appendChild(iconContainer);
      } else {
        // Empty icon placeholder for adding
        const iconPlaceholder = document.createElement('div');
        iconPlaceholder.className = 'mb-3 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50';
        iconPlaceholder.innerHTML = `<span class="text-xs">Icon</span>`;
        dom.appendChild(iconPlaceholder);
      }

      // Title input
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = node.attrs.title || '';
      titleInput.placeholder = 'Feature title...';
      titleInput.className = 'block w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-transparent hover:border-border focus:border-primary pb-1 mb-2';
      titleInput.addEventListener('input', (e) => {
        const pos = getPos();
        if (typeof pos === 'number') {
          editor.chain().focus().updateAttributes('featureCard', { title: (e.target as HTMLInputElement).value }).run();
        }
      });
      dom.appendChild(titleInput);

      // Description textarea
      const descInput = document.createElement('textarea');
      descInput.value = node.attrs.description || '';
      descInput.placeholder = 'Feature description...';
      descInput.rows = 2;
      descInput.className = 'block w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none border border-transparent rounded hover:border-border focus:border-primary p-1';
      descInput.addEventListener('input', (e) => {
        const pos = getPos();
        if (typeof pos === 'number') {
          editor.chain().focus().updateAttributes('featureCard', { description: (e.target as HTMLTextAreaElement).value }).run();
        }
      });
      dom.appendChild(descInput);

      // Content hole for additional blocks
      const contentDOM = document.createElement('div');
      contentDOM.className = 'feature-card-content mt-2';
      dom.appendChild(contentDOM);

      return { dom, contentDOM };
    };
  },

  addCommands() {
    return {
      setFeatureCard:
        (attrs) =>
        ({ commands }) => {
          const title = attrs?.title || 'Feature Title';
          const description = attrs?.description || 'Feature description here';
          
          return commands.insertContent({
            type: this.name,
            attrs: {
              title,
              description,
              iconName: attrs?.iconName || '',
            },
            content: [
              { 
                type: 'heading', 
                attrs: { level: 4 }, 
                content: [{ type: 'text', text: title }] 
              },
              { 
                type: 'paragraph', 
                content: [{ type: 'text', text: description }] 
              },
            ],
          });
        },
    };
  },
});
