/**
 * Article Editor Component
 * 
 * Custom TipTap editor for the article editor page.
 * Exposes editor instance via ref for external control.
 * 
 * ARCHITECTURE:
 * - onChange: Called ONLY for user edits (not during hydration)
 * - onHeadingsChange: Called for ToC updates (including during hydration)
 * - Headings extracted from ProseMirror document (not DOM) for reliability
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
import { TextStyle } from '@tiptap/extension-text-style';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { useCallback, useEffect, useImperativeHandle, forwardRef, useState, useRef } from 'react';
import { EditorFloatingToolbar } from './EditorFloatingToolbar';
import { HeadingWithId } from './HeadingWithId';
import { CalloutNode } from './CalloutNode';
import { StepByStepNode, StepNode } from './StepByStepNode';
import { FeatureGridNode, FeatureCardNode } from './FeatureCardNode';
import { RelatedArticlesNode } from './RelatedArticlesNode';
import { ArticleLinkMark } from './ArticleLinkMark';
import { VideoNode } from './VideoNode';
import { cn } from '@/lib/utils';
import { 
  detectVideoType, 
  getEmbedUrl, 
  extractYouTubeId, 
  getYouTubeThumbnail,
  isValidVideoUrl 
} from '@/lib/video-utils';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface ArticleEditorProps {
  content: string;
  /** Called ONLY for user edits - not during hydration/external sync */
  onChange: (html: string) => void;
  /** Called for ToC updates - safe to call during hydration */
  onHeadingsChange: (headings: Heading[]) => void;
  placeholder?: string;
  className?: string;
}

export interface ArticleEditorRef {
  editor: Editor | null;
  insertBlock: (blockType: string) => void;
  insertTable: (rows: number, cols: number) => void;
}

/**
 * Slugify text for heading IDs
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extracts headings from the ProseMirror document (not DOM).
 * This is more reliable than DOM extraction because it doesn't depend on render timing.
 * 
 * IMPORTANT: The ID format must match HeadingWithId NodeView exactly:
 * `heading-${pos}-${slug}` for proper ToC click-to-scroll functionality.
 */
function extractHeadingsFromDocument(editor: Editor): Heading[] {
  const headings: Heading[] = [];
  
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const level = node.attrs.level as number;
      const text = node.textContent?.trim() || '';
      
      if (text) {
        // Match the ID format used by HeadingWithId NodeView: heading-${pos}-${slug}
        const baseSlug = slugify(text);
        const id = baseSlug ? `heading-${pos}-${baseSlug}`.slice(0, 50) : `heading-${pos}`;
        headings.push({ id, text, level });
      }
    }
    return true; // Continue traversing
  });
  
  return headings;
}

/**
 * Article editor with exposed editor ref for external control.
 * 
 * Key architectural decisions:
 * 1. onChange is ONLY called for user edits (via onUpdate)
 * 2. onHeadingsChange is called separately for ToC updates
 * 3. Headings are extracted from ProseMirror doc, not DOM
 * 4. External content sync does NOT trigger onChange
 */
