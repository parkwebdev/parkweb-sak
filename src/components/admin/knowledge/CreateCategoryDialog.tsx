/**
 * @fileoverview Create Category Dialog Component
 * 
 * Dialog for creating new help center categories.
 * Includes fields for label, ID (slug), color, icon, and order.
 * 
 * @module components/admin/knowledge/CreateCategoryDialog
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PlatformHCCategoryInput } from '@/types/platform-hc';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (category: PlatformHCCategoryInput) => void;
  categoriesCount: number;
}

const COLOR_OPTIONS = [
  { value: 'bg-info', label: 'Blue' },
  { value: 'bg-success', label: 'Green' },
  { value: 'bg-warning', label: 'Yellow' },
  { value: 'bg-destructive', label: 'Red' },
  { value: 'bg-accent-purple', label: 'Purple' },
  { value: 'bg-status-active', label: 'Teal' },
  { value: 'bg-muted-foreground', label: 'Gray' },
];

const ICON_OPTIONS = [
  'Flag01', 'Bot', 'MessageSquare01', 'Users01', 'Calendar', 
  'BarChart01', 'Settings01', 'BookOpen01', 'HelpCircle', 'Lightbulb01',
];

/**
 * Dialog for creating new platform help center categories.
 */
export function CreateCategoryDialog({
  open,
  onOpenChange,
  onCreate,
  categoriesCount,
}: CreateCategoryDialogProps) {
  const [newCategory, setNewCategory] = useState<PlatformHCCategoryInput>({
    id: '',
    label: '',
    color: 'bg-info',
    icon_name: 'Flag01',
    order_index: categoriesCount,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setNewCategory({
        id: '',
        label: '',
        color: 'bg-info',
        icon_name: 'Flag01',
        order_index: categoriesCount,
      });
    }
  }, [open, categoriesCount]);

  const handleCreate = () => {
    if (newCategory.id && newCategory.label) {
      onCreate(newCategory);
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                {COLOR_OPTIONS.map((color) => (
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!newCategory.id || !newCategory.label}>
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
