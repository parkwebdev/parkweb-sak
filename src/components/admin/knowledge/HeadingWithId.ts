/**
 * Custom TipTap Heading Extension with Auto-Generated IDs
 * 
 * Extends the default heading to add unique IDs based on content.
 * Enables Table of Contents click-to-scroll functionality.
 * 
 * @module components/admin/knowledge/HeadingWithId
 */

import Heading from '@tiptap/extension-heading';
import { textblockTypeInputRule } from '@tiptap/core';

/**
 * Generates a URL-safe slug from heading text.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Heading extension that auto-generates unique IDs.
 * IDs are based on heading text content for stable references.
 */
export const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('id'),
        renderHTML: (attributes) => {
          // Generate ID from text content if not already set
          const id = attributes.id;
          if (id) {
            return { id };
          }
          return {};
        },
      },
    };
  },

  // Add transform to set ID based on content
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const dom = document.createElement(`h${node.attrs.level}`);
      
      // Generate ID from text content
      const textContent = node.textContent || '';
      const baseSlug = slugify(textContent);
      
      if (baseSlug) {
        // Find position to create unique ID
        const pos = typeof getPos === 'function' ? getPos() : 0;
        const id = `heading-${pos}-${baseSlug}`.slice(0, 50);
        dom.setAttribute('id', id);
      }
      
      // Apply other HTML attributes
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (key !== 'id' && value !== null && value !== undefined) {
          dom.setAttribute(key, String(value));
        }
      });
      
      const contentDOM = dom;
      
      return {
        dom,
        contentDOM,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          if (updatedNode.attrs.level !== node.attrs.level) return false;
          
          // Update ID when content changes
          const newTextContent = updatedNode.textContent || '';
          const newBaseSlug = slugify(newTextContent);
          const pos = typeof getPos === 'function' ? getPos() : 0;
          
          if (newBaseSlug) {
            const newId = `heading-${pos}-${newBaseSlug}`.slice(0, 50);
            dom.setAttribute('id', newId);
          } else {
            dom.removeAttribute('id');
          }
          
          return true;
        },
      };
    };
  },
});
