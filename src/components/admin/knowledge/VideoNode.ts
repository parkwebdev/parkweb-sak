/**
 * VideoNode - TipTap extension for video embeds
 * 
 * Supports YouTube, Vimeo, Loom, Wistia, and self-hosted videos.
 * Renders as data-video div for CSS styling and React hydration.
 * 
 * @module components/admin/knowledge/VideoNode
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VideoNodeView } from './VideoNodeView';
import type { VideoType } from '@/lib/video-utils';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      /** Insert a video block */
      setVideo: (attrs: {
        src: string;
        videoType?: VideoType;
        title?: string;
        thumbnail?: string;
      }) => ReturnType;
    };
  }
}

export const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true, // Non-editable content (single unit)
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-src'),
        renderHTML: (attributes) => ({
          'data-src': attributes.src,
        }),
      },
      videoType: {
        default: 'self-hosted',
        parseHTML: (element) => element.getAttribute('data-video-type') || 'self-hosted',
        renderHTML: (attributes) => ({
          'data-video-type': attributes.videoType,
        }),
      },
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-title') || '',
        renderHTML: (attributes) => ({
          'data-title': attributes.title || '',
        }),
      },
      thumbnail: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-thumbnail') || '',
        renderHTML: (attributes) => ({
          'data-thumbnail': attributes.thumbnail || '',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-video': '',
          class: 'video-embed-wrapper my-4',
        },
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },

  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
