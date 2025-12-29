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

export function ReportsSection() {
  return (
    <div className="space-y-6">
      <ExportHistoryTable />
      <ScheduledReportsManager />
    </div>
  );
}
