/**
 * Admin Audit Log Page
 * 
 * View all administrative actions for compliance.
 * Filterable and exportable audit trail.
 * 
 * @module pages/admin/AdminAuditLog
 */

import { useState, useMemo } from 'react';
import { ClipboardCheck, SwitchHorizontal01 } from '@untitledui/icons';
import { format } from 'date-fns';
import { AuditLogTable } from '@/components/admin/audit';
import { useAdminAuditLog, useImpersonation } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { CsvExportIcon } from '@/components/admin/shared/CsvExportIcon';
import { exportToCSV } from '@/lib/admin/admin-utils';
import type { AuditLogFilters as AuditLogFiltersType } from '@/types/admin';

/**
 * Audit log viewer page for Super Admin.
 */
export function AdminAuditLog() {
  const { isImpersonating, endAllSessions, isEndingAll } = useImpersonation();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Partial<AuditLogFiltersType>>({});
  const pageSize = 50;

  const { entries, totalCount, loading } = useAdminAuditLog({
    ...filters,
    page,
    pageSize,
  });

  const handleExport = () => {
    const exportData = entries.map(e => ({
      created_at: e.created_at,
      action: e.action,
      admin_email: e.admin_email,
      target_type: e.target_type || '',
      target_email: e.target_email || '',
      ip_address: e.ip_address || '',
    }));
    exportToCSV(
      exportData,
      `audit-log-${format(new Date(), 'yyyy-MM-dd')}`,
      [
        { key: 'created_at', label: 'Timestamp' },
        { key: 'action', label: 'Action' },
        { key: 'admin_email', label: 'Admin Email' },
        { key: 'target_type', label: 'Target Type' },
        { key: 'target_email', label: 'Target Email' },
        { key: 'ip_address', label: 'IP Address' },
      ]
    );
  };

  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={ClipboardCheck} title="Audit Log" />,
    right: (
      <div className="flex items-center gap-2">
        {isImpersonating && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => endAllSessions()}
            loading={isEndingAll}
          >
            <SwitchHorizontal01 size={14} className="mr-1.5" aria-hidden="true" />
            End All Sessions
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleExport} disabled={entries.length === 0}>
          <CsvExportIcon size={14} className="mr-1.5" aria-hidden="true" />
          Export CSV
        </Button>
      </div>
    ),
  }), [entries, isImpersonating, endAllSessions, isEndingAll]);
  useTopBar(topBarConfig);

  const handleFiltersChange = (newFilters: Partial<AuditLogFiltersType>) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Log Table - contains filters, no header needed */}
      <AuditLogTable
        entries={entries}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  );
}
