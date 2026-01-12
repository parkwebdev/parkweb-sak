/**
 * ArticlesTable Component
 * 
 * Data table for displaying and managing help articles.
 * 
 * @module components/admin/knowledge/ArticlesTable
 */

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit02, Trash01, Plus, Eye } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import type { AdminArticle, AdminCategory } from '@/types/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ArticlesTableProps {
  articles: AdminArticle[];
  categories: AdminCategory[];
  loading: boolean;
  onEdit: (article: AdminArticle) => void;
  onDelete: (articleId: string) => void;
  onCreate: (article: Partial<AdminArticle>) => void;
}

const columnHelper = createColumnHelper<AdminArticle>();

/**
 * Table component for displaying help articles.
 */
export function ArticlesTable({
  articles,
  categories,
  loading,
  onEdit,
  onDelete,
  onCreate,
}: ArticlesTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<AdminArticle | null>(null);
  const [newArticle, setNewArticle] = useState<Partial<AdminArticle>>({
    title: '',
    content: '',
    category_id: '',
  });

  const handleDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleCreate = () => {
    if (newArticle.title && newArticle.category_id) {
      onCreate(newArticle);
      setNewArticle({ title: '', content: '', category_id: '' });
      setCreateDialogOpen(false);
    }
  };

  const columns = useMemo<ColumnDef<AdminArticle, unknown>[]>(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('category_name', {
        header: 'Category',
        cell: ({ getValue }) => (
          <Badge variant="outline">{getValue()}</Badge>
        ),
      }),
      columnHelper.accessor('agent_name', {
        header: 'Agent',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() || 'Global'}
          </span>
        ),
      }),
      columnHelper.accessor('updated_at', {
        header: 'Updated',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(getValue()), { addSuffix: true })}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewArticle(row.original);
              }}
            >
              <Eye size={14} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
            >
              <Edit02 size={14} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(row.original.id);
              }}
            >
              <Trash01 size={14} className="text-destructive" aria-hidden="true" />
            </Button>
          </div>
        ),
      }),
    ],
    [onEdit]
  );

  const table = useReactTable({
    data: articles,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Help Articles</h3>
          <p className="text-xs text-muted-foreground">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus size={14} className="mr-1" aria-hidden="true" />
          New Article
        </Button>
      </div>

      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage="No articles found"
      />

      {/* Create Article Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Article</DialogTitle>
            <DialogDescription>
              Add a new help article to the knowledge base
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                placeholder="Enter article title"
                value={newArticle.title || ''}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-category">Category</Label>
              <Select
                value={newArticle.category_id || ''}
                onValueChange={(value) => setNewArticle({ ...newArticle, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-content">Content</Label>
              <Textarea
                id="article-content"
                placeholder="Enter article content (Markdown supported)"
                value={newArticle.content || ''}
                onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newArticle.title || !newArticle.category_id}>
              Create Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Preview Sheet */}
      <Sheet open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{previewArticle?.title}</SheetTitle>
            <SheetDescription>
              {previewArticle?.category_name}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">
              {previewArticle?.content}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Article editor component (placeholder).
 */
export function ArticleEditor() {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">WYSIWYG editor coming soon</p>
    </div>
  );
}

/**
 * Category manager component.
 */
export function CategoryManager({
  categories,
  loading,
  onCreate,
  onDelete,
}: {
  categories: AdminCategory[];
  loading: boolean;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}) {
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
        <Button size="sm" onClick={handleCreate} disabled={!newCategoryName}>
          <Plus size={14} aria-hidden="true" />
        </Button>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(cat.id)}
                disabled={cat.article_count > 0}
              >
                <Trash01 size={14} className="text-destructive" aria-hidden="true" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Category editor dialog component (placeholder).
 */
export function CategoryEditorDialog() {
  return null;
}

/**
 * Article preview component.
 */
export function ArticlePreview({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}
