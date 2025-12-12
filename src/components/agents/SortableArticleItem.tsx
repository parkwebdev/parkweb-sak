/**
 * SortableArticleItem Component
 * 
 * Draggable article item for reordering within categories.
 * Displays thumbnail, title, content preview, and embedding status.
 * WCAG 2.2 compliant with keyboard alternatives for drag-and-drop (2.5.7).
 * @module components/agents/SortableArticleItem
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Edit05, Trash01, DotsGrid, Image01, CheckCircle, Clock, ChevronUp, ChevronDown } from '@untitledui/icons';
import type { HelpArticle } from '@/hooks/useEmbeddedChatConfig';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SortableArticleItemProps {
  article: HelpArticle;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** WCAG 2.5.7: Keyboard alternative to move article up */
  onMoveUp?: (id: string) => void;
  /** WCAG 2.5.7: Keyboard alternative to move article down */
  onMoveDown?: (id: string) => void;
  /** Whether this is the first item (disables move up) */
  isFirst?: boolean;
  /** Whether this is the last item (disables move down) */
  isLast?: boolean;
}

// Helper to strip HTML tags for preview text
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

export const SortableArticleItem = ({ 
  article, 
  onEdit, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}: SortableArticleItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
      role="listitem"
      aria-label={`Article: ${article.title}`}
    >
      {/* WCAG 2.5.7: Keyboard alternatives for drag-and-drop */}
      <div className="flex flex-col gap-0.5">
        {onMoveUp && (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={() => onMoveUp(article.id)}
            disabled={isFirst}
            aria-label={`Move ${article.title} up`}
          >
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
        {onMoveDown && (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={() => onMoveDown(article.id)}
            disabled={isLast}
            aria-label={`Move ${article.title} down`}
          >
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
      </div>
      
      {/* Drag handle - still available for mouse users */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        aria-label={`Drag to reorder ${article.title}`}
      >
        <DotsGrid className="h-4 w-4" aria-hidden="true" />
      </button>
      
      {article.featured_image ? (
        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted">
          <img 
            src={article.featured_image} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-md flex-shrink-0 bg-muted/50 flex items-center justify-center">
          <Image01 className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h5 className="font-medium text-sm">{article.title}</h5>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex" aria-label={article.has_embedding ? 'Embedded for RAG' : 'Pending embedding'}>
                {article.has_embedding ? (
                  <CheckCircle className="h-3.5 w-3.5 text-success flex-shrink-0" aria-hidden="true" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-warning flex-shrink-0" aria-hidden="true" />
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {article.has_embedding ? 'Embedded for RAG' : 'Pending embedding'}
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
          {stripHtml(article.content)}
        </p>
      </div>
      
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(article.id)}
          aria-label={`Edit ${article.title}`}
        >
          <Edit05 className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(article.id)}
          aria-label={`Delete ${article.title}`}
        >
          <Trash01 className="h-4 w-4 text-destructive" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
