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
import { AuditLogTable, AuditLogFilters, AuditLogExport } from '@/components/admin/audit';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            View all administrative actions and changes
          </p>
        </div>
        <AuditLogExport onExport={() => {}} />
      </div>

      {/* Filters */}
      <AuditLogFilters
        onApply={handleFiltersChange}
      />

      {/* Log Table */}
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
