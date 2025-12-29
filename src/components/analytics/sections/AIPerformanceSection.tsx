/**
 * AIPerformanceSection Component
 * 
 * Analytics section displaying AI performance metrics including:
 * - AI performance card (containment, resolution rates)
 * - CSAT distribution card
 * - Customer feedback table
 * 
 * @module components/analytics/sections/AIPerformanceSection
 */

import { AIPerformanceCard } from '@/components/analytics/AIPerformanceCard';
import { CSATDistributionCard } from '@/components/analytics/CSATDistributionCard';
import { CustomerFeedbackCard } from '@/components/analytics/CustomerFeedbackCard';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import type { RatingDistribution, FeedbackItem } from '@/types/analytics';

interface AIPerformanceSectionProps {
  /** AI containment rate */
  containmentRate: number;
  /** AI resolution rate */
  resolutionRate: number;
  /** Total conversations handled */
  totalConversations: number;
  /** Number of human takeovers */
  humanTakeover: number;
  /** CSAT rating distribution */
  csatDistribution: RatingDistribution[];
  /** Average CSAT rating */
  averageRating: number;
  /** Total number of ratings */
  totalRatings: number;
  /** Recent customer feedback */
  recentFeedback: FeedbackItem[];
  /** Trend value for containment */
  aiContainmentTrendValue: number;
  /** Loading state for AI performance */
  aiPerformanceLoading: boolean;
  /** Loading state for satisfaction data */
  satisfactionLoading: boolean;
}

export function AIPerformanceSection({
  containmentRate,
  resolutionRate,
  totalConversations,
  humanTakeover,
  csatDistribution,
  averageRating,
  totalRatings,
  recentFeedback,
  aiContainmentTrendValue,
  aiPerformanceLoading,
  satisfactionLoading,
}: AIPerformanceSectionProps) {
  return (
    <div className="space-y-6">
      <AnimatedList className="space-y-6" staggerDelay={0.1}>
        <AnimatedItem>
          <AIPerformanceCard 
            containmentRate={containmentRate} 
            resolutionRate={resolutionRate} 
            totalConversations={totalConversations} 
            humanTakeover={humanTakeover} 
            loading={aiPerformanceLoading} 
            trendValue={aiContainmentTrendValue} 
            trendPeriod="this month" 
          />
        </AnimatedItem>
        
        <AnimatedItem>
          <CSATDistributionCard 
            distribution={csatDistribution} 
            averageRating={averageRating} 
            totalRatings={totalRatings} 
            loading={satisfactionLoading} 
          />
        </AnimatedItem>
        
        <AnimatedItem>
          <CustomerFeedbackCard 
            data={recentFeedback} 
            loading={satisfactionLoading} 
          />
        </AnimatedItem>
      </AnimatedList>
    </div>
  );
}
