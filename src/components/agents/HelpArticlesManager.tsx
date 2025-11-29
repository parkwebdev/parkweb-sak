import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash01, Edit05, BookOpen01 } from '@untitledui/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { toast } from 'sonner';

interface HelpArticlesManagerProps {
  agentId: string;
}

export const HelpArticlesManager = ({ agentId }: HelpArticlesManagerProps) => {
  const { articles, categories, addArticle, updateArticle, deleteArticle, addCategory } = useHelpArticles(agentId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    icon: '',
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingArticle) {
      updateArticle(editingArticle, formData);
      toast.success('Article updated');
    } else {
      addArticle(formData);
      toast.success('Article added');
    }

    resetForm();
    setDialogOpen(false);
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

  const handleDelete = (articleId: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      deleteArticle(articleId);
      toast.success('Article deleted');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: '', icon: '' });
    setEditingArticle(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    addCategory(newCategoryName);
    toast.success('Category added');
    setNewCategoryName('');
    setNewCategoryDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add help articles to display in the chat widget's help tab, organized by categories.
        </p>
        <div className="flex gap-2">
          <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
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
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Getting Started, FAQ, Troubleshooting"
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

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
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
                          <SelectItem key={cat} value={cat}>
                            {cat}
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
              .filter(article => article.category === category)
              .sort((a, b) => a.order - b.order);
            
            if (categoryArticles.length === 0) return null;
            
            return (
              <Card key={category}>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">{category}</h4>
                  <div className="space-y-2">
                    {categoryArticles.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        {article.icon && (
                          <span className="text-xl">{article.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm">{article.title}</h5>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {article.content}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(article.id)}
                          >
                            <Edit05 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(article.id)}
                          >
                            <Trash01 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
