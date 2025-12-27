/**
 * ScheduledReportsSection Component
 * 
 * Scheduled reports management.
 */

import React from 'react';
import { ScheduledReportsManager } from '@/components/analytics/ScheduledReportsManager';

export function ScheduledReportsSection() {
  return (
    <div className="space-y-6">
      <ScheduledReportsManager />
    </div>
  );
}
