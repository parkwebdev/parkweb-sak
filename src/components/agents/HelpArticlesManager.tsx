/**
 * HelpArticlesManager Component
 * 
 * Full management interface for help articles and categories.
 * Features DataTable with filtering, bulk actions, category management,
 * rich text editing, and RAG embedding functionality.
 * @module components/agents/HelpArticlesManager
 */

import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BookOpen01, XClose, Image01, Plus, FilterLines, SearchSm, Trash01, RefreshCcw01, ChevronDown 
} from '@untitledui/icons';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { toast } from '@/lib/toast';
import { uploadFeaturedImage } from '@/lib/article-image-upload';
import { CATEGORY_ICON_OPTIONS, CategoryIcon, type CategoryIconName } from '@/widget/category-icons';
import { BulkImportDialog } from './BulkImportDialog';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';
import { ArticleDetailsSheet } from './articles/ArticleDetailsSheet';
import { 
  createHelpArticlesColumns, 
  type HelpArticleWithMeta 
} from '@/components/data-table/columns/help-articles-columns';
import { logger } from '@/utils/logger';

interface HelpArticlesManagerProps {
  agentId: string;
  userId: string;
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
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  
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

  // Transform articles to include category metadata
  const articlesWithMeta: HelpArticleWithMeta[] = useMemo(() => {
    return articles.map(article => {
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
        createdAt: null, // Not available in current HelpArticle type
        updatedAt: null,
      };
    });
  }, [articles, categories]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    return articlesWithMeta.filter(article => {
      // Category filter
      if (categoryFilter !== 'all' && article.categoryName !== categoryFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'embedded' && !article.hasEmbedding) {
        return false;
      }
      if (statusFilter === 'pending' && article.hasEmbedding) {
        return false;
      }
      return true;
    });
  }, [articlesWithMeta, categoryFilter, statusFilter]);

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

    // Swap with previous article
    const newOrder = [...categoryArticles];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    
    // Convert back to HelpArticle format and update
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

    // Swap with next article
    const newOrder = [...categoryArticles];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    
    // Convert back to HelpArticle format and update
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

  // Delete handler
  const handleDelete = useCallback(async (article: HelpArticleWithMeta) => {
    try {
      await deleteArticle(article.id);
      toast.success('Article deleted');
      // Close sheet if viewing deleted article
      if (selectedArticle?.id === article.id) {
        setSheetOpen(false);
        setSelectedArticle(null);
      }
    } catch (error) {
      toast.error('Failed to delete article');
    }
  }, [deleteArticle, selectedArticle]);

  // View handler
  const handleView = useCallback((article: HelpArticleWithMeta) => {
    setSelectedArticle(article);
    setSheetOpen(true);
  }, []);

  // Column definitions
  const columns = useMemo(() => createHelpArticlesColumns({
    onView: handleView,
    onDelete: handleDelete,
    onMoveUp: handleMoveUp,
    onMoveDown: handleMoveDown,
    canMoveUp,
    canMoveDown,
  }), [handleView, handleDelete, handleMoveUp, handleMoveDown, canMoveUp, canMoveDown]);

  // Table instance
  const table = useReactTable({
    data: filteredArticles,
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

  // Bulk delete
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    const selectedArticleItems = selectedIds.map(index => filteredArticles[parseInt(index)]).filter(Boolean);
    
    if (selectedArticleItems.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedArticleItems.length} article(s)?`)) return;

    try {
      await Promise.all(selectedArticleItems.map(a => deleteArticle(a.id)));
      toast.success(`Deleted ${selectedArticleItems.length} articles`);
      setRowSelection({});
    } catch (error) {
      toast.error('Failed to delete some articles');
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
    // Update selected article
    setSelectedArticle(prev => prev ? {
      ...prev,
      title: data.title,
      content: data.content,
      category_id: data.category_id,
      category_name: category?.name || '',
      featured_image: data.featured_image,
    } : null);
  };

  // Active filter count
  const activeFilterCount = [
    categoryFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;
  const deletingCategoryArticleCount = articles.filter(a => a.category === deletingCategoryName).length;
  const otherCategories = categories.filter(c => c.name !== deletingCategoryName);

  if (loading) {
    return <LoadingState size="md" text="Loading help articles..." />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative max-w-xs w-full">
            <SearchSm className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FilterLines className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={(cat.icon as CategoryIconName) || 'book'} className="h-4 w-4" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="embedded">Embedded</SelectItem>
                    <SelectItem value="pending">Not Embedded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bulk selection actions */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
              <Button size="sm" variant="ghost" onClick={() => setRowSelection({})}>
                Clear
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={handleBulkDelete}
              >
                <Trash01 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}

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
                <Plus className="h-4 w-4 mr-1" />
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
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {categoryFilter}
              <button 
                onClick={() => setCategoryFilter('all')}
                className="ml-1 hover:text-foreground"
              >
                <XClose className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter === 'embedded' ? 'Embedded' : 'Not Embedded'}
              <button 
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:text-foreground"
              >
                <XClose className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Table or Empty State */}
      {articles.length === 0 && categories.length === 0 ? (
        <EmptyState
          icon={<BookOpen01 className="h-5 w-5 text-muted-foreground/50" />}
          title="No help articles yet"
          description="Create help articles to display in your chat widget's help tab"
        />
      ) : filteredArticles.length === 0 ? (
        <EmptyState
          icon={<SearchSm className="h-5 w-5 text-muted-foreground/50" />}
          title="No articles found"
          description="Try adjusting your search or filter criteria"
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={(e) => {
                    // Don't open sheet if clicking checkbox or action buttons
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('[role="checkbox"]')) {
                      return;
                    }
                    handleView(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
        onDelete={(id) => {
          const articleToDelete = articlesWithMeta.find(a => a.id === id);
          if (articleToDelete) handleDelete(articleToDelete);
          setSheetOpen(false);
        }}
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
    </div>
  );
};

export default HelpArticlesManager;
