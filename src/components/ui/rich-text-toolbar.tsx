/**
 * RichTextToolbar Component
 * 
 * Toolbar for the RichTextEditor with formatting buttons.
 * Includes text styling, headings, lists, links, images, and code formatting.
 * @module components/ui/rich-text-toolbar
 */

import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Bold01,
  Italic01,
  Underline01,
  Strikethrough01,
  Heading01,
  Heading02,
  List,
  Hash01,
  Link01,
  Image01,
  Code02,
  CodeSnippet02,
} from '@untitledui/icons';
import { useRef } from 'react';

interface RichTextToolbarProps {
  editor: Editor | null;
  onImageUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ToolbarButton = ({ icon, label, isActive, onClick, disabled }: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {label}
    </TooltipContent>
  </Tooltip>
);

export const RichTextToolbar = ({ editor, onImageUpload, isUploading }: RichTextToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImageUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30 rounded-t-md">
      {/* Text formatting */}
      <ToolbarButton
        icon={<Bold01 className="h-4 w-4" />}
        label="Bold"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={<Italic01 className="h-4 w-4" />}
        label="Italic"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={<Underline01 className="h-4 w-4" />}
        label="Underline"
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon={<Strikethrough01 className="h-4 w-4" />}
        label="Strikethrough"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <ToolbarButton
        icon={<Heading01 className="h-4 w-4" />}
        label="Heading 1"
        isActive={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={<Heading02 className="h-4 w-4" />}
        label="Heading 2"
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists */}
      <ToolbarButton
        icon={<List className="h-4 w-4" />}
        label="Bullet List"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={<Hash01 className="h-4 w-4" />}
        label="Numbered List"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Links & Media */}
      <ToolbarButton
        icon={<Link01 className="h-4 w-4" />}
        label="Add Link"
        isActive={editor.isActive('link')}
        onClick={addLink}
      />
      <ToolbarButton
        icon={<Image01 className="h-4 w-4" />}
        label="Insert Image"
        onClick={handleImageClick}
        disabled={isUploading}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Code */}
      <ToolbarButton
        icon={<Code02 className="h-4 w-4" />}
        label="Inline Code"
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        icon={<CodeSnippet02 className="h-4 w-4" />}
        label="Code Block"
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {isUploading && (
        <span className="ml-2 text-xs text-muted-foreground">Uploading...</span>
      )}
    </div>
  );
};
