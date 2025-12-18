/**
 * HelpArticlesManager Component
 * 
 * Full management interface for help articles and categories.
 * Features DataTable with filtering, bulk actions, category management,
 * rich text editing, and RAG embedding functionality.
 * @module components/agents/HelpArticlesManager
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen01, XClose, Image01, Plus, FilterLines, SearchSm, Trash01, RefreshCcw01, ChevronDown, X 
} from '@untitledui/icons';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { toast } from '@/lib/toast';
import { uploadFeaturedImage } from '@/lib/article-image-upload';
import { CATEGORY_ICON_OPTIONS, CategoryIcon, type CategoryIconName } from '@/widget/category-icons';
import { BulkImportDialog } from './BulkImportDialog';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';
import { ArticleDetailsSheet } from './articles/ArticleDetailsSheet';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { 
  createHelpArticlesColumns, 
  type HelpArticleWithMeta 
} from '@/components/data-table/columns/help-articles-columns';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface HelpArticlesManagerProps {
  agentId: string;
  userId: string;
}

// Status labels for display
const STATUS_LABELS: Record<string, string> = {
  embedded: 'Embedded',
  pending: 'Not Embedded',
};

// Interface for active filters
interface ActiveFilter {
  type: 'category' | 'status';
  value: string;
  label: string;
}

export const HelpArticlesManager = ({ agentId, userId }: HelpArticlesManagerProps) => {
  const { 
    articles, 
    categories, 
    loading, 
    addArticle, 
    updateArticle, 
    deleteArticle, 
    addCategory, 
    updateCategory, 
    removeCategory, 
    reorderArticles, 
    bulkImport,
    embedAllArticles
  } = useHelpArticles(agentId);
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Filter state - multi-select arrays
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  
  // Delete confirmation state
  const [deleteArticle_, setDeleteArticle] = useState<HelpArticleWithMeta | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  
  // Edit state
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryName, setDeletingCategoryName] = useState('');
  
  // Sheet state
  const [selectedArticle, setSelectedArticle] = useState<HelpArticleWithMeta | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Embedding state
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState({ current: 0, total: 0 });
  
  // Form state for new article
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    featured_image: '',
  });
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false);
  
  // Category form state
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'book' as CategoryIconName,
  });
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'book' as CategoryIconName,
  });

  // Transform articles to include category metadata and sort by category then orderIndex
  const articlesWithMeta: HelpArticleWithMeta[] = useMemo(() => {
    return articles
      .map(article => {
        const category = categories.find(c => c.name === article.category);
        return {
          id: article.id,
          title: article.title,
          content: article.content,
          categoryId: category?.id || '',
          categoryName: article.category,
          categoryIcon: category?.icon || 'book',
          orderIndex: article.order,
          featuredImage: article.featured_image || null,
          hasEmbedding: article.has_embedding,
          createdAt: null,
          updatedAt: null,
        };
      })
      .sort((a, b) => {
        // Sort by category first, then by orderIndex within category
        if (a.categoryName !== b.categoryName) {
          return a.categoryName.localeCompare(b.categoryName);
        }
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      });
  }, [articles, categories]);

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    articlesWithMeta.forEach(a => {
      if (a.categoryName) cats.add(a.categoryName);
    });
    return Array.from(cats).sort();
  }, [articlesWithMeta]);

  // Filter articles with multi-select
  const filteredArticles = useMemo(() => {
    return articlesWithMeta.filter(article => {
      // Category filter (multi-select)
      if (categoryFilter.length > 0 && !categoryFilter.includes(article.categoryName)) {
        return false;
      }
      // Status filter (multi-select)
      if (statusFilter.length > 0) {
        const articleStatus = article.hasEmbedding ? 'embedded' : 'pending';
        if (!statusFilter.includes(articleStatus)) {
          return false;
        }
      }
      return true;
    });
  }, [articlesWithMeta, categoryFilter, statusFilter]);

  // Active filters for chips
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];
    categoryFilter.forEach(cat => {
      filters.push({
        type: 'category',
        value: cat,
        label: cat,
      });
    });
    statusFilter.forEach(status => {
      filters.push({
        type: 'status',
        value: status,
        label: STATUS_LABELS[status] || status,
      });
    });
    return filters;
  }, [categoryFilter, statusFilter]);

  // Clear individual filter
  const clearFilter = (type: ActiveFilter['type'], value: string) => {
    if (type === 'category') setCategoryFilter(prev => prev.filter(v => v !== value));
    if (type === 'status') setStatusFilter(prev => prev.filter(v => v !== value));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setCategoryFilter([]);
    setStatusFilter([]);
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredArticles.length) {
          setDisplayCount(prev => Math.min(prev + 20, filteredArticles.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [filteredArticles.length, displayCount]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [categoryFilter, statusFilter, globalFilter]);

  // Displayed articles with pagination
  const displayedArticles = useMemo(
    () => filteredArticles.slice(0, displayCount),
    [filteredArticles, displayCount]
  );

  // Get articles sorted by category and order for move operations
  const getArticlesByCategoryOrder = useCallback((categoryName: string) => {
    return articlesWithMeta
      .filter(a => a.categoryName === categoryName)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [articlesWithMeta]);

  // Move article handlers
  const handleMoveUp = useCallback(async (article: HelpArticleWithMeta) => {
    const categoryArticles = getArticlesByCategoryOrder(article.categoryName);
    const currentIndex = categoryArticles.findIndex(a => a.id === article.id);
    
    if (currentIndex <= 0) return;

    const newOrder = [...categoryArticles];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    
    const updatedArticles = articles.map(a => {
      const newIndex = newOrder.findIndex(n => n.id === a.id);
      if (newIndex !== -1 && a.category === article.categoryName) {
        return { ...a, order: newIndex };
      }
      return a;
    });

    try {
      await reorderArticles(updatedArticles);
    } catch (error) {
      toast.error('Failed to reorder article');
    }
  }, [articles, getArticlesByCategoryOrder, reorderArticles]);

  const handleMoveDown = useCallback(async (article: HelpArticleWithMeta) => {
    const categoryArticles = getArticlesByCategoryOrder(article.categoryName);
    const currentIndex = categoryArticles.findIndex(a => a.id === article.id);
    
    if (currentIndex >= categoryArticles.length - 1) return;

    const newOrder = [...categoryArticles];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    
    const updatedArticles = articles.map(a => {
      const newIndex = newOrder.findIndex(n => n.id === a.id);
      if (newIndex !== -1 && a.category === article.categoryName) {
        return { ...a, order: newIndex };
      }
      return a;
    });

    try {
      await reorderArticles(updatedArticles);
    } catch (error) {
      toast.error('Failed to reorder article');
    }
  }, [articles, getArticlesByCategoryOrder, reorderArticles]);

  // Check if article can move
  const canMoveUp = useCallback((article: HelpArticleWithMeta) => {
    const categoryArticles = getArticlesByCategoryOrder(article.categoryName);
    const currentIndex = categoryArticles.findIndex(a => a.id === article.id);
    return currentIndex > 0;
  }, [getArticlesByCategoryOrder]);

  const canMoveDown = useCallback((article: HelpArticleWithMeta) => {
    const categoryArticles = getArticlesByCategoryOrder(article.categoryName);
    const currentIndex = categoryArticles.findIndex(a => a.id === article.id);
    return currentIndex < categoryArticles.length - 1;
  }, [getArticlesByCategoryOrder]);

  // Set article for delete confirmation
  const handleSetDeleteArticle = useCallback((article: HelpArticleWithMeta) => {
    setDeleteArticle(article);
  }, []);

  // Delete confirmation handler
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteArticle_) return;
    
    try {
      await deleteArticle(deleteArticle_.id);
      toast.success('Article deleted');
      // Close sheet if viewing deleted article
      if (selectedArticle?.id === deleteArticle_.id) {
        setSheetOpen(false);
        setSelectedArticle(null);
      }
      setDeleteArticle(null);
    } catch (error) {
      toast.error('Failed to delete article');
    }
  }, [deleteArticle, deleteArticle_, selectedArticle]);

  // View handler
  const handleView = useCallback((article: HelpArticleWithMeta) => {
    setSelectedArticle(article);
    setSheetOpen(true);
  }, []);

  // Column definitions
  const columns = useMemo(() => createHelpArticlesColumns({
    onView: handleView,
    onDelete: handleSetDeleteArticle,
    onMoveUp: handleMoveUp,
    onMoveDown: handleMoveDown,
    canMoveUp,
    canMoveDown,
  }), [handleView, handleSetDeleteArticle, handleMoveUp, handleMoveDown, canMoveUp, canMoveDown]);

  // Table instance with displayed (paginated) articles
  const table = useReactTable({
    data: displayedArticles,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).length;

  // Clear selection
  const clearSelection = () => {
    setRowSelection({});
  };

  // Bulk delete handler - opens confirmation dialog
  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    setBulkDeletePending(true);
  };

  // Bulk delete confirmation handler
  const handleBulkDeleteConfirm = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const count = selectedRows.length;
    
    try {
      await Promise.all(selectedRows.map(row => deleteArticle(row.original.id)));
      toast.success(`Deleted ${count} article${count > 1 ? 's' : ''}`);
      setRowSelection({});
    } catch (error) {
      toast.error('Failed to delete some articles');
    } finally {
      setBulkDeletePending(false);
    }
  };

  // Add article submit
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addArticle(formData);
      toast.success('Article added');
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save article');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: '', featured_image: '' });
  };

  // Category handlers
  const handleAddCategory = async () => {
    if (!newCategoryForm.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    try {
      await addCategory(newCategoryForm.name, newCategoryForm.description, newCategoryForm.icon);
      toast.success('Category added');
      setNewCategoryForm({ name: '', description: '', icon: 'book' });
      setNewCategoryDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleEditCategory = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      setEditingCategoryName(categoryName);
      setEditCategoryForm({ 
        name: category.name, 
        description: category.description,
        icon: (category.icon as CategoryIconName) || 'book'
      });
      setEditCategoryDialogOpen(true);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryForm.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    try {
      await updateCategory(editingCategoryName, editCategoryForm.name, editCategoryForm.description, editCategoryForm.icon);
      toast.success('Category updated');
      setEditCategoryDialogOpen(false);
      setEditingCategoryName('');
      setEditCategoryForm({ name: '', description: '', icon: 'book' });
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategoryClick = (categoryName: string) => {
    setDeletingCategoryName(categoryName);
    setDeleteCategoryDialogOpen(true);
  };

  const handleDeleteCategoryConfirm = async (action: 'move' | 'delete', targetCategory?: string) => {
    try {
      if (action === 'move' && targetCategory) {
        await removeCategory(deletingCategoryName, { moveArticlesTo: targetCategory });
        toast.success('Articles moved and category deleted');
      } else {
        await removeCategory(deletingCategoryName, { deleteArticles: true });
        toast.success('Category and articles deleted');
      }
      setDeleteCategoryDialogOpen(false);
      setDeletingCategoryName('');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  // Featured image upload
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setFeaturedImageUploading(true);
      const imageUrl = await uploadFeaturedImage(file, userId, agentId);
      setFormData({ ...formData, featured_image: imageUrl });
      toast.success('Featured image uploaded');
    } catch (error) {
      logger.error('Featured image upload error:', error);
      toast.error('Failed to upload featured image');
    } finally {
      setFeaturedImageUploading(false);
    }
  };

  // Embed all handler
  const handleEmbedAll = async () => {
    setIsEmbedding(true);
    const unembedded = articles.filter(a => !a.has_embedding);
    setEmbeddingProgress({ current: 0, total: unembedded.length });
    try {
      const count = await embedAllArticles((current, total) => {
        setEmbeddingProgress({ current, total });
      });
      toast.success(`Embedded ${count} articles for RAG`);
    } catch (error) {
      toast.error('Failed to embed articles');
    } finally {
      setIsEmbedding(false);
      setEmbeddingProgress({ current: 0, total: 0 });
    }
  };

  // Save from sheet
  const handleSaveArticle = async (id: string, data: { title: string; content: string; category_id: string; featured_image: string | null }) => {
    const category = categories.find(c => c.id === data.category_id);
    await updateArticle(id, {
      title: data.title,
      content: data.content,
      category: category?.name || '',
      featured_image: data.featured_image || undefined,
    });
    // Update selected article with camelCase properties
    setSelectedArticle(prev => prev ? {
      ...prev,
      title: data.title,
      content: data.content,
      categoryId: data.category_id,
      categoryName: category?.name || '',
      featuredImage: data.featured_image,
    } : null);
  };

  // Re-embed article
  const handleReembedArticle = async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    
    try {
      const { error } = await supabase.functions.invoke('embed-help-article', {
        body: { articleId: id, title: article.title, content: article.content },
      });
      if (error) throw error;
      toast.success('Article re-embedded successfully');
    } catch (err) {
      console.error('Re-embed failed:', err);
      toast.error('Failed to re-embed article');
    }
  };

  // Handle delete from sheet
  const handleDeleteFromSheet = (id: string) => {
    const articleToDelete = articlesWithMeta.find(a => a.id === id);
    if (articleToDelete) {
      setDeleteArticle(articleToDelete);
    }
    setSheetOpen(false);
  };

  const deletingCategoryArticleCount = articles.filter(a => a.category === deletingCategoryName).length;
  const otherCategories = categories.filter(c => c.name !== deletingCategoryName);

  if (loading) {
    return <LoadingState size="md" text="Loading help articles..." />;
  }

  // Filter Popover component
  const FilterPopover = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <FilterLines size={16} />
          Filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeFilters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          {/* Category Filter */}
          {uniqueCategories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase">Category</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uniqueCategories.map(cat => (
                  <div key={cat} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${cat}`}
                      checked={categoryFilter.includes(cat)}
                      onCheckedChange={(checked) => {
                        setCategoryFilter(prev => 
                          checked 
                            ? [...prev, cat]
                            : prev.filter(c => c !== cat)
                        );
                      }}
                    />
                    <Label htmlFor={`cat-${cat}`} className="text-sm font-normal cursor-pointer flex items-center gap-2">
                      <CategoryIcon name={(categories.find(c => c.name === cat)?.icon as CategoryIconName) || 'book'} className="h-4 w-4" />
                      {cat}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uniqueCategories.length > 0 && <Separator />}

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase">Status</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-embedded"
                  checked={statusFilter.includes('embedded')}
                  onCheckedChange={(checked) => {
                    setStatusFilter(prev => 
                      checked 
                        ? [...prev, 'embedded']
                        : prev.filter(s => s !== 'embedded')
                    );
                  }}
                />
                <Label htmlFor="status-embedded" className="text-sm font-normal cursor-pointer">
                  Embedded
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-pending"
                  checked={statusFilter.includes('pending')}
                  onCheckedChange={(checked) => {
                    setStatusFilter(prev => 
                      checked 
                        ? [...prev, 'pending']
                        : prev.filter(s => s !== 'pending')
                    );
                  }}
                />
                <Label htmlFor="status-pending" className="text-sm font-normal cursor-pointer">
                  Not Embedded
                </Label>
              </div>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-4">
      {/* Empty State */}
      {articles.length === 0 && categories.length === 0 ? (
        <EmptyState
          icon={<BookOpen01 className="h-5 w-5 text-muted-foreground/50" />}
          title="No help articles yet"
          description="Create help articles to display in your chat widget's help tab"
          action={
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Article
            </Button>
          }
        />
      ) : (
        <>
          {/* Bulk selection action bar */}
          {selectedCount > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
              <span className="text-sm text-muted-foreground">
                {selectedCount} article{selectedCount > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-8 gap-1.5"
                >
                  <XClose className="h-4 w-4" />
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="h-8 gap-1.5"
                >
                  <Trash01 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <DataTableToolbar
                table={table}
                searchPlaceholder="Search articles..."
                globalFilter
                searchClassName="max-w-xs"
              />
              {FilterPopover}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Embed All */}
              {articles.some(a => !a.has_embedding) && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleEmbedAll}
                  disabled={isEmbedding}
                >
                  <RefreshCcw01 className={`h-4 w-4 mr-1 ${isEmbedding ? 'animate-spin' : ''}`} />
                  {isEmbedding 
                    ? `Embedding ${embeddingProgress.current}/${embeddingProgress.total}...` 
                    : `Embed All (${articles.filter(a => !a.has_embedding).length})`
                  }
                </Button>
              )}
              
              <Button size="sm" variant="outline" onClick={() => setBulkImportOpen(true)}>
                Import CSV
              </Button>

              {/* Category Management */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    Categories
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Manage Categories</Label>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-2"
                        onClick={() => setNewCategoryDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No categories yet</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {categories.map(cat => (
                          <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-accent group">
                            <div className="flex items-center gap-2">
                              <CategoryIcon name={(cat.icon as CategoryIconName) || 'book'} className="h-4 w-4" />
                              <span className="text-sm">{cat.name}</span>
                              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                {articles.filter(a => a.category === cat.name).length}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleEditCategory(cat.name)}
                              >
                                <span className="text-xs">Edit</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCategoryClick(cat.name)}
                              >
                                <Trash01 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Add Article */}
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    Add Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Add Help Article</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="How to get started"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Content *</Label>
                      <RichTextEditor
                        content={formData.content}
                        onChange={(html) => setFormData({ ...formData, content: html })}
                        placeholder="Write your help article content here..."
                        agentId={agentId}
                        userId={userId}
                        minHeight="250px"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.name} value={cat.name}>
                                <div className="flex items-center gap-2">
                                  <CategoryIcon name={(cat.icon as CategoryIconName) || 'book'} className="h-4 w-4" />
                                  {cat.name}
                                </div>
                              </SelectItem>
                            ))}
                            {categories.length === 0 && (
                              <div className="p-2 text-sm text-muted-foreground">
                                No categories yet. Add one first.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Featured Image Upload */}
                    <div className="space-y-2">
                      <Label>Featured Image (Hero)</Label>
                      <p className="text-xs text-muted-foreground">
                        This image will appear as a hero banner at the top of the article
                      </p>
                      {formData.featured_image ? (
                        <div className="relative rounded-lg overflow-hidden">
                          <img 
                            src={formData.featured_image} 
                            alt="Featured" 
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="absolute top-2 right-2"
                            onClick={() => setFormData({ ...formData, featured_image: '' })}
                          >
                            <XClose className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFeaturedImageUpload}
                            className="hidden"
                            id="featured-image-upload"
                            disabled={featuredImageUploading}
                          />
                          <label htmlFor="featured-image-upload" className="cursor-pointer block">
                            {featuredImageUploading ? (
                              <div className="flex flex-col items-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                              </div>
                            ) : (
                              <>
                                <Image01 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload featured image</p>
                                <p className="text-xs text-muted-foreground mt-1">Recommended: 1200×400px</p>
                              </>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Add Article</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((filter, index) => (
                <Badge
                  key={`${filter.type}-${filter.value}-${index}`}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {filter.label}
                  <button
                    onClick={() => clearFilter(filter.type, filter.value)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* DataTable or Empty Search State */}
          {filteredArticles.length === 0 ? (
            <EmptyState
              icon={<SearchSm className="h-5 w-5 text-muted-foreground/50" />}
              title="No articles found"
              description="Try adjusting your search or filter criteria"
            />
          ) : (
            <DataTable
              table={table}
              columns={columns}
              onRowClick={handleView}
              emptyMessage="No articles found."
            />
          )}

          {/* Infinite scroll trigger */}
          {displayCount < filteredArticles.length && (
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          )}
        </>
      )}

      {/* Add Category Dialog */}
      <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={newCategoryForm.name}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                placeholder="e.g., Getting Started, FAQ, Troubleshooting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Category Description</Label>
              <Textarea
                id="category-description"
                value={newCategoryForm.description}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                placeholder="Brief description to help users understand this category"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Category Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORY_ICON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setNewCategoryForm({ ...newCategoryForm, icon: option.value })}
                    className={`p-3 rounded-lg border flex items-center justify-center transition-all ${
                      newCategoryForm.icon === option.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-accent'
                    }`}
                    title={option.label}
                  >
                    <CategoryIcon name={option.value} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category Name *</Label>
              <Input
                id="edit-category-name"
                value={editCategoryForm.name}
                onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                placeholder="e.g., Getting Started, FAQ, Troubleshooting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Category Description</Label>
              <Textarea
                id="edit-category-description"
                value={editCategoryForm.description}
                onChange={(e) => setEditCategoryForm({ ...editCategoryForm, description: e.target.value })}
                placeholder="Brief description to help users understand this category"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Category Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORY_ICON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEditCategoryForm({ ...editCategoryForm, icon: option.value })}
                    className={`p-3 rounded-lg border flex items-center justify-center transition-all ${
                      editCategoryForm.icon === option.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-accent'
                    }`}
                    title={option.label}
                  >
                    <CategoryIcon name={option.value} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory}>Update Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <DeleteCategoryDialog
        open={deleteCategoryDialogOpen}
        onOpenChange={setDeleteCategoryDialogOpen}
        categoryName={deletingCategoryName}
        articleCount={deletingCategoryArticleCount}
        otherCategories={otherCategories}
        onConfirm={handleDeleteCategoryConfirm}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onImport={bulkImport}
        existingCategories={categories.map(c => c.name)}
      />

      {/* Article Details Sheet */}
      <ArticleDetailsSheet
        article={selectedArticle}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSaveArticle}
        onDelete={handleDeleteFromSheet}
        onReembed={handleReembedArticle}
        categories={categories.map(c => ({
          id: c.id,
          agent_id: agentId,
          user_id: userId,
          name: c.name,
          description: c.description || null,
          icon: c.icon || null,
          order_index: null,
          created_at: null,
          updated_at: null,
        }))}
        agentId={agentId}
        userId={userId}
      />

      {/* Delete confirmation dialog */}
      <SimpleDeleteDialog
        open={!!deleteArticle_}
        onOpenChange={(open) => !open && setDeleteArticle(null)}
        title="Delete Article"
        description="Are you sure you want to delete this article? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
      />

      {/* Bulk delete confirmation dialog */}
      <SimpleDeleteDialog
        open={bulkDeletePending}
        onOpenChange={setBulkDeletePending}
        title="Delete Selected Articles"
        description={`Are you sure you want to delete ${selectedCount} article${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
};

export default HelpArticlesManager;
