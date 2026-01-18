/**
 * Article Editor Component
 * 
 * Custom TipTap editor for the article editor page.
 * Exposes editor instance via ref for external control.
 * 
 * @see docs/ARTICLE_EDITOR.md
 * @module components/admin/knowledge/ArticleEditor
 */

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useCallback, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { EditorFloatingToolbar } from './EditorFloatingToolbar';
import { HeadingWithId } from './HeadingWithId';
import { cn } from '@/lib/utils';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface ArticleEditorProps {
  content: string;
  onChange: (html: string, headings: Heading[]) => void;
  placeholder?: string;
  className?: string;
}

export interface ArticleEditorRef {
  editor: Editor | null;
  insertBlock: (blockType: string) => void;
}

/**
 * Extracts headings from the TipTap editor DOM with their IDs.
 */
function extractHeadingsFromEditor(editor: Editor): Heading[] {
  const headings: Heading[] = [];
  const editorElement = editor.view.dom;
  const headingElements = editorElement.querySelectorAll('h1, h2, h3');
  
  headingElements.forEach((el, index) => {
    const tagName = el.tagName.toLowerCase();
    const level = parseInt(tagName.replace('h', ''), 10);
    const text = el.textContent?.trim() || '';
    const id = el.getAttribute('id') || `heading-${index}`;
    
    if (text) {
      headings.push({ id, text, level });
    }
  });
  
  return headings;
}

/**
 * Article editor with exposed editor ref for external control.
 */
export const ArticleEditor = forwardRef<ArticleEditorRef, ArticleEditorProps>(
  ({ content, onChange, placeholder = 'Start writing your article...', className }, ref) => {
    const [isReady, setIsReady] = useState(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false, // Disable default heading, use HeadingWithId instead
        }),
        HeadingWithId.configure({
          levels: [1, 2, 3],
        }),
        Image.configure({
          inline: false,
          allowBase64: false,
          HTMLAttributes: {
            class: 'rounded-md max-w-full h-auto my-4',
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
            'article-content max-w-none focus:outline-none px-4 py-6',
            'prose prose-sm sm:prose-base dark:prose-invert max-w-none',
            '[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mb-4 [&_h1]:mt-6',
            '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5',
            '[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4',
            '[&_p]:mb-3 [&_p]:leading-relaxed',
            '[&_ul]:mb-3 [&_ol]:mb-3',
            '[&_li]:mb-1',
            '[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30',
            '[&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
            '[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto',
            '[&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs',
            '[&_hr]:my-6 [&_hr]:border-border'
          ),
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const headings = extractHeadingsFromEditor(editor);
        onChange(html, headings);
      },
      onCreate: ({ editor }) => {
        setIsReady(true);
        // Initial headings extraction
        const headings = extractHeadingsFromEditor(editor);
        onChange(editor.getHTML(), headings);
      },
    });

    // Update editor content when prop changes (for edit mode)
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    // Insert block command handler
    const insertBlock = useCallback(
      (blockType: string) => {
        if (!editor) return;

        const commands: Record<string, () => void> = {
          text: () => editor.chain().focus().setParagraph().run(),
          heading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          heading3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          bulletList: () => editor.chain().focus().toggleBulletList().run(),
          numberedList: () => editor.chain().focus().toggleOrderedList().run(),
          codeBlock: () => editor.chain().focus().toggleCodeBlock().run(),
          quote: () => editor.chain().focus().toggleBlockquote().run(),
          divider: () => editor.chain().focus().setHorizontalRule().run(),
          'divider-dots': () => editor.chain().focus().setHorizontalRule().run(),
          'divider-dashes': () => editor.chain().focus().setHorizontalRule().run(),
          'divider-light': () => editor.chain().focus().setHorizontalRule().run(),
          'divider-heavy': () => editor.chain().focus().setHorizontalRule().run(),
          image: () => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          },
        };

        const command = commands[blockType];
        if (command) {
          command();
        }
      },
      [editor]
    );

    // Expose editor and methods via ref
    useImperativeHandle(
      ref,
      () => ({
        editor,
        insertBlock,
      }),
      [editor, insertBlock]
    );

    return (
      <div className={cn('relative min-h-[500px]', className)}>
        {/* Floating toolbar (BubbleMenu) */}
        {isReady && editor && <EditorFloatingToolbar editor={editor} />}
        
        {/* Editor content */}
        <EditorContent editor={editor} />
      </div>
    );
  }
);

ArticleEditor.displayName = 'ArticleEditor';