export const ArticleEditor = forwardRef<ArticleEditorRef, ArticleEditorProps>(
  ({ content, onChange, onHeadingsChange, placeholder = 'Start writing your article...', className }, ref) => {
    const [isReady, setIsReady] = useState(false);
    
    // Track last synced content to detect external vs internal changes
    const lastSyncedContentRef = useRef(content);
    
    // Track if we're in the initial mount phase
    const isInitialMountRef = useRef(true);

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
        // TextStyle for color support
        TextStyle,
        // Table extensions
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'border-collapse table-auto w-full my-4',
          },
        }),
        TableRow.configure({
          HTMLAttributes: {
            class: 'border-b border-border',
          },
        }),
        TableHeader.configure({
          HTMLAttributes: {
            class: 'border border-border bg-muted/50 px-3 py-2 text-left font-medium',
          },
        }),
        TableCell.configure({
          HTMLAttributes: {
            class: 'border border-border px-3 py-2',
          },
        }),
        // Callout extension
        CalloutNode,
        // Help Center component extensions
        StepByStepNode,
        StepNode,
        FeatureGridNode,
        FeatureCardNode,
        RelatedArticlesNode,
        ArticleLinkMark,
        VideoNode,
      ],
      content, // Initial content from prop
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
            '[&_hr]:my-6 [&_hr]:border-border',
            // Table styles
            '[&_table]:border-collapse [&_table]:w-full [&_table]:my-4',
            '[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium',
            '[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2',
            // Callout styles
            '[&_.callout]:rounded-md [&_.callout]:border-l-4 [&_.callout]:p-4 [&_.callout]:my-4'
          ),
        },
      },
      // CRITICAL: onUpdate is called ONLY for user edits
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        lastSyncedContentRef.current = html;
        
        // Only call onChange for user edits - this triggers hasUnsavedChanges
        onChange(html);
        
        // Update headings for ToC
        const headings = extractHeadingsFromDocument(editor);
        onHeadingsChange(headings);
      },
      onCreate: ({ editor }) => {
        setIsReady(true);
        
        // Extract and send headings on initial mount (for ToC)
        // This does NOT call onChange, so it won't trigger hasUnsavedChanges
        queueMicrotask(() => {
          if (editor && !editor.isDestroyed) {
            const headings = extractHeadingsFromDocument(editor);
            onHeadingsChange(headings);
            isInitialMountRef.current = false;
          }
        });
      },
    });

    // Sync editor content when prop changes externally (e.g., loading from DB)
    // This does NOT call onChange - only updates the editor and headings
    useEffect(() => {
      if (!editor || editor.isDestroyed) return;
      
      // Skip if content hasn't changed from what we last synced
      if (content === lastSyncedContentRef.current) return;
      
      // Update ref to track the new external content
      lastSyncedContentRef.current = content;
      
      // Only update editor if content actually differs from current editor state
      if (content !== editor.getHTML()) {
        // emitUpdate: false prevents onUpdate from firing
        editor.commands.setContent(content, { emitUpdate: false });
        
        // Update headings for ToC (safe during hydration)
        queueMicrotask(() => {
          if (editor && !editor.isDestroyed) {
            const headings = extractHeadingsFromDocument(editor);
            onHeadingsChange(headings);
          }
        });
      }
    }, [content, editor, onHeadingsChange]);

    // Insert table at cursor
    const insertTable = useCallback(
      (rows: number, cols: number) => {
        if (!editor) return;
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
      },
      [editor]
    );

    // Insert block command handler
    const insertBlock = useCallback(
      (blockType: string) => {
        if (!editor) return;

        const blockCommands: Record<string, () => void> = {
          text: () => editor.chain().focus().setParagraph().run(),
          heading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          heading3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          bulletList: () => editor.chain().focus().toggleBulletList().run(),
          numberedList: () => editor.chain().focus().toggleOrderedList().run(),
          codeBlock: () => editor.chain().focus().toggleCodeBlock().run(),
          quote: () => editor.chain().focus().toggleBlockquote().run(),
          divider: () => editor.chain().focus().setHorizontalRule().run(),
          pageBreak: () => {
            // Insert a page break as a styled horizontal rule with extra spacing
            editor.chain().focus().setHorizontalRule().run();
          },
          image: () => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          },
          video: () => {
            const url = window.prompt('Enter video URL (YouTube, Vimeo, Loom, Wistia, or direct video file):');
            if (url && isValidVideoUrl(url)) {
              const videoType = detectVideoType(url);
              const embedUrl = getEmbedUrl(url, videoType);
              const thumbnail = videoType === 'youtube' 
                ? getYouTubeThumbnail(extractYouTubeId(url) || '') 
                : '';
              
              editor.chain().focus().setVideo({
                src: embedUrl,
                videoType,
                thumbnail,
              }).run();
            } else if (url) {
              window.alert('Please enter a valid video URL (YouTube, Vimeo, Loom, Wistia, or direct video file)');
            }
          },
          // Callouts
          'callout-info': () => editor.chain().focus().setCallout({ type: 'info' }).run(),
          'callout-warning': () => editor.chain().focus().setCallout({ type: 'warning' }).run(),
          'callout-success': () => editor.chain().focus().setCallout({ type: 'success' }).run(),
          'callout-error': () => editor.chain().focus().setCallout({ type: 'error' }).run(),
          // Help Center blocks
          stepByStep: () => editor.chain().focus().setStepByStep().run(),
          featureGrid2: () => editor.chain().focus().setFeatureGrid({ columns: 2, cardCount: 2 }).run(),
          featureGrid3: () => editor.chain().focus().setFeatureGrid({ columns: 3, cardCount: 3 }).run(),
          featureCard: () => editor.chain().focus().setFeatureCard().run(),
          relatedArticles: () => editor.chain().focus().setRelatedArticles({ articles: [] }).run(),
          articleLink: () => {
            // Article links should be created from the floating toolbar with text selected
            // This shows an info message when trying to insert from the panel
            window.alert('To create an article link, select text first then use the Article Link button in the floating toolbar.');
          },
        };

        // Execute the block command if it exists
        const command = blockCommands[blockType];
        if (command) {
          command();
        } else {
          console.warn(`Unknown block type: ${blockType}`);
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
        insertTable,
      }),
      [editor, insertBlock, insertTable]
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
