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
  Table,
  InfoCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
  // Icons for HC components
  CheckSquare,
  Grid01,
  Link01,
  BookOpen01,
  LayoutAlt02,
} from '@untitledui/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { TableGridSelector } from './TableGridSelector';
import { cn } from '@/lib/utils';

interface BlockType {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description?: string;
  shortcut?: string;
  disabled?: boolean;
  future?: boolean;
}

/**
 * Basic content blocks - always available
 */
const BASIC_BLOCKS: BlockType[] = [
  { id: 'text', label: 'Text', icon: Type01, description: 'Paragraph text' },
  { id: 'heading1', label: 'Heading 1', icon: Heading01, description: 'Large heading', shortcut: '⌘⇧1' },
  { id: 'heading2', label: 'Heading 2', icon: Heading02, description: 'Medium heading', shortcut: '⌘⇧2' },
  { id: 'heading3', label: 'Heading 3', icon: Heading02, description: 'Small heading', shortcut: '⌘⇧3' },
  { id: 'bulletList', label: 'Bullet List', icon: List, description: 'Unordered list', shortcut: '⌘⇧8' },
  { id: 'numberedList', label: 'Numbered List', icon: Hash01, description: 'Ordered list', shortcut: '⌘⇧9' },
  { id: 'quote', label: 'Quote', icon: MessageSquare01, description: 'Blockquote' },
  { id: 'codeBlock', label: 'Code Block', icon: CodeSnippet02, description: 'Syntax highlighted code' },
  { id: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal rule' },
];

/**
 * Media and content blocks
 */
const MEDIA_BLOCKS: BlockType[] = [
  { id: 'image', label: 'Image', icon: Image01, description: 'Insert image from URL' },
  { id: 'video', label: 'Video', icon: PlayCircle, description: 'YouTube or self-hosted video' },
];


/**
 * Help Center specific blocks for component parity
 */
const HC_BLOCKS: BlockType[] = [
  { id: 'stepByStep', label: 'Step-by-Step', icon: CheckSquare, description: 'Numbered step guide' },
  { id: 'featureGrid2', label: 'Feature Grid (2)', icon: Grid01, description: '2-column feature cards' },
  { id: 'featureGrid3', label: 'Feature Grid (3)', icon: Grid01, description: '3-column feature cards' },
  { id: 'featureCard', label: 'Feature Card', icon: LayoutAlt02, description: 'Single feature highlight' },
  { id: 'relatedArticles', label: 'Related Articles', icon: Link01, description: 'Links to other articles' },
  { id: 'articleLink', label: 'Article Link', icon: BookOpen01, description: 'Inline link to article' },
];

/**
 * Callout blocks for highlighting content
 */
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

interface BlockButtonProps {
  block: BlockType;
  onClick: () => void;
  compact?: boolean;
}

function BlockButton({ block, onClick, compact }: BlockButtonProps) {
  const content = (
    <button
      onClick={onClick}
      disabled={block.disabled}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 rounded-md text-left',
        'text-sm text-foreground hover:bg-accent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        compact ? 'py-1.5' : 'py-2'
      )}
    >
      <block.icon size={16} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{block.label}</span>
      {block.future && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground">
          Soon
        </Badge>
      )}
      {block.shortcut && !block.future && (
        <span className="text-2xs text-muted-foreground/60">{block.shortcut}</span>
      )}
    </button>
  );

  if (!block.description) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {block.description}
        {block.future && <span className="text-muted-foreground ml-1">(Coming soon)</span>}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Right sidebar panel for inserting content blocks.
 * Wired to TipTap editor via onInsert callback.
 */
export function EditorInsertPanel({ onInsert, onInsertTable }: EditorInsertPanelProps) {
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
          <h3 className="text-2xs font-medium text-muted-foreground/50 px-2.5 py-1 uppercase tracking-wider">
            Basic
          </h3>
          {BASIC_BLOCKS.map((block) => (
            <BlockButton
              key={block.id}
              block={block}
              onClick={() => onInsert(block.id)}
            />
          ))}
        </div>
        
        {/* Media Blocks */}
        <div className="p-2 space-y-0.5 border-t border-border">
          <h3 className="text-2xs font-medium text-muted-foreground/50 px-2.5 py-1 uppercase tracking-wider">
            Media
          </h3>
          {MEDIA_BLOCKS.map((block) => (
            <BlockButton
              key={block.id}
              block={block}
              onClick={() => onInsert(block.id)}
              compact
            />
          ))}
        </div>
        
        
        {/* Help Center Blocks Section */}
        <div className="p-2 space-y-0.5 border-t border-border">
          <h3 className="text-2xs font-medium text-muted-foreground/50 px-2.5 py-1 uppercase tracking-wider">
            Help Center
          </h3>
          {HC_BLOCKS.map((block) => (
            <BlockButton
              key={block.id}
              block={block}
              onClick={() => onInsert(block.id)}
              compact
            />
          ))}
        </div>
        
        {/* Callouts Section */}
        <div className="p-3 pt-2 border-t border-border">
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
            Callouts
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {CALLOUT_TYPES.map((callout) => (
              <Tooltip key={callout.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onInsert(callout.id)}
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
