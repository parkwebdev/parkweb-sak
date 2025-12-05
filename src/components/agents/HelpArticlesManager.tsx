import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { BookOpen01, Upload01, XClose, Image01 } from '@untitledui/icons';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { toast } from '@/lib/toast';
import { uploadFeaturedImage } from '@/lib/article-image-upload';
import { CATEGORY_ICON_OPTIONS, CategoryIcon, type CategoryIconName } from '@/widget/category-icons';
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { BulkImportDialog } from './BulkImportDialog';
import { DroppableCategoryCard } from './DroppableCategoryCard';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';
import { SortableArticleItem } from './SortableArticleItem';
import type { HelpArticle } from '@/hooks/useEmbeddedChatConfig';

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
    moveArticleToCategory,
    reorderArticles, 
    bulkImport 
  } = useHelpArticles(agentId);
  
  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryName, setDeletingCategoryName] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);
  const [overCategoryName, setOverCategoryName] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    featured_image: '',
  });
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false);
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

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingArticle) {
        await updateArticle(editingArticle, formData);
        toast.success('Article updated');
      } else {
        await addArticle(formData);
        toast.success('Article added');
      }

      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save article');
    }
  };

  const handleEdit = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category,
        featured_image: article.featured_image || '',
      });
      setEditingArticle(articleId);
      setDialogOpen(true);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteArticle(articleId);
        toast.success('Article deleted');
      } catch (error) {
        toast.error('Failed to delete article');
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: '', featured_image: '' });
    setEditingArticle(null);
  };

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

  const handleAddArticleToCategory = (categoryName: string) => {
    setFormData({ title: '', content: '', category: categoryName, featured_image: '' });
    setEditingArticle(null);
    setDialogOpen(true);
  };

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
      console.error('Featured image upload error:', error);
      toast.error('Failed to upload featured image');
    } finally {
      setFeaturedImageUploading(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const article = articles.find(a => a.id === active.id);
    if (article) {
      setActiveArticle(article);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const overId = over.id.toString();
      if (overId.startsWith('category-')) {
        setOverCategoryName(overId.replace('category-', ''));
      } else {
        // Over an article - find its category
        const overArticle = articles.find(a => a.id === overId);
        if (overArticle) {
          setOverCategoryName(overArticle.category);
        }
      }
    } else {
      setOverCategoryName(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveArticle(null);
    setOverCategoryName(null);

    if (!over) return;

    const activeArticle = articles.find(a => a.id === active.id);
    if (!activeArticle) return;

    const overId = over.id.toString();
    let targetCategory: string;
    let targetArticleId: string | null = null;

    if (overId.startsWith('category-')) {
      // Dropped on a category
      targetCategory = overId.replace('category-', '');
    } else {
      // Dropped on an article
      const overArticle = articles.find(a => a.id === overId);
      if (!overArticle) return;
      targetCategory = overArticle.category;
      targetArticleId = overId;
    }

    const sourceCategory = activeArticle.category;

    if (sourceCategory !== targetCategory) {
      // Moving to different category
      try {
        await moveArticleToCategory(active.id.toString(), targetCategory);
        toast.success('Article moved');
      } catch (error) {
        toast.error('Failed to move article');
      }
    } else if (targetArticleId && active.id !== over.id) {
      // Reordering within same category
      const categoryArticles = articles
        .filter(a => a.category === sourceCategory)
        .sort((a, b) => a.order - b.order);

      const oldIndex = categoryArticles.findIndex(a => a.id === active.id);
      const newIndex = categoryArticles.findIndex(a => a.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedCategoryArticles = arrayMove(categoryArticles, oldIndex, newIndex);
        const updatedArticles = articles.map(article => {
          if (article.category !== sourceCategory) return article;
          const newOrder = reorderedCategoryArticles.findIndex(a => a.id === article.id);
          return { ...article, order: newOrder };
        });

        try {
          await reorderArticles(updatedArticles);
        } catch (error) {
          toast.error('Failed to reorder articles');
        }
      }
    }
  };

  const deletingCategoryArticleCount = articles.filter(a => a.category === deletingCategoryName).length;
  const otherCategories = categories.filter(c => c.name !== deletingCategoryName);

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading help articles...</p>
        </div>
      )}
      
      {!loading && (
        <>
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkImportOpen(true)}>
              <Upload01 className="w-3.5 h-3.5 mr-1.5" />
              Import CSV
            </Button>
            
            {/* Add Category Dialog */}
            <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Add Category
                </Button>
              </DialogTrigger>
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

            {/* Add Article Dialog */}
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
                  <DialogTitle>{editingArticle ? 'Edit Article' : 'Add Help Article'}</DialogTitle>
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
                              {cat.name}
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
                  <Button onClick={handleSubmit}>
                    {editingArticle ? 'Update' : 'Add'} Article
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Delete Category Dialog */}
          <DeleteCategoryDialog
            open={deleteCategoryDialogOpen}
            onOpenChange={setDeleteCategoryDialogOpen}
            categoryName={deletingCategoryName}
            articleCount={deletingCategoryArticleCount}
            otherCategories={otherCategories}
            onConfirm={handleDeleteCategoryConfirm}
          />

          {articles.length === 0 && categories.length === 0 ? (
            <EmptyState
              icon={<BookOpen01 className="h-5 w-5 text-muted-foreground/50" />}
              title="No help articles yet"
              description="Create help articles to display in your chat widget's help tab"
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryArticles = articles
                    .filter(article => article.category === category.name)
                    .sort((a, b) => a.order - b.order);
                  
                  return (
                    <DroppableCategoryCard
                      key={category.name}
                      category={category}
                      articles={categoryArticles}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onEditCategory={handleEditCategory}
                      onDeleteCategory={handleDeleteCategoryClick}
                      onAddArticle={handleAddArticleToCategory}
                      isOver={overCategoryName === category.name}
                    />
                  );
                })}
              </div>
              
              <DragOverlay>
                {activeArticle && (
                  <div className="opacity-80">
                    <SortableArticleItem
                      article={activeArticle}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          <BulkImportDialog
            open={bulkImportOpen}
            onOpenChange={setBulkImportOpen}
            onImport={bulkImport}
            existingCategories={categories.map(c => c.name)}
          />
        </>
      )}
    </div>
  );
};

export default HelpArticlesManager;
