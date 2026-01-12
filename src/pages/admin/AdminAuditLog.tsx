/**
 * Admin Audit Log Page
 * 
 * View all administrative actions for compliance.
 * Filterable and exportable audit trail.
 * 
 * @module pages/admin/AdminAuditLog
 */

import { useState, useMemo } from 'react';
import { ClipboardCheck } from '@untitledui/icons';
import { AuditLogTable } from '@/components/admin/audit';
import { useAdminAuditLog } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import type { AuditLogFilters as AuditLogFiltersType } from '@/types/admin';

/**
 * Audit log viewer page for Super Admin.
 */
export function AdminAuditLog() {
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={ClipboardCheck} title="Audit Log" />,
  }), []);
  useTopBar(topBarConfig);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Partial<AuditLogFiltersType>>({});
  const pageSize = 50;

  const { entries, totalCount, loading } = useAdminAuditLog({
    ...filters,
    page,
    pageSize,
  });

  const handleFiltersChange = (newFilters: Partial<AuditLogFiltersType>) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Log Table - contains filters and export button, no header needed */}
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
