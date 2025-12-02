import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen01 } from '@untitledui/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { toast } from '@/lib/toast';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableArticleItem } from './SortableArticleItem';

interface HelpArticlesManagerProps {
  agentId: string;
}

export const HelpArticlesManager = ({ agentId }: HelpArticlesManagerProps) => {
  const { articles, categories, loading, addArticle, updateArticle, deleteArticle, addCategory, updateCategory, reorderArticles } = useHelpArticles(agentId);
  
  // Configure sensors for drag and drop (require 5px movement to start dragging)
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
  const [editingCategoryName, setEditingCategoryName] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    icon: '',
  });
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    description: '',
  });
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    description: '',
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
        icon: article.icon || '',
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
    setFormData({ title: '', content: '', category: '', icon: '' });
    setEditingArticle(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryForm.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    try {
      await addCategory(newCategoryForm.name, newCategoryForm.description);
      toast.success('Category added');
      setNewCategoryForm({ name: '', description: '' });
      setNewCategoryDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleEditCategory = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      setEditingCategoryName(categoryName);
      setEditCategoryForm({ name: category.name, description: category.description });
      setEditCategoryDialogOpen(true);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryForm.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    try {
      await updateCategory(editingCategoryName, editCategoryForm.name, editCategoryForm.description);
      toast.success('Category updated');
      setEditCategoryDialogOpen(false);
      setEditingCategoryName('');
      setEditCategoryForm({ name: '', description: '' });
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDragEnd = async (event: DragEndEvent, category: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const categoryArticles = articles
      .filter(article => article.category === category)
      .sort((a, b) => a.order - b.order);

    const oldIndex = categoryArticles.findIndex(article => article.id === active.id);
    const newIndex = categoryArticles.findIndex(article => article.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder articles within this category
    const reorderedCategoryArticles = arrayMove(categoryArticles, oldIndex, newIndex);
    
    // Update order for reordered articles
    const updatedArticles = articles.map(article => {
      if (article.category !== category) {
        return article;
      }
      const newOrder = reorderedCategoryArticles.findIndex(a => a.id === article.id);
      return { ...article, order: newOrder };
    });

    try {
      await reorderArticles(updatedArticles);
    } catch (error) {
      toast.error('Failed to reorder articles');
    }
  };

  return (
    <div className="space-y-4">
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-sm text-muted-foreground mt-2">Loading help articles...</p>
        </div>
      )}
      
      {!loading && (
        <>
          <div className="flex items-center justify-end gap-2">
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCategory}>Add Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCategory}>Update Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                Add Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingArticle ? 'Edit Article' : 'Add Help Article'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your help article content here..."
                    rows={6}
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

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon (emoji, optional)</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="📖"
                      maxLength={2}
                    />
                  </div>
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

      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen01 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No help articles yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Create help articles to display in your chat widget's help tab
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryArticles = articles
              .filter(article => article.category === category.name)
              .sort((a, b) => a.order - b.order);
            
            if (categoryArticles.length === 0) return null;
            
            return (
              <Card key={category.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{category.name}</h4>
                      {category.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category.name)}
                      className="h-7 px-2"
                    >
                      Edit
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, category.name)}
                  >
                    <SortableContext
                      items={categoryArticles.map(a => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {categoryArticles.map((article) => (
                          <SortableArticleItem
                            key={article.id}
                            article={article}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </>
      )}
    </div>
  );
};
