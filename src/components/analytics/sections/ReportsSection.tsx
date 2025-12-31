/**
 * ReportsSection Component
 * 
 * Analytics section displaying report management:
 * - Export history table
 * - Scheduled reports manager
 * 
 * @module components/analytics/sections/ReportsSection
 */

import { ExportHistoryTable } from '@/components/analytics/ExportHistoryTable';
import { ScheduledReportsManager } from '@/components/analytics/ScheduledReportsManager';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

interface ReportsSectionProps {
  /** Loading state for consistency with other section components */
  loading?: boolean;
}

export function ReportsSection({ loading }: ReportsSectionProps) {
  return (
    <div className="space-y-6">
      <AnimatedList className="space-y-6" staggerDelay={0.1}>
        <AnimatedItem>
          <ExportHistoryTable loading={loading} />
        </AnimatedItem>
        <AnimatedItem>
          <ScheduledReportsManager loading={loading} />
        </AnimatedItem>
      </AnimatedList>
    </div>
  );
}
