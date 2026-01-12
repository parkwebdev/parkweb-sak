/**
 * AuditLogExport Component
 * 
 * Export button for audit log data.
 * 
 * @module components/admin/audit/AuditLogExport
 */

import { Button } from '@/components/ui/button';
import { Download01 } from '@untitledui/icons';

interface AuditLogExportProps {
  /** Callback when export is clicked */
  onExport: () => void;
}

/**
 * Export button component.
 */
export function AuditLogExport({ onExport }: AuditLogExportProps) {
  return (
    <Button variant="outline" size="sm" onClick={onExport}>
      <Download01 size={14} className="mr-1" aria-hidden="true" />
      Export CSV
    </Button>
  );
}
