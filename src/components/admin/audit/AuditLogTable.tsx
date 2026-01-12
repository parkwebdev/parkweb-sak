// Audit Components Stubs
import type { AuditLogEntry } from '@/types/admin';
export function AuditLogTable({ entries, loading }: { entries: AuditLogEntry[]; loading?: boolean }) {
  if (loading) return <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">Loading...</div>;
  if (!entries.length) return <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">No audit logs found</div>;
  return (
    <div className="rounded-lg border border-border divide-y divide-border">
      {entries.map((e) => (
        <div key={e.id} className="p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{e.action}</span>
            <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">By {e.admin_email}</p>
        </div>
      ))}
    </div>
  );
}
export function AuditLogFilters() { return <div className="flex gap-2 mb-4 text-sm text-muted-foreground">Filters coming soon</div>; }
export function AuditLogDetail() { return <div>Detail view</div>; }
export function AuditLogExport() { return null; }
