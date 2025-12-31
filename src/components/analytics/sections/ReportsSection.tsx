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

interface ReportsSectionProps {
  /** Loading state for consistency with other section components */
  loading?: boolean;
}

export function ReportsSection({ loading }: ReportsSectionProps) {
  return (
    <div className="space-y-6">
      <ExportHistoryTable loading={loading} />
      <ScheduledReportsManager loading={loading} />
    </div>
  );
}
