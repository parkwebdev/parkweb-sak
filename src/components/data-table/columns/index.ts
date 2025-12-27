export { createLeadsColumns, type Lead } from './leads-columns';
export { createTeamColumns } from './team-columns';
export { landingPagesColumns, type LandingPageData } from './landing-pages-columns';

// Locations table columns
export { createLocationsColumns, type Location, type LocationWithCounts } from './locations-columns';

// Properties table columns
export { createPropertiesColumns } from './properties-columns';
export type { PropertyWithLocation } from '@/hooks/useProperties';

// Knowledge sources table columns
export { createKnowledgeColumns, type KnowledgeSourceWithMeta, type KnowledgeColumnsProps } from './knowledge-columns';

// Help articles table columns
export { createHelpArticlesColumns, type HelpArticleWithMeta, type HelpArticlesColumnsProps } from './help-articles-columns';

// Export history table columns
export { createExportHistoryColumns, type ExportHistoryColumnsProps } from './export-history-columns';
