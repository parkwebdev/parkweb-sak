/**
 * Editor Floating Toolbar (BubbleMenu)
 * 
 * Appears when text is selected in the article editor.
 * Provides quick formatting options.
 * 
 * @see docs/ARTICLE_EDITOR.md
 * @module components/admin/knowledge/EditorFloatingToolbar
 */

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import {
  Bold01,
  Italic01,
  Underline01,
  Strikethrough01,
  Code01,
  Link01,
  Type01,
} from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';

interface EditorFloatingToolbarProps {
  editor: Editor;
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive?: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}

function ToolbarButton({ icon: Icon, isActive, onClick, label, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

/**
 * Floating toolbar that appears on text selection.
 * Uses TipTap's BubbleMenu extension.
 */
export function EditorFloatingToolbar({ editor }: EditorFloatingToolbarProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);

  const handleLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl || 'https://');
    
    if (url === null) {
      // Cancelled
      return;
    }
    
    if (url === '') {
      // Remove link
      editor.chain().focus().unsetLink().run();
    } else {
      // Set link
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'top',
        offset: { mainAxis: 8 },
      }}
      className={cn(
        'flex items-center gap-0.5 p-1 rounded-lg',
        'bg-popover border border-border shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
    >
      {/* Text Style */}
      <ToolbarButton
        icon={Bold01}
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold (Cmd+B)"
      />
      <ToolbarButton
        icon={Italic01}
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic (Cmd+I)"
      />
      <ToolbarButton
        icon={Underline01}
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline (Cmd+U)"
      />
      <ToolbarButton
        icon={Strikethrough01}
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="Strikethrough"
      />
      
      <Separator orientation="vertical" className="h-5 mx-1" />
      
      {/* Code & Link */}
      <ToolbarButton
        icon={Code01}
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        label="Inline Code (Cmd+E)"
      />
      <ToolbarButton
        icon={Link01}
        isActive={editor.isActive('link')}
        onClick={handleLink}
        label="Insert Link (Cmd+K)"
      />
      
      <Separator orientation="vertical" className="h-5 mx-1" />
      
      {/* Heading shortcuts */}
      <div className="flex items-center">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'px-1.5 py-1 text-xs font-medium rounded transition-colors',
            editor.isActive('heading', { level: 1 })
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
          aria-label="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'px-1.5 py-1 text-xs font-medium rounded transition-colors',
            editor.isActive('heading', { level: 2 })
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
          aria-label="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'px-1.5 py-1 text-xs font-medium rounded transition-colors',
            editor.isActive('heading', { level: 3 })
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
          aria-label="Heading 3"
        >
          H3
        </button>
      </div>
    </BubbleMenu>
  );
}
