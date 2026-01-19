/**
 * Step-by-Step Node Extension for TipTap
 * 
 * Provides a numbered step-by-step guide block with optional
 * descriptions and screenshots for each step.
 * 
 * @module components/admin/knowledge/StepByStepNode
 */

import { Node, mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';

export interface StepData {
  title: string;
  description?: string;
  screenshot?: string;
  screenshotAlt?: string;
}

export interface StepByStepOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    stepByStep: {
      /**
       * Insert a step-by-step guide block
       */
      setStepByStep: (attrs?: { steps?: StepData[] }) => ReturnType;
      /**
       * Add a new step to the current step-by-step block
       */
      addStep: () => ReturnType;
      /**
       * Remove the step-by-step block
       */
      unsetStepByStep: () => ReturnType;
    };
  }
}

/**
 * Container node for step-by-step guides
 */
export const StepByStepNode = Node.create<StepByStepOptions>({
  name: 'stepByStep',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'step+',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-stepbystep]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }): DOMOutputSpec {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-stepbystep': '',
        class: 'stepbystep my-6 space-y-6',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setStepByStep:
        (attrs) =>
        ({ commands }) => {
          const steps = attrs?.steps || [
            { title: 'Step 1', description: '' },
            { title: 'Step 2', description: '' },
          ];
          
          // Create the step nodes content
          const stepNodes = steps.map((step, index) => ({
            type: 'step',
            attrs: {
              stepNumber: index + 1,
              title: step.title,
              description: step.description || '',
              screenshot: step.screenshot || '',
              screenshotAlt: step.screenshotAlt || '',
            },
          }));

          return commands.insertContent({
            type: this.name,
            content: stepNodes,
          });
        },
      addStep:
        () =>
        ({ state, chain }) => {
          // Find current stepByStep node and add a step
          const { selection } = state;
          const stepByStepNode = state.doc.resolve(selection.from).node(1);
          
          if (stepByStepNode?.type.name === 'stepByStep') {
            const stepCount = stepByStepNode.childCount;
            return chain()
              .insertContentAt(selection.from, {
                type: 'step',
                attrs: {
                  stepNumber: stepCount + 1,
                  title: `Step ${stepCount + 1}`,
                  description: '',
                  screenshot: '',
                  screenshotAlt: '',
                },
              })
              .run();
          }
          return false;
        },
      unsetStepByStep:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});

/**
 * Individual step node within a step-by-step guide
 */
export const StepNode = Node.create({
  name: 'step',

  group: 'block',

  content: 'block*',

  defining: true,

  addAttributes() {
    return {
      stepNumber: {
        default: 1,
        parseHTML: (element) => parseInt(element.getAttribute('data-step-number') || '1', 10),
        renderHTML: (attributes) => ({
          'data-step-number': attributes.stepNumber,
        }),
      },
      title: {
        default: '',
        parseHTML: (element) => {
          const titleEl = element.querySelector('[data-step-title]');
          return titleEl?.textContent || element.getAttribute('data-step-title') || '';
        },
        renderHTML: (attributes) => ({
          'data-step-title': attributes.title,
        }),
      },
      description: {
        default: '',
        parseHTML: (element) => {
          const descEl = element.querySelector('[data-step-description]');
          return descEl?.textContent || element.getAttribute('data-step-description') || '';
        },
        renderHTML: (attributes) => ({
          'data-step-description': attributes.description,
        }),
      },
      screenshot: {
        default: '',
        parseHTML: (element) => {
          const imgEl = element.querySelector('[data-step-screenshot]');
          return imgEl?.getAttribute('src') || element.getAttribute('data-step-screenshot') || '';
        },
        renderHTML: (attributes) => ({
          'data-step-screenshot': attributes.screenshot,
        }),
      },
      screenshotAlt: {
        default: '',
        parseHTML: (element) => {
          const imgEl = element.querySelector('[data-step-screenshot]');
          return imgEl?.getAttribute('alt') || element.getAttribute('data-step-screenshot-alt') || '';
        },
        renderHTML: (attributes) => ({
          'data-step-screenshot-alt': attributes.screenshotAlt,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-step]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }): DOMOutputSpec {
    const stepNumber = node.attrs.stepNumber || 1;
    const title = node.attrs.title || '';
    const description = node.attrs.description || '';
    const screenshot = node.attrs.screenshot || '';
    const screenshotAlt = node.attrs.screenshotAlt || title;

    const stepAttrs = mergeAttributes(HTMLAttributes, {
      'data-step': '',
      'data-step-number': stepNumber,
      'data-step-title': title,
      'data-step-description': description,
      'data-step-screenshot': screenshot,
      'data-step-screenshot-alt': screenshotAlt,
      class: 'step relative pl-12',
    });

    return ['div', stepAttrs, 0];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-step', '');
      dom.setAttribute('data-step-number', String(node.attrs.stepNumber || 1));
      dom.className = 'step relative pl-12 py-2';

      // Step number circle
      const numberCircle = document.createElement('div');
      numberCircle.className = 'absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium';
      numberCircle.textContent = String(node.attrs.stepNumber || 1);
      dom.appendChild(numberCircle);

      // Connector line (except for last step - handled by CSS)
      const connectorLine = document.createElement('div');
      connectorLine.className = 'absolute left-4 top-10 bottom-0 w-px bg-border -translate-x-1/2';
      dom.appendChild(connectorLine);

      // Content container
      const contentContainer = document.createElement('div');
      contentContainer.className = 'space-y-2';

      // Title input
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = node.attrs.title || '';
      titleInput.placeholder = 'Step title...';
      titleInput.className = 'block w-full bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-transparent hover:border-border focus:border-primary pb-1';
      titleInput.addEventListener('input', (e) => {
        const pos = getPos();
        if (typeof pos === 'number') {
          editor.chain().focus().updateAttributes('step', { title: (e.target as HTMLInputElement).value }).run();
        }
      });
      contentContainer.appendChild(titleInput);

      // Description textarea
      const descInput = document.createElement('textarea');
      descInput.value = node.attrs.description || '';
      descInput.placeholder = 'Step description (optional)...';
      descInput.rows = 2;
      descInput.className = 'block w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none border border-transparent rounded hover:border-border focus:border-primary p-1';
      descInput.addEventListener('input', (e) => {
        const pos = getPos();
        if (typeof pos === 'number') {
          editor.chain().focus().updateAttributes('step', { description: (e.target as HTMLTextAreaElement).value }).run();
        }
      });
      contentContainer.appendChild(descInput);

      // Screenshot display (if present)
      if (node.attrs.screenshot) {
        const screenshotContainer = document.createElement('div');
        screenshotContainer.className = 'mt-3 rounded-lg overflow-hidden border border-border';
        const img = document.createElement('img');
        img.src = node.attrs.screenshot;
        img.alt = node.attrs.screenshotAlt || node.attrs.title || 'Step screenshot';
        img.className = 'w-full h-auto';
        screenshotContainer.appendChild(img);
        contentContainer.appendChild(screenshotContainer);
      }

      // Content hole for additional blocks
      const contentDOM = document.createElement('div');
      contentDOM.className = 'step-content mt-2';
      contentContainer.appendChild(contentDOM);

      dom.appendChild(contentContainer);

      return { dom, contentDOM };
    };
  },
});
