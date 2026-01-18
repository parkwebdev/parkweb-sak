/**
 * PlatformArticlesTable Component
 * 
 * Data table for displaying and managing platform help articles.
 * 
 * @module components/admin/knowledge/PlatformArticlesTable
 */

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { Edit02, Trash01, Eye } from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
import { formatDistanceToNow } from 'date-fns';
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
import DOMPurify from 'isomorphic-dompurify';
import type { PlatformHCArticle } from '@/types/platform-hc';

interface PlatformArticlesTableProps {
  articles: PlatformHCArticle[];
  loading: boolean;
  onEdit: (article: PlatformHCArticle) => void;
  onDelete: (articleId: string) => void;
}

const columnHelper = createColumnHelper<PlatformHCArticle>();

/**
 * Table component for displaying platform help articles.
 */
export function PlatformArticlesTable({
  articles,
  loading,
  onEdit,
  onDelete,
}: PlatformArticlesTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewArticle, setPreviewArticle] = useState<PlatformHCArticle | null>(null);

  const handleDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const columns = useMemo<ColumnDef<PlatformHCArticle, string | number | boolean | null>[]>(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: ({ getValue, row }) => (
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{getValue()}</span>
            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
              {row.original.description}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('category_label', {
        header: 'Category',
        cell: ({ getValue, row }) => {
          const color = row.original.category_color || 'bg-muted';
          return (
            <Badge variant="outline" className="gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} aria-hidden="true" />
              {getValue()}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('is_published', {
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge 
            variant="outline"
            className={getValue() ? 'bg-status-active/10 text-status-active-foreground border-status-active/20' : ''}
          >
            {getValue() ? 'Published' : 'Draft'}
          </Badge>
        ),
      }),
      columnHelper.accessor('order_index', {
        header: 'Order',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
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
            <IconButton
              label="Preview article"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewArticle(row.original);
              }}
            >
              <Eye size={14} />
            </IconButton>
            <IconButton
              label="Edit article"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
            >
              <Edit02 size={14} />
            </IconButton>
            <IconButton
              label="Delete article"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(row.original.id);
              }}
            >
              <Trash01 size={14} className="text-destructive" />
            </IconButton>
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
      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage="No articles yet. Create your first article to get started."
      />

      {/* Article Preview Sheet */}
      <Sheet open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{previewArticle?.title}</SheetTitle>
            <SheetDescription>
              {previewArticle?.category_label} • {previewArticle?.is_published ? 'Published' : 'Draft'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 article-content prose prose-sm dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(previewArticle?.content || ''),
              }}
            />
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
