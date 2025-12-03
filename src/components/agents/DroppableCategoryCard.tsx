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
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{category.name}</h4>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {articles.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddArticle(category.name)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 px-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditCategory(category.name)}>
                  <Edit05 className="h-4 w-4 mr-2" />
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteCategory(category.name)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash01 className="h-4 w-4 mr-2" />
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
            <div className="border-2 border-dashed rounded-lg py-6 text-center text-sm text-muted-foreground">
              Drag articles here or click + to add
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => (
                <SortableArticleItem
                  key={article.id}
                  article={article}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
};
