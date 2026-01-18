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
  Table,
  InfoCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from '@untitledui/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableGridSelector } from './TableGridSelector';
import { cn } from '@/lib/utils';

interface BlockType {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description?: string;
  shortcut?: string;
  disabled?: boolean;
}

const BLOCK_TYPES: BlockType[] = [
  { id: 'text', label: 'Text', icon: Type01, description: 'Paragraph text' },
  { id: 'heading1', label: 'Heading 1', icon: Heading01, description: 'Large heading', shortcut: '⌘⇧1' },
  { id: 'heading2', label: 'Heading 2', icon: Heading02, description: 'Medium heading', shortcut: '⌘⇧2' },
  { id: 'heading3', label: 'Heading 3', icon: Heading02, description: 'Small heading', shortcut: '⌘⇧3' },
  { id: 'bulletList', label: 'Bullet List', icon: List, description: 'Unordered list', shortcut: '⌘⇧8' },
  { id: 'numberedList', label: 'Numbered List', icon: Hash01, description: 'Ordered list', shortcut: '⌘⇧9' },
  { id: 'image', label: 'Image', icon: Image01, description: 'Insert image from URL' },
  { id: 'codeBlock', label: 'Code Block', icon: CodeSnippet02, description: 'Syntax highlighted code' },
  { id: 'quote', label: 'Quote', icon: MessageSquare01, description: 'Blockquote' },
  { id: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal rule' },
];

const CALLOUT_TYPES: BlockType[] = [
  { id: 'callout-info', label: 'Info', icon: InfoCircle, description: 'Information callout' },
  { id: 'callout-warning', label: 'Warning', icon: AlertTriangle, description: 'Warning callout' },
  { id: 'callout-success', label: 'Success', icon: CheckCircle, description: 'Success callout' },
  { id: 'callout-error', label: 'Error', icon: XCircle, description: 'Error callout' },
];

interface EditorInsertPanelProps {
  onInsert: (blockType: string) => void;
  onInsertTable: (rows: number, cols: number) => void;
}

/**
 * Right sidebar panel for inserting content blocks.
 * Wired to TipTap editor via onInsert callback.
 */
export function EditorInsertPanel({ onInsert, onInsertTable }: EditorInsertPanelProps) {
  const handleInsert = (blockType: string) => {
    onInsert(blockType);
  };

  return (
    <aside className="w-[200px] border-l border-border bg-background flex-shrink-0 flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Insert Block
        </h2>
      </div>
      <ScrollArea className="flex-1">
        {/* Basic Blocks */}
        <div className="p-2 space-y-0.5">
          {BLOCK_TYPES.map((block) => (
            <Tooltip key={block.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleInsert(block.id)}
                  disabled={block.disabled}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left',
                    'text-sm text-foreground hover:bg-accent transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                  )}
                >
                  <block.icon size={16} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1">{block.label}</span>
                  {block.shortcut && (
                    <span className="text-2xs text-muted-foreground/60">{block.shortcut}</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {block.description}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        {/* Callouts Section */}
        <div className="p-3 pt-2 border-t border-border mt-2">
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
            Callouts
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {CALLOUT_TYPES.map((callout) => (
              <Tooltip key={callout.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleInsert(callout.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left',
                      'text-xs text-foreground hover:bg-accent transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  >
                    <callout.icon size={14} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span>{callout.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  {callout.description}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* Divider Types Section */}
        <div className="p-3 pt-2 border-t border-border">
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
        
        {/* Table Section */}
        <div className="p-3 pt-2 border-t border-border">
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1.5">
            <Table size={12} aria-hidden="true" />
            Insert Table
          </h3>
          <TableGridSelector onSelect={onInsertTable} maxRows={6} maxCols={6} />
        </div>
      </ScrollArea>
    </aside>
  );
}
