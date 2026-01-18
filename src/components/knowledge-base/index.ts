/**
 * Backward Compatibility Re-exports
 * 
 * Re-exports all Help Center components with KB* aliases for backward compatibility.
 * This allows existing article files to continue working while we migrate.
 */

// Re-export with HC names
export * from '../help-center';

// Re-export with KB aliases for backward compatibility
export { HCCallout as KBCallout } from '../help-center/HCCallout';
export { HCStepByStep as KBStepByStep } from '../help-center/HCStepByStep';
export { HCFeatureCard as KBFeatureCard, HCFeatureGrid as KBFeatureGrid } from '../help-center/HCFeatureCard';
export { HCArticleLink as KBArticleLink, HCRelatedArticles as KBRelatedArticles } from '../help-center/HCArticleLink';
export { HCSidebar as KBSidebar } from '../help-center/HCSidebar';
export { HCArticleView as KBArticleView } from '../help-center/HCArticleView';
export { HCCategoryView as KBCategoryView } from '../help-center/HCCategoryView';
export { HCArticleCard as KBArticleCard } from '../help-center/HCArticleCard';
export { HCTableOfContents as KBTableOfContents } from '../help-center/HCTableOfContents';
export { HCPopularArticles as KBPopularArticles } from '../help-center/HCPopularArticles';
export { HCArticleFeedback as KBArticleFeedback } from '../help-center/HCArticleFeedback';
export { HCTopBarSearch as KBTopBarSearch } from '../help-center/HCTopBarSearch';
