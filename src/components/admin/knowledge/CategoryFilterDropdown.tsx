/**
 * @fileoverview Category Filter Dropdown Component
 * 
 * A dropdown selector for filtering help articles by category.
 * Displays color-coded dots matching the category colors.
 * Includes an "Add Category" option at the bottom.
 * 
 * @module components/admin/knowledge/CategoryFilterDropdown
 */

import { ChevronDown, Plus } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PlatformHCCategory } from '@/types/platform-hc';

interface CategoryFilterDropdownProps {
  /** Available categories */
  categories: PlatformHCCategory[];
  /** Currently selected category ID (null for all) */
  activeCategory: string | null;
  /** Callback when category selection changes */
  onCategoryChange: (categoryId: string | null) => void;
  /** Callback when "Add Category" is clicked */
  onAddCategory: () => void;
}

/**
 * Dropdown for filtering help articles by category.
 * Shows color-coded dots for each category option.
 */
export function CategoryFilterDropdown({
  categories,
  activeCategory,
  onCategoryChange,
  onAddCategory,
}: CategoryFilterDropdownProps) {
  const activeOption = activeCategory
    ? categories.find(c => c.id === activeCategory)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {activeOption?.color && (
            <span 
              className={`w-2 h-2 rounded-full ${activeOption.color}`}
              aria-hidden="true"
            />
          )}
          {activeOption?.label || 'All Categories'}
          <ChevronDown size={14} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={4} className="min-w-[160px]">
        <DropdownMenuItem
          onClick={() => onCategoryChange(null)}
          className={`gap-2 ${!activeCategory ? 'bg-accent' : ''}`}
        >
          <span className="w-2 h-2" aria-hidden="true" />
          All Categories
        </DropdownMenuItem>
        
        {categories.map(category => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`gap-2 ${category.id === activeCategory ? 'bg-accent' : ''}`}
          >
            <span 
              className={`w-2 h-2 rounded-full ${category.color}`}
              aria-hidden="true"
            />
            {category.label}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onAddCategory} className="gap-2">
          <Plus size={14} aria-hidden="true" />
          Add Category
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
