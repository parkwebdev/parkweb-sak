/**
 * CategoryManager Component
 * 
 * Component for managing help article categories.
 * 
 * @module components/admin/knowledge/CategoryManager
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/icon-button';
import { Plus, Trash01 } from '@untitledui/icons';
import type { AdminCategory } from '@/types/admin';

interface CategoryManagerProps {
  /** List of categories */
  categories: AdminCategory[];
  /** Loading state */
  loading: boolean;
  /** Callback when creating a category */
  onCreate: (name: string) => void;
  /** Callback when deleting a category */
  onDelete: (id: string) => void;
}

/**
 * Category manager component.
 */
export function CategoryManager({
  categories,
  loading,
  onCreate,
  onDelete,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreate = () => {
    if (newCategoryName) {
      onCreate(newCategoryName);
      setNewCategoryName('');
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h4 className="text-sm font-medium">Categories</h4>
      
      <div className="flex gap-2">
        <Input
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1"
        />
        <IconButton label="Add category" size="sm" onClick={handleCreate} disabled={!newCategoryName}>
          <Plus size={14} />
        </IconButton>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">No categories yet</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div>
                <p className="text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.article_count} article{cat.article_count !== 1 ? 's' : ''}
                </p>
              </div>
              <IconButton
                label="Delete category"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(cat.id)}
                disabled={cat.article_count > 0}
              >
                <Trash01 size={14} className="text-destructive" />
              </IconButton>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
