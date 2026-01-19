/**
 * Step-by-Step Node Extension for TipTap
 * 
 * Provides a numbered step-by-step guide block. Content (title, description)
 * is stored as heading/paragraph nodes INSIDE the step, not as attributes.
 * This is the industry-standard content-based architecture.
 * 
 * @module components/admin/knowledge/StepByStepNode
 */

import { Node, mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';

export interface StepData {
  title: string;
  description?: string;
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
          
          // Create step nodes with content as heading/paragraph nodes
          const stepNodes = steps.map((step, index) => ({
            type: 'step',
            attrs: { stepNumber: index + 1 },
            content: [
              { 
                type: 'heading', 
                attrs: { level: 4 }, 
                content: step.title ? [{ type: 'text', text: step.title }] : [] 
              },
              ...(step.description 
                ? [{ type: 'paragraph', content: [{ type: 'text', text: step.description }] }] 
                : []
              ),
            ],
          }));

          return commands.insertContent({
            type: this.name,
            content: stepNodes,
          });
        },
      addStep:
        () =>
        ({ state, chain }) => {
          const { selection } = state;
          const stepByStepNode = state.doc.resolve(selection.from).node(1);
          
          if (stepByStepNode?.type.name === 'stepByStep') {
            const stepCount = stepByStepNode.childCount;
            const newStepNum = stepCount + 1;
            return chain()
              .insertContentAt(selection.from, {
                type: 'step',
                attrs: { stepNumber: newStepNum },
                content: [
                  { 
                    type: 'heading', 
                    attrs: { level: 4 }, 
                    content: [{ type: 'text', text: `Step ${newStepNum}` }] 
                  },
                ],
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
 * Individual step node within a step-by-step guide.
 * Content (title as h4, description as p) is edited directly in TipTap.
 * Only stepNumber is stored as an attribute.
 */
export const StepNode = Node.create({
  name: 'step',

  group: 'block',

  content: 'block+',

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
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-step': '',
        'data-step-number': node.attrs.stepNumber,
        class: 'step relative pl-12',
      }),
      0, // Content slot - TipTap renders h4/p nodes here
    ];
  },

  /**
   * Simple NodeView that renders the step number circle.
   * Content (h4/p) is editable directly by TipTap - no custom inputs.
   */
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'step relative pl-12 py-2';
      dom.setAttribute('data-step', '');
      dom.setAttribute('data-step-number', String(node.attrs.stepNumber));

      // Step number circle (non-editable)
      const numberCircle = document.createElement('div');
      numberCircle.className = 'step-number absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium';
      numberCircle.textContent = String(node.attrs.stepNumber);
      numberCircle.contentEditable = 'false';
      dom.appendChild(numberCircle);

      // Content area - TipTap renders the heading/paragraph nodes here
      const contentDOM = document.createElement('div');
      contentDOM.className = 'step-content space-y-1';
      dom.appendChild(contentDOM);

      return { dom, contentDOM };
    };
  },
});
