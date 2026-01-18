/**
 * Admin Help Center Page
 * 
 * Edit platform Help Center articles shown to all users.
 * WYSIWYG editor for article content.
 * 
 * @module pages/admin/AdminKnowledge
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen01 } from '@untitledui/icons';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { usePlatformHCArticles } from '@/hooks/admin/usePlatformHCArticles';
import { usePlatformHCCategories } from '@/hooks/admin/usePlatformHCCategories';
import { PlatformArticlesTable } from '@/components/admin/knowledge/PlatformArticlesTable';
import { CategoryFilterDropdown } from '@/components/admin/knowledge/CategoryFilterDropdown';
import { CreateCategoryDialog } from '@/components/admin/knowledge/CreateCategoryDialog';
import { ArticleEditorSheet } from '@/components/admin/knowledge/ArticleEditorSheet';
import { Button } from '@/components/ui/button';
import type { PlatformHCArticle, PlatformHCArticleInput } from '@/types/platform-hc';

/**
 * Platform Help Center editor page for Super Admin.
 */
export function AdminKnowledge() {
  const navigate = useNavigate();
  const { 
    articles, 
    loading: articlesLoading, 
    createArticle, 
    updateArticle, 
    deleteArticle 
  } = usePlatformHCArticles();
  
  const { 
    categories, 
    loading: categoriesLoading, 
    createCategory, 
    deleteCategory 
  } = usePlatformHCCategories();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<PlatformHCArticle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Create stable reference for categories based on their IDs to prevent infinite re-renders
  const categoriesKey = useMemo(
    () => categories.map(c => c.id).join(','),
    [categories]
  );
  const stableCategories = useMemo(() => categories, [categoriesKey]);

  // Navigate to article editor page when clicking a row
  const handleRowClick = useCallback((article: PlatformHCArticle) => {
    navigate(`/admin/knowledge/${article.id}`);
  }, [navigate]);

  const handleEditArticle = (article: PlatformHCArticle) => {
    // Also navigate to the new editor page for the Edit button
    navigate(`/admin/knowledge/${article.id}`);
  };

  const handleCreateArticle = useCallback(() => {
    // Navigate to new article page
    navigate('/admin/knowledge/new');
  }, [navigate]);

  const handleSaveArticle = async (data: PlatformHCArticleInput) => {
    setIsSaving(true);
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, data);
      } else {
        await createArticle(data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Filter articles by selected category
  const filteredArticles = useMemo(() => {
    if (!categoryFilter) return articles;
    return articles.filter(article => article.category_id === categoryFilter);
  }, [articles, categoryFilter]);

  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={BookOpen01} title="Help Center" />,
    right: (
      <div className="flex items-center gap-2">
        <CategoryFilterDropdown
          categories={stableCategories}
          activeCategory={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onAddCategory={() => setCategoryDialogOpen(true)}
        />
        <Button size="sm" onClick={handleCreateArticle}>
          Add article
        </Button>
      </div>
    ),
  }), [stableCategories, categoryFilter, handleCreateArticle]);
  useTopBar(topBarConfig);

  const handleBulkDeleteArticles = async (ids: string[]) => {
    for (const id of ids) {
      await deleteArticle(id);
    }
  };

  return (
    <div className="p-6">
      <PlatformArticlesTable
        articles={filteredArticles}
        loading={articlesLoading}
        onEdit={handleEditArticle}
        onDelete={deleteArticle}
        onBulkDelete={handleBulkDeleteArticles}
        onRowClick={handleRowClick}
      />

      {/* Article Editor Sheet */}
      <ArticleEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        article={editingArticle}
        categories={categories}
        onSave={handleSaveArticle}
        isSaving={isSaving}
      />

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreate={createCategory}
        categoriesCount={categories.length}
      />
    </div>
  );
}
