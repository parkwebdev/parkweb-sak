/**
 * Knowledge Base Page
 * 
 * User-facing documentation to help users understand and use the Pilot platform.
 * Features a 3-column layout with sidebar navigation, article content, and table of contents.
 * 
 * @module pages/KnowledgeBase
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { KBSidebar } from '@/components/knowledge-base/KBSidebar';
import { KBArticleView } from '@/components/knowledge-base/KBArticleView';
import { KBTableOfContents } from '@/components/knowledge-base/KBTableOfContents';
import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { 
  KB_CATEGORIES, 
  getKBCategoryById, 
  getKBArticleBySlug,
  getFirstKBArticle,
  getAdjacentArticles,
  type KBCategory,
  type KBArticle,
} from '@/config/knowledge-base-config';

/** Article loading skeleton */
function ArticleSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-72" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  
  // Get current selection from URL params
  const categoryId = searchParams.get('category');
  const articleSlug = searchParams.get('article');
  
  // Resolve current category and article
  const [currentCategory, setCurrentCategory] = useState<KBCategory | undefined>();
  const [currentArticle, setCurrentArticle] = useState<KBArticle | undefined>();
  
  useEffect(() => {
    if (categoryId && articleSlug) {
      const category = getKBCategoryById(categoryId);
      const article = getKBArticleBySlug(categoryId, articleSlug);
      setCurrentCategory(category);
      setCurrentArticle(article);
    } else {
      // Default to first article
      const first = getFirstKBArticle();
      if (first) {
        setCurrentCategory(first.category);
        setCurrentArticle(first.article);
        setSearchParams({ category: first.category.id, article: first.article.slug }, { replace: true });
      }
    }
  }, [categoryId, articleSlug, setSearchParams]);
  
  // Get adjacent articles for navigation
  const adjacent = currentCategory && currentArticle 
    ? getAdjacentArticles(currentCategory.id, currentArticle.id)
    : { prev: undefined, next: undefined };
  
  // Handle article selection
  const handleSelectArticle = (category: KBCategory, article: KBArticle) => {
    setSearchParams({ category: category.id, article: article.slug });
  };
  
  // Handle previous/next navigation
  const handlePrevious = () => {
    if (adjacent.prev) {
      handleSelectArticle(adjacent.prev.category, adjacent.prev.article);
    }
  };
  
  const handleNext = () => {
    if (adjacent.next) {
      handleSelectArticle(adjacent.next.category, adjacent.next.article);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Left Sidebar - Category Navigation */}
      <KBSidebar
        categories={KB_CATEGORIES as unknown as KBCategory[]}
        selectedCategoryId={currentCategory?.id}
        selectedArticleId={currentArticle?.id}
        onSelectArticle={handleSelectArticle}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentCategory && currentArticle ? (
            <motion.div
              key={`${currentCategory.id}-${currentArticle.id}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={springs.smooth}
            >
              <Suspense fallback={<ArticleSkeleton />}>
                <KBArticleView
                  category={currentCategory}
                  article={currentArticle}
                  onHeadingsChange={setHeadings}
                  onPrevious={adjacent.prev ? handlePrevious : undefined}
                  onNext={adjacent.next ? handleNext : undefined}
                  prevArticle={adjacent.prev?.article}
                  nextArticle={adjacent.next?.article}
                />
              </Suspense>
            </motion.div>
          ) : (
            <ArticleSkeleton />
          )}
        </AnimatePresence>
      </main>
      
      {/* Right Sidebar - Table of Contents */}
      <aside className="w-[200px] border-l border-border hidden lg:block overflow-y-auto">
        <KBTableOfContents headings={headings} />
      </aside>
    </div>
  );
}
