import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Edit05, Trash01, DotsGrid } from '@untitledui/icons';
import type { HelpArticle } from '@/hooks/useEmbeddedChatConfig';

interface SortableArticleItemProps {
  article: HelpArticle;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SortableArticleItem = ({ article, onEdit, onDelete }: SortableArticleItemProps) => {
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
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Drag to reorder"
      >
        <DotsGrid className="h-4 w-4" />
      </button>
      
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-sm">{article.title}</h5>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {article.content}
        </p>
      </div>
      
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(article.id)}
        >
          <Edit05 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(article.id)}
        >
          <Trash01 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};
