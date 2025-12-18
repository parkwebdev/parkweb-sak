/**
 * Help Articles Table Columns
 * 
 * Column definitions for the help articles data table.
 * Follows the same patterns as knowledge-columns.tsx for consistency.
 */

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Trash01, Edit05, CheckCircle, Clock, ChevronUp, ChevronDown,
  BookOpen01, HelpCircle, User01, CreditCard01, Settings01,
  Mail01, Phone01, Shield01, Rocket01, Star01, Tool01,
  Lightbulb01, File06, Home01, ShoppingBag01, Calendar,
  Globe01, DownloadCloud01, Link01, PlayCircle, Gift01,
  Truck01, MessageChatCircle, Building07
} from '@untitledui/icons';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

// Base types from database
type HelpArticle = Tables<'help_articles'>;
type HelpCategory = Tables<'help_categories'>;

/**
 * Extended help article type with category information joined.
 */
export interface HelpArticleWithMeta extends HelpArticle {
  /** Category name for display */
  categoryName: string;
  /** Category icon key */
  categoryIcon: string | null;
  /** Full category object for reference */
  category?: HelpCategory;
}

/**
 * Props for creating help articles columns
 */
export interface HelpArticlesColumnsProps {
  /** Handler when row is clicked to view/edit details */
  onView: (article: HelpArticleWithMeta) => void;
  /** Handler for deleting an article */
  onDelete: (article: HelpArticleWithMeta) => void;
  /** Handler for moving article up in order */
  onMoveUp: (article: HelpArticleWithMeta) => void;
  /** Handler for moving article down in order */
  onMoveDown: (article: HelpArticleWithMeta) => void;
  /** Check if article can move up (not first in category) */
  canMoveUp: (article: HelpArticleWithMeta) => boolean;
  /** Check if article can move down (not last in category) */
  canMoveDown: (article: HelpArticleWithMeta) => boolean;
}

/**
 * Category icon mapping - synced with widget/category-icons.tsx
 */
const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  book: BookOpen01,
  help: HelpCircle,
  user: User01,
  billing: CreditCard01,
  settings: Settings01,
  email: Mail01,
  phone: Phone01,
  security: Shield01,
  rocket: Rocket01,
  star: Star01,
  tools: Tool01,
  idea: Lightbulb01,
  docs: File06,
  home: Home01,
  shop: ShoppingBag01,
  calendar: Calendar,
  globe: Globe01,
  download: DownloadCloud01,
  link: Link01,
  video: PlayCircle,
  gift: Gift01,
  shipping: Truck01,
  clock: Clock,
  chat: MessageChatCircle,
  company: Building07,
};

/**
 * Get the icon component for a category
 */
const getCategoryIcon = (iconKey: string | null): React.ComponentType<{ className?: string }> => {
  if (!iconKey) return BookOpen01;
  return categoryIconMap[iconKey] || BookOpen01;
};

/**
 * Strip HTML tags and get plain text preview
 */
const getContentPreview = (htmlContent: string, maxLength: number = 80): string => {
  // Remove HTML tags
  const text = htmlContent.replace(/<[^>]*>/g, '').trim();
  // Decode HTML entities
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  // Truncate
  if (decoded.length <= maxLength) return decoded;
  return decoded.substring(0, maxLength).trim() + '...';
};

/**
 * Create help articles table columns
 */
export const createHelpArticlesColumns = ({
  onView,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: HelpArticlesColumnsProps): ColumnDef<HelpArticleWithMeta>[] => [
  // Checkbox column for row selection
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${row.original.title}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  
  // Article column with thumbnail, title, and content preview
  {
    id: 'article',
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Article" />
    ),
    cell: ({ row }) => {
      const article = row.original;
      const preview = getContentPreview(article.content);
      
      return (
        <div className="flex items-center gap-3 min-w-0 py-1">
          {/* Thumbnail */}
          {article.featured_image ? (
            <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-muted">
              <img 
                src={article.featured_image} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-md shrink-0 bg-accent flex items-center justify-center">
              <File06 className="h-4 w-4 text-accent-foreground" />
            </div>
          )}
          
          {/* Title and preview */}
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{article.title}</p>
            <p className="text-sm text-muted-foreground truncate">{preview || 'No content'}</p>
          </div>
        </div>
      );
    },
  },
  
  // Category badge with icon
  {
    id: 'category',
    header: () => <span>Category</span>,
    cell: ({ row }) => {
      const article = row.original;
      const CategoryIcon = getCategoryIcon(article.categoryIcon);
      
      return (
        <Badge variant="outline" className="text-xs gap-1.5 whitespace-nowrap">
          <CategoryIcon className="h-3 w-3" />
          {article.categoryName}
        </Badge>
      );
    },
    enableSorting: false,
  },
  
  // Embedding status
  {
    id: 'status',
    header: () => <span>Status</span>,
    cell: ({ row }) => {
      const hasEmbedding = !!row.original.embedding;
      
      return (
        <Badge 
          variant={hasEmbedding ? 'default' : 'secondary'} 
          className="text-xs gap-1"
        >
          {hasEmbedding ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Ready
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              Pending
            </>
          )}
        </Badge>
      );
    },
    enableSorting: false,
  },
  
  // Date added
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Added" />
    ),
    cell: ({ row }) => {
      const date = row.original.created_at;
      if (!date) return <span className="text-muted-foreground">-</span>;
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </span>
      );
    },
  },
  
  // Actions column with reorder arrows, edit, and delete
  {
    id: 'actions',
    header: () => <span>Actions</span>,
    cell: ({ row }) => {
      const article = row.original;
      const canUp = canMoveUp(article);
      const canDown = canMoveDown(article);
      
      return (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          {/* Reorder buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveUp(article)}
                disabled={!canUp}
                className="h-8 w-8 p-0"
                aria-label="Move up"
              >
                <ChevronUp className={`h-4 w-4 ${canUp ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Move up</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveDown(article)}
                disabled={!canDown}
                className="h-8 w-8 p-0"
                aria-label="Move down"
              >
                <ChevronDown className={`h-4 w-4 ${canDown ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Move down</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Edit button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(article)}
                className="h-8 w-8 p-0"
                aria-label="Edit article"
              >
                <Edit05 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Delete button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(article)}
                className="h-8 w-8 p-0"
                aria-label="Delete article"
              >
                <Trash01 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];
