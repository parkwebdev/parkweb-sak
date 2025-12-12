/**
 * DroppableCategoryCard Component
 * 
 * Category card that accepts drag-and-drop articles.
 * Displays category header, description, and sortable article list.
 * WCAG 2.2 compliant with keyboard alternatives for drag-and-drop (2.5.7).
 * @module components/agents/DroppableCategoryCard
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SortableArticleItem } from './SortableArticleItem';
import { ChevronDown, Edit05, Trash01, Plus } from '@untitledui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { HelpArticle, HelpCategory } from '@/hooks/useEmbeddedChatConfig';

interface DroppableCategoryCardProps {
  category: HelpCategory;
  articles: HelpArticle[];
  onEdit: (articleId: string) => void;
  onDelete: (articleId: string) => void;
  onEditCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onAddArticle: (categoryName: string) => void;
  isOver?: boolean;
  /** WCAG 2.5.7: Keyboard alternative to reorder articles */
  onReorderArticle?: (articleId: string, direction: 'up' | 'down') => void;
}

export const DroppableCategoryCard = ({
  category,
  articles,
  onEdit,
  onDelete,
  onEditCategory,
  onDeleteCategory,
  onAddArticle,
  isOver,
  onReorderArticle,
}: DroppableCategoryCardProps) => {
  const { setNodeRef } = useDroppable({
    id: `category-${category.name}`,
    data: { type: 'category', categoryName: category.name },
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        isOver ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      role="region"
      aria-label={`Category: ${category.name} with ${articles.length} articles`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{category.name}</h3>
            <span 
              className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
              aria-label={`${articles.length} articles`}
            >
              {articles.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddArticle(category.name)}
              className="h-8 w-8 p-0"
              aria-label={`Add article to ${category.name}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-2"
                  aria-label={`${category.name} options`}
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditCategory(category.name)}>
                  <Edit05 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteCategory(category.name)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash01 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Delete Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {category.description && (
          <p className="text-xs text-muted-foreground mb-3">{category.description}</p>
        )}
        
        <SortableContext
          items={articles.map(a => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {articles.length === 0 ? (
            <div 
              className="border-2 border-dashed rounded-lg py-6 text-center text-sm text-muted-foreground"
              role="status"
            >
              Drag articles here or click + to add
            </div>
          ) : (
            <div className="space-y-2" role="list" aria-label={`Articles in ${category.name}`}>
              {articles.map((article, index) => (
                <SortableArticleItem
                  key={article.id}
                  article={article}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMoveUp={onReorderArticle ? (id) => onReorderArticle(id, 'up') : undefined}
                  onMoveDown={onReorderArticle ? (id) => onReorderArticle(id, 'down') : undefined}
                  isFirst={index === 0}
                  isLast={index === articles.length - 1}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
};
