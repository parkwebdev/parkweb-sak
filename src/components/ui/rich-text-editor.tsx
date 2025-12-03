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

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  agentId: string;
  userId: string;
  className?: string;
  minHeight?: string;
}

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = 'Write your content here...',
  agentId,
  userId,
  className,
  minHeight = '200px',
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
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4',
          'prose-headings:font-semibold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-a:text-primary prose-a:underline',
          'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-md',
          'prose-ul:list-disc prose-ul:pl-4',
          'prose-ol:list-decimal prose-ol:pl-4',
          'prose-img:rounded-md prose-img:max-w-full',
        ),
        style: `min-height: ${minHeight}`,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
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
        console.error('Invalid file type');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large');
        return;
      }

      setIsUploading(true);
      try {
        const imageUrl = await uploadArticleImage(file, userId, agentId);
        editor.chain().focus().setImage({ src: imageUrl }).run();
      } catch (error) {
        console.error('Failed to upload image:', error);
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
      />
      <EditorContent editor={editor} />
    </div>
  );
};
