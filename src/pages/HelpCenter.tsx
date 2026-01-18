/**
 * Help Center Page
 * 
 * User-facing documentation to help users understand and use the Pilot platform.
 */

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getNavigationIcon } from '@/lib/navigation-icons';
import { HCSidebar } from '@/components/help-center/HCSidebar';
import { HCArticleView } from '@/components/help-center/HCArticleView';
import { HCCategoryView } from '@/components/help-center/HCCategoryView';
import { HCTableOfContents } from '@/components/help-center/HCTableOfContents';
import { HCPopularArticles } from '@/components/help-center/HCPopularArticles';
import { HCTopBarSearch } from '@/components/help-center/HCTopBarSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { 
  HC_CATEGORIES, 
  getHCCategoryById, 
  getHCArticleBySlug,
  getFirstHCArticle,
  getAdjacentArticles,
  type HCCategory,
  type HCArticle,
} from '@/config/help-center-config';

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

export default function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categoryId = searchParams.get('category');
  const articleSlug = searchParams.get('article');
  
  const [currentCategory, setCurrentCategory] = useState<HCCategory | undefined>();
  const [currentArticle, setCurrentArticle] = useState<HCArticle | undefined>();
  
  const isCategoryView = categoryId && !articleSlug;
  
  const handleSearchSelect = useCallback((category: HCCategory, article: HCArticle) => {
    setSearchParams({ category: category.id, article: article.slug });
    setSearchQuery('');
  }, [setSearchParams]);
  
  const topBarConfig = useMemo(() => ({
    left: (
      <div className="flex items-center gap-3">
        <TopBarPageContext icon={getNavigationIcon('BookOpen01')} title="Help Center" />
        <HCTopBarSearch onSelect={handleSearchSelect} />
      </div>
    ),
  }), [handleSearchSelect]);
  useTopBar(topBarConfig);
  
  useEffect(() => {
    if (categoryId && articleSlug) {
      const category = getHCCategoryById(categoryId);
      const article = getHCArticleBySlug(categoryId, articleSlug);
      setCurrentCategory(category);
      setCurrentArticle(article);
    } else if (categoryId && !articleSlug) {
      const category = getHCCategoryById(categoryId);
      setCurrentCategory(category);
      setCurrentArticle(undefined);
    } else {
      const first = getFirstHCArticle();
      if (first) {
        setCurrentCategory(first.category);
        setCurrentArticle(undefined);
        setSearchParams({ category: first.category.id }, { replace: true });
      }
    }
  }, [categoryId, articleSlug, setSearchParams]);
  
  const adjacent = currentCategory && currentArticle 
    ? getAdjacentArticles(currentCategory.id, currentArticle.id)
    : { prev: undefined, next: undefined };
  
  const handleSelectCategory = (category: HCCategory) => {
    setSearchParams({ category: category.id });
  };
  
  const handleSelectArticle = (category: HCCategory, article: HCArticle) => {
    setSearchParams({ category: category.id, article: article.slug });
  };
  
  const handleSelectArticleFromCategory = (article: HCArticle) => {
    if (currentCategory) {
      setSearchParams({ category: currentCategory.id, article: article.slug });
    }
  };
  
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
    <div className="flex h-full overflow-hidden bg-background print:h-auto print:overflow-visible print:block">
      <HCSidebar
        categories={HC_CATEGORIES as unknown as HCCategory[]}
        selectedCategoryId={currentCategory?.id}
        selectedArticleId={currentArticle?.id}
        isCategoryView={!!isCategoryView}
        onSelectCategory={handleSelectCategory}
        onSelectArticle={handleSelectArticle}
        searchQuery={searchQuery}
      />
      
      <main className="flex-1 overflow-y-auto print:overflow-visible">
        <AnimatePresence mode="wait">
          {isCategoryView && currentCategory ? (
            <motion.div
              key={`category-${currentCategory.id}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={springs.smooth}
            >
              <HCCategoryView
                category={currentCategory}
                onSelectArticle={handleSelectArticleFromCategory}
              />
            </motion.div>
          ) : currentCategory && currentArticle ? (
            <motion.div
              key={`${currentCategory.id}-${currentArticle.id}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={springs.smooth}
            >
              <Suspense fallback={<ArticleSkeleton />}>
                <HCArticleView
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
      
      <aside className="w-[200px] border-l border-border hidden lg:block overflow-y-auto">
        {isCategoryView && currentCategory ? (
          <HCPopularArticles
            categoryId={currentCategory.id}
            onSelectArticle={handleSelectArticleFromCategory}
          />
        ) : (
          <HCTableOfContents headings={headings} />
        )}
      </aside>
    </div>
  );
}
