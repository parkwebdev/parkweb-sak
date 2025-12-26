/**
 * RichTextEditor Component
 * 
 * Full-featured rich text editor built on Tiptap.
 * Supports formatting, images, links, and code blocks.
 * Includes drag-and-drop and paste image upload.
 * @module components/ui/rich-text-editor
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useCallback, useEffect, useState } from 'react';
import { RichTextToolbar } from './rich-text-toolbar';
import { uploadArticleImage } from '@/lib/article-image-upload';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  agentId?: string;
  userId?: string;
  className?: string;
  minHeight?: string;
  /** When true, only show Bold, Italic, and Link buttons. Disables image upload. */
  minimalMode?: boolean;
}

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = 'Write your content here...',
  agentId,
  userId,
  className,
  minHeight = '200px',
  minimalMode = false,
}: RichTextEditorProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-md max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
    ],
    content,
    editorProps: {
      attributes: {
        class: cn('article-content max-w-none focus:outline-none p-4'),
        style: `min-height: ${minHeight}`,
      },
      // Disable image drop/paste in minimal mode
      handleDrop: minimalMode ? undefined : (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: minimalMode ? undefined : (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                handleImageUpload(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when prop changes (for edit mode)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor || !userId || !agentId) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        logger.warn('Invalid file type');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        logger.warn('File too large');
        return;
      }

      setIsUploading(true);
      try {
        const imageUrl = await uploadArticleImage(file, userId, agentId);
        editor.chain().focus().setImage({ src: imageUrl }).run();
      } catch (error: unknown) {
        logger.error('Failed to upload image:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [editor, userId, agentId]
  );

  return (
    <div className={cn('border border-input rounded-md bg-background', className)}>
      <RichTextToolbar
        editor={editor}
        onImageUpload={handleImageUpload}
        isUploading={isUploading}
        minimalMode={minimalMode}
      />
      <EditorContent editor={editor} />
    </div>
  );
};
