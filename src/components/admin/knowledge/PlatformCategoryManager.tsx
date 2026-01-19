/**
 * PlatformCategoryManager Component
 * 
 * Component for managing platform KB categories.
 * 
 * @module components/admin/knowledge/PlatformCategoryManager
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/icon-button';
import { Plus, Trash01, Edit02 } from '@untitledui/icons';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HC_COLOR_OPTIONS } from '@/lib/hc-category-colors';
import type { PlatformHCCategory, PlatformHCCategoryInput } from '@/types/platform-hc';

interface PlatformCategoryManagerProps {
  categories: PlatformHCCategory[];
  loading: boolean;
  onCreate: (category: PlatformHCCategoryInput) => void;
  onDelete: (id: string) => void;
}

const ICON_OPTIONS = [
  'Flag01', 'Bot', 'MessageSquare01', 'Users01', 'Calendar', 
  'BarChart01', 'Settings01', 'BookOpen01', 'HelpCircle', 'Lightbulb01',
];

/**
 * Category manager component for platform KB.
 */
export function PlatformCategoryManager({
  categories,
  loading,
  onCreate,
  onDelete,
}: PlatformCategoryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<PlatformHCCategoryInput>({
    id: '',
    label: '',
    color: 'bg-info',
    icon_name: 'Flag01',
    order_index: categories.length,
  });

  const handleCreate = () => {
    if (newCategory.id && newCategory.label) {
      onCreate(newCategory);
      setNewCategory({
        id: '',
        label: '',
        color: 'bg-info',
        icon_name: 'Flag01',
        order_index: categories.length + 1,
      });
      setDialogOpen(false);
    }
  };

  // Auto-generate ID from label
  const handleLabelChange = (label: string) => {
    const id = label
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    setNewCategory({ ...newCategory, label, id });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Categories</h4>
        <IconButton
          label="Add category"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
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
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                <div>
                  <p className="text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat.article_count} article{cat.article_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <IconButton
                label="Delete category"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(cat.id)}
                disabled={(cat.article_count ?? 0) > 0}
              >
                <Trash01 size={14} className="text-destructive" />
              </IconButton>
            </div>
          ))
        )}
      </div>

      {/* Create Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
            <DialogDescription>
              Create a new help center category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-label">Label</Label>
              <Input
                id="category-label"
                placeholder="Category name"
                value={newCategory.label}
                onChange={(e) => handleLabelChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-id">ID (URL slug)</Label>
              <Input
                id="category-id"
                placeholder="category-slug"
                value={newCategory.id}
                onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-color">Color</Label>
              <Select
                value={newCategory.color}
                onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
              >
                <SelectTrigger id="category-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HC_COLOR_OPTIONS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.value}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-icon">Icon</Label>
              <Select
                value={newCategory.icon_name}
                onValueChange={(value) => setNewCategory({ ...newCategory, icon_name: value })}
              >
                <SelectTrigger id="category-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-order">Order Index</Label>
              <Input
                id="category-order"
                type="number"
                min={0}
                value={newCategory.order_index}
                onChange={(e) => setNewCategory({ ...newCategory, order_index: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newCategory.id || !newCategory.label}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
