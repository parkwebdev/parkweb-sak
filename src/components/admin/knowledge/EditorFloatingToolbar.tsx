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
  Link03,
  FaceSmile,
  Palette,
} from '@untitledui/icons';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { ArticleLinkPicker } from './ArticleLinkPicker';
import { LinkInputDialog } from './LinkInputDialog';
import { toast } from '@/lib/toast';

// Common text colors for the color picker
const TEXT_COLORS = [
  { name: 'Default', color: null },
  { name: 'Gray', color: 'hsl(var(--muted-foreground))' },
  { name: 'Red', color: 'hsl(0 84% 60%)' },
  { name: 'Orange', color: 'hsl(25 95% 53%)' },
  { name: 'Yellow', color: 'hsl(48 96% 53%)' },
  { name: 'Green', color: 'hsl(142 76% 36%)' },
  { name: 'Blue', color: 'hsl(217 91% 60%)' },
  { name: 'Purple', color: 'hsl(262 83% 58%)' },
  { name: 'Pink', color: 'hsl(330 81% 60%)' },
] as const;

// Common emoji for quick insert
const QUICK_EMOJIS = ['😊', '👍', '❤️', '🎉', '🚀', '💡', '⭐', '✅', '❌', '⚠️', '📌', '🔥'];

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
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isArticleLinkPickerOpen, setIsArticleLinkPickerOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');

  const handleLinkClick = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href || '';
    setCurrentLinkUrl(previousUrl);
    setIsLinkDialogOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback((url: string) => {
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const handleColorSelect = useCallback((color: string | null) => {
    if (color === null) {
      editor.chain().focus().unsetMark('textStyle').run();
    } else {
      editor.chain().focus().setMark('textStyle', { style: `color: ${color}` }).run();
    }
    setIsColorPickerOpen(false);
  }, [editor]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
    setIsEmojiPickerOpen(false);
  }, [editor]);

  const handleMention = useCallback(() => {
    toast.info('Coming soon', { description: 'Mentions will be available in a future update.' });
  }, []);

  const handleArticleLink = useCallback(() => {
    if (editor.isActive('articleLink')) {
      editor.chain().focus().unsetMark('articleLink').run();
      return;
    }
    setIsArticleLinkPickerOpen(true);
  }, [editor]);

  const handleArticleLinkSelect = useCallback((categoryId: string, articleSlug: string) => {
    editor
      .chain()
      .focus()
      .extendMarkRange('articleLink')
      .setMark('articleLink', { categoryId, articleSlug })
      .run();
  }, [editor]);

  return (
    <>
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
        onClick={handleLinkClick}
        label="Insert Link (Cmd+K)"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleArticleLink}
            aria-label="Link to Help Center Article"
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              editor.isActive('articleLink')
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <Link03 size={14} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Article Link</TooltipContent>
      </Tooltip>
      
      <Separator orientation="vertical" className="h-5 mx-1" />
      
      {/* Text Color Picker */}
      <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Text color"
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <Palette size={14} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-3 gap-1">
            {TEXT_COLORS.map((item) => (
              <button
                key={item.name}
                onClick={() => handleColorSelect(item.color)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded text-xs',
                  'hover:bg-accent transition-colors'
                )}
              >
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: item.color || 'hsl(var(--foreground))' }}
                />
                {item.name}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
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
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={cn(
            'px-1.5 py-1 text-xs font-medium rounded transition-colors',
            editor.isActive('heading', { level: 4 })
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
          aria-label="Heading 4"
        >
          H4
        </button>
      </div>
      
      
      <Separator orientation="vertical" className="h-5 mx-1" />
      
      {/* Emoji Picker */}
      <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Insert emoji"
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <FaceSmile size={14} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <div className="grid grid-cols-6 gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent transition-colors text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </BubbleMenu>

    {/* Dialogs rendered outside BubbleMenu to stay open */}
    <ArticleLinkPicker
      open={isArticleLinkPickerOpen}
      onOpenChange={setIsArticleLinkPickerOpen}
      onSelect={handleArticleLinkSelect}
    />
    <LinkInputDialog
      open={isLinkDialogOpen}
      onOpenChange={setIsLinkDialogOpen}
      onSubmit={handleLinkSubmit}
      initialUrl={currentLinkUrl}
    />
    </>
  );
}
