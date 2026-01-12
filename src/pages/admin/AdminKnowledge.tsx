/**
 * Admin Knowledge Page
 * 
 * Edit platform Knowledge Base articles shown to all users.
 * WYSIWYG editor for article content.
 * 
 * @module pages/admin/AdminKnowledge
 */

import { useState, useMemo } from 'react';
import { BookOpen01 } from '@untitledui/icons';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { usePlatformKBArticles } from '@/hooks/admin/usePlatformKBArticles';
import { usePlatformKBCategories } from '@/hooks/admin/usePlatformKBCategories';
import { PlatformArticlesTable } from '@/components/admin/knowledge/PlatformArticlesTable';
import { PlatformCategoryManager } from '@/components/admin/knowledge/PlatformCategoryManager';
import { ArticleEditorSheet } from '@/components/admin/knowledge/ArticleEditorSheet';
import type { PlatformKBArticle, PlatformKBArticleInput } from '@/types/platform-kb';

/**
 * Platform Knowledge Base editor page for Super Admin.
 */
export function AdminKnowledge() {
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={BookOpen01} title="Knowledge Base" />,
  }), []);
  useTopBar(topBarConfig);

  const { 
    articles, 
    loading: articlesLoading, 
    createArticle, 
    updateArticle, 
    deleteArticle 
  } = usePlatformKBArticles();
  
  const { 
    categories, 
    loading: categoriesLoading, 
    createCategory, 
    deleteCategory 
  } = usePlatformKBCategories();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<PlatformKBArticle | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditArticle = (article: PlatformKBArticle) => {
    setEditingArticle(article);
    setEditorOpen(true);
  };

  const handleCreateArticle = () => {
    setEditingArticle(null);
    setEditorOpen(true);
  };

  const handleSaveArticle = async (data: PlatformKBArticleInput) => {
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

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Articles Table */}
        <div className="lg:col-span-2">
          <PlatformArticlesTable
            articles={articles}
            loading={articlesLoading}
            onEdit={handleEditArticle}
            onDelete={deleteArticle}
            onCreate={handleCreateArticle}
          />
        </div>

        {/* Categories Sidebar */}
        <div>
          <PlatformCategoryManager
            categories={categories}
            loading={categoriesLoading}
            onCreate={createCategory}
            onDelete={deleteCategory}
          />
        </div>
      </div>

      {/* Article Editor Sheet */}
      <ArticleEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        article={editingArticle}
        categories={categories}
        onSave={handleSaveArticle}
        isSaving={isSaving}
      />
    </div>
  );
}
