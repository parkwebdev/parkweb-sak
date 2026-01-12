/**
 * Admin Knowledge Page
 * 
 * Edit platform Help Articles shown in the Knowledge Base.
 * WYSIWYG editor for article content.
 * 
 * @module pages/admin/AdminKnowledge
 */

import { useState, useMemo } from 'react';
import { BookOpen01 } from '@untitledui/icons';
import { ArticlesTable, CategoryManager } from '@/components/admin/knowledge';
import { useAdminArticles, useAdminCategories } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import type { AdminArticle } from '@/types/admin';

/**
 * Help articles editor page for Super Admin.
 */
export function AdminKnowledge() {
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={BookOpen01} title="Help Articles" />,
  }), []);
  useTopBar(topBarConfig);

  const { 
    articles, 
    loading: articlesLoading, 
    createArticle, 
    updateArticle, 
    deleteArticle 
  } = useAdminArticles();
  
  const { 
    categories, 
    loading: categoriesLoading, 
    createCategory, 
    deleteCategory 
  } = useAdminCategories();

  const [editingArticle, setEditingArticle] = useState<AdminArticle | null>(null);

  const handleEditArticle = (article: AdminArticle) => {
    setEditingArticle(article);
    // In a full implementation, this would open an editor sheet/dialog
  };

  const handleCreateCategory = async (name: string) => {
    await createCategory({ name });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Help Articles</h1>
        <p className="text-sm text-muted-foreground">
          Edit platform documentation and help content
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Articles Table */}
        <div className="lg:col-span-2">
          <ArticlesTable
            articles={articles}
            categories={categories}
            loading={articlesLoading}
            onEdit={handleEditArticle}
            onDelete={deleteArticle}
            onCreate={createArticle}
          />
        </div>

        {/* Categories Sidebar */}
        <div>
          <CategoryManager
            categories={categories}
            loading={categoriesLoading}
            onCreate={handleCreateCategory}
            onDelete={deleteCategory}
          />
        </div>
      </div>
    </div>
  );
}
