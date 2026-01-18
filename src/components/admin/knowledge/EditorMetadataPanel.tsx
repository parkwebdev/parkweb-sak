/**
 * Editor Metadata Panel
 * 
 * Collapsible bottom panel for article metadata.
 * 
 * @see docs/ARTICLE_EDITOR.md for implementation details
 * @module components/admin/knowledge/EditorMetadataPanel
 */

import { ChevronDown } from '@untitledui/icons';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PlatformHCCategory } from '@/types/platform-hc';

interface EditorMetadataPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  onSlugChange: (slug: string) => void;
  categoryId: string;
  onCategoryChange: (categoryId: string) => void;
  categories: PlatformHCCategory[];
  description: string;
  onDescriptionChange: (description: string) => void;
  orderIndex: number;
  onOrderIndexChange: (orderIndex: number) => void;
  iconName: string;
  onIconNameChange: (iconName: string) => void;
}

/**
 * Collapsible metadata panel at the bottom of the article editor.
 */
export function EditorMetadataPanel({
  isOpen,
  onOpenChange,
  slug,
  onSlugChange,
  categoryId,
  onCategoryChange,
  categories,
  description,
  onDescriptionChange,
  orderIndex,
  onOrderIndexChange,
  iconName,
  onIconNameChange,
}: EditorMetadataPanelProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className="border-t border-border bg-background"
    >
      <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
        <span className="text-sm font-medium">Article Settings</span>
        <ChevronDown
          size={16}
          className={cn(
            'text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="article-slug" className="text-xs text-muted-foreground">
              Slug
            </Label>
            <Input
              id="article-slug"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="article-slug"
              size="sm"
            />
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="article-category" className="text-xs text-muted-foreground">
              Category
            </Label>
            <Select value={categoryId} onValueChange={onCategoryChange}>
              <SelectTrigger id="article-category" size="sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn('w-2 h-2 rounded-full', category.color)}
                        aria-hidden="true"
                      />
                      {category.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Order Index */}
          <div className="space-y-2">
            <Label htmlFor="article-order" className="text-xs text-muted-foreground">
              Order
            </Label>
            <Input
              id="article-order"
              type="number"
              value={orderIndex}
              onChange={(e) => onOrderIndexChange(parseInt(e.target.value, 10) || 0)}
              min={0}
              size="sm"
            />
          </div>
          
          {/* Icon Name */}
          <div className="space-y-2">
            <Label htmlFor="article-icon" className="text-xs text-muted-foreground">
              Icon (optional)
            </Label>
            <Input
              id="article-icon"
              value={iconName}
              onChange={(e) => onIconNameChange(e.target.value)}
              placeholder="BookOpen01"
              size="sm"
            />
          </div>
          
          {/* Description - Full Width */}
          <div className="space-y-2 md:col-span-2 lg:col-span-4">
            <Label htmlFor="article-description" className="text-xs text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="article-description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Brief description of the article..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
