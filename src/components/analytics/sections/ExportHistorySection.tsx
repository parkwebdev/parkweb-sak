/**
 * ExportHistorySection Component
 * 
 * Export history table for downloaded reports.
 */

import React from 'react';
import { ExportHistoryTable } from '@/components/analytics/ExportHistoryTable';

export function ExportHistorySection() {
  return (
    <div className="space-y-6">
      <ExportHistoryTable />
    </div>
  );
}
