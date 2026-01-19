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
          return titleEl?.textContent || '';
        },
        renderHTML: () => ({}), // Title is rendered as child element
      },
      description: {
        default: '',
        parseHTML: (element) => {
          const descEl = element.querySelector('[data-step-description]');
          return descEl?.textContent || '';
        },
        renderHTML: () => ({}), // Description is rendered as child element
      },
      screenshot: {
        default: '',
        parseHTML: (element) => {
          const imgEl = element.querySelector('[data-step-screenshot]');
          return imgEl?.getAttribute('src') || '';
        },
        renderHTML: () => ({}), // Screenshot is rendered as child element
      },
      screenshotAlt: {
        default: '',
        parseHTML: (element) => {
          const imgEl = element.querySelector('[data-step-screenshot]');
          return imgEl?.getAttribute('alt') || '';
        },
        renderHTML: () => ({}),
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

    // Build content for the step - keeping it simpler to avoid type issues
    // The step structure will be rendered with data attributes for styling
    const stepAttrs = mergeAttributes(HTMLAttributes, {
      'data-step': '',
      'data-step-number': stepNumber,
      'data-step-title': title,
      'data-step-description': description,
      'data-step-screenshot': screenshot,
      'data-step-screenshot-alt': screenshotAlt,
      class: 'step relative pl-12',
    });

    // Use a simpler structure that TipTap can handle
    return ['div', stepAttrs, 0];
  },
});
