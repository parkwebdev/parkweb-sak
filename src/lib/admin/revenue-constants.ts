/**
 * Revenue Analytics Constants
 * 
 * Section definitions and metadata for the Revenue page sidebar.
 * 
 * @module lib/admin/revenue-constants
 */

export const REVENUE_SECTIONS = [
  'overview',
  'mrr-breakdown', 
  'subscriptions',
  'churn',
  'accounts',
] as const;

export type RevenueSection = typeof REVENUE_SECTIONS[number];

export interface RevenueSectionInfo {
  title: string;
  description: string;
}

export const REVENUE_SECTION_INFO: Record<RevenueSection, RevenueSectionInfo> = {
  'overview': {
    title: 'Overview',
    description: 'Key revenue metrics and health indicators',
  },
  'mrr-breakdown': {
    title: 'MRR Breakdown',
    description: 'Monthly recurring revenue analysis and movement',
  },
  'subscriptions': {
    title: 'Subscriptions',
    description: 'Subscription funnel and plan distribution',
  },
  'churn': {
    title: 'Churn Analysis',
    description: 'Customer retention and churn patterns',
  },
  'accounts': {
    title: 'Top Accounts',
    description: 'Highest value accounts and concentration',
  },
};
