/**
 * AuditLogExport Component
 * 
 * Export button for audit log data.
 * 
 * @module components/admin/audit/AuditLogExport
 */

import { Button } from '@/components/ui/button';
import { CsvExportIcon } from '@/components/admin/shared/CsvExportIcon';

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
      <CsvExportIcon size={14} className="mr-1" />
      Export CSV
    </Button>
  );
}
