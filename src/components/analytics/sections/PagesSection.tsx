/**
 * PagesSection Component
 * 
 * Analytics section displaying page engagement metrics including:
 * - Page engagement card
 * - Top pages chart
 * - Page depth chart
 * - Landing pages table
 * 
 * @module components/analytics/sections/PagesSection
 */

import { PageEngagementCard } from '@/components/analytics/PageEngagementCard';
import { TopPagesChart } from '@/components/analytics/TopPagesChart';
import { PageDepthChart } from '@/components/analytics/PageDepthChart';
import { LandingPagesTable } from '@/components/analytics/LandingPagesTable';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import type { EngagementMetrics, PageDepthData, TopPageData } from '@/types/analytics';

interface PagesSectionProps {
  /** Page engagement metrics */
  engagement: EngagementMetrics;
  /** Landing pages data */
  landingPages: TopPageData[];
  /** Page depth distribution data */
  pageDepthDistribution: PageDepthData[];
  /** Loading state */
  trafficLoading: boolean;
}

export function PagesSection({
  engagement,
  landingPages,
  pageDepthDistribution,
  trafficLoading,
}: PagesSectionProps) {
  return (
    <div className="space-y-6">
      <AnimatedList className="space-y-6" staggerDelay={0.1}>
        <AnimatedItem>
          <PageEngagementCard engagement={engagement} loading={trafficLoading} />
        </AnimatedItem>
        <AnimatedItem>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPagesChart data={landingPages} loading={trafficLoading} />
            <PageDepthChart data={pageDepthDistribution} loading={trafficLoading} />
          </div>
        </AnimatedItem>
        <AnimatedItem>
          <LandingPagesTable data={landingPages} loading={trafficLoading} />
        </AnimatedItem>
      </AnimatedList>
    </div>
  );
}
