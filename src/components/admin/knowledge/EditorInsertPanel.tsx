/**
 * Editor Insert Panel
 * 
 * Right sidebar for inserting blocks into the article editor.
 * Based on Craft's block insertion design.
 * 
 * @see docs/ARTICLE_EDITOR.md for implementation details
 * @module components/admin/knowledge/EditorInsertPanel
 */

import {
  Type01,
  Heading01,
  Heading02,
  List,
  Hash01,
  Image01,
  CodeSnippet02,
  MessageSquare01,
  Minus,
  AlertCircle,
} from '@untitledui/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface BlockType {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description?: string;
  disabled?: boolean;
}

const BLOCK_TYPES: BlockType[] = [
  { id: 'text', label: 'Text', icon: Type01, description: 'Paragraph text' },
  { id: 'heading1', label: 'Heading 1', icon: Heading01, description: 'Large heading' },
  { id: 'heading2', label: 'Heading 2', icon: Heading02, description: 'Medium heading' },
  { id: 'bulletList', label: 'Bullet List', icon: List, description: 'Unordered list' },
  { id: 'numberedList', label: 'Numbered List', icon: Hash01, description: 'Ordered list' },
  { id: 'image', label: 'Image', icon: Image01, description: 'Upload image' },
  { id: 'codeBlock', label: 'Code Block', icon: CodeSnippet02, description: 'Code snippet' },
  { id: 'quote', label: 'Quote', icon: MessageSquare01, description: 'Blockquote' },
  { id: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal rule' },
  { id: 'callout', label: 'Callout', icon: AlertCircle, description: 'Info callout', disabled: true },
];

interface EditorInsertPanelProps {
  onInsert?: (blockType: string) => void;
}

/**
 * Right sidebar panel for inserting content blocks.
 * Currently displays available block types.
 * Future: Will integrate with TipTap editor to insert at cursor.
 */
export function EditorInsertPanel({ onInsert }: EditorInsertPanelProps) {
  const handleInsert = (blockType: string) => {
    if (onInsert) {
      onInsert(blockType);
    }
    // TODO: Integrate with TipTap editor via ref/context
  };

  return (
    <aside className="w-[200px] border-l border-border bg-background flex-shrink-0 flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Insert Block
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {BLOCK_TYPES.map((block) => (
            <button
              key={block.id}
              onClick={() => handleInsert(block.id)}
              disabled={block.disabled}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left',
                'text-sm text-foreground hover:bg-accent/50 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
              )}
              title={block.description}
            >
              <block.icon size={16} className="text-muted-foreground flex-shrink-0" />
              <span>{block.label}</span>
            </button>
          ))}
        </div>
        
        {/* Divider Types Section */}
        <div className="p-3 pt-4 border-t border-border mt-2">
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
            Lines
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleInsert('divider-dots')}
              className="flex items-center justify-center px-2 py-2 rounded-md border border-border hover:bg-accent/50 transition-colors text-muted-foreground text-xs"
              title="Dotted line"
            >
              · · ·
            </button>
            <button
              onClick={() => handleInsert('divider-dashes')}
              className="flex items-center justify-center px-2 py-2 rounded-md border border-border hover:bg-accent/50 transition-colors text-muted-foreground text-xs"
              title="Dashed line"
            >
              - - -
            </button>
            <button
              onClick={() => handleInsert('divider-light')}
              className="flex items-center justify-center px-2 py-2 rounded-md border border-border hover:bg-accent/50 transition-colors text-muted-foreground text-xs"
              title="Light line"
            >
              ───
            </button>
            <button
              onClick={() => handleInsert('divider-heavy')}
              className="flex items-center justify-center px-2 py-2 rounded-md border border-border hover:bg-accent/50 transition-colors text-muted-foreground text-xs"
              title="Heavy line"
            >
              ━━━
            </button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
