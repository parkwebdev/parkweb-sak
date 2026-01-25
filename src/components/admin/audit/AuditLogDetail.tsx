/**
 * AuditLogDetail Component
 * 
 * Detail view for a single audit log entry.
 * 
 * @module components/admin/audit/AuditLogDetail
 */

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { getAuditActionLabel, getTargetTypeLabel } from '@/lib/admin/audit-actions';
import { parseUserAgent } from '@/lib/admin/admin-utils';
import { RelatedActivityLog } from './RelatedActivityLog';
import type { AuditLogEntry } from '@/types/admin';

interface AuditLogDetailProps {
  /** Selected audit log entry */
  entry: AuditLogEntry | null;
  /** Callback when sheet is closed */
  onClose: () => void;
}

/** Human-readable labels for common detail keys */
const DETAIL_KEY_LABELS: Record<string, string> = {
  reason: 'Reason',
  target_user_id: 'Target User',
  bulk_end: 'Bulk Action',
  old_status: 'Previous Status',
  new_status: 'New Status',
  old_value: 'Previous Value',
  new_value: 'New Value',
  plan_id: 'Plan',
  plan_name: 'Plan Name',
  amount: 'Amount',
  currency: 'Currency',
  subscription_id: 'Subscription',
  changes: 'Changes Made',
  field: 'Field',
  from: 'From',
  to: 'To',
  email: 'Email',
  role: 'Role',
  permissions: 'Permissions',
  duration_minutes: 'Duration (mins)',
  error: 'Error',
  message: 'Message',
};

/**
 * Format a detail value for human-readable display
 */
function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (Array.isArray(value)) return value.join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Convert a key to a readable label
 */
function getKeyLabel(key: string): string {
  if (DETAIL_KEY_LABELS[key]) return DETAIL_KEY_LABELS[key];
  // Convert snake_case or camelCase to Title Case
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Render details as human-readable key-value pairs
 */
function DetailsList({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        // Handle nested objects specially
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return (
            <div key={key} className="space-y-1">
              <p className="text-xs font-medium text-foreground">{getKeyLabel(key)}</p>
              <div className="pl-3 border-l-2 border-muted space-y-1">
                {Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) => (
                  <div key={nestedKey} className="flex items-start justify-between gap-4">
                    <span className="text-xs text-muted-foreground shrink-0">
                      {getKeyLabel(nestedKey)}
                    </span>
                    <span className="text-xs text-foreground text-right break-words">
                      {formatDetailValue(nestedValue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="flex items-start justify-between gap-4">
            <span className="text-xs text-muted-foreground shrink-0">
              {getKeyLabel(key)}
            </span>
            <span className="text-xs text-foreground text-right break-words max-w-[60%]">
              {formatDetailValue(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Audit log detail view.
 */
export function AuditLogDetail({ entry, onClose }: AuditLogDetailProps) {
  if (!entry) return null;

  const hasDetails = entry.details && Object.keys(entry.details).length > 0;

  return (
    <Sheet open={!!entry} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Audit Log Details</SheetTitle>
          <SheetDescription>
            {format(new Date(entry.created_at), 'MMMM d, yyyy h:mm:ss a')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Action */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Action</Label>
            <div className="flex items-center gap-2">
              <Badge>{getAuditActionLabel(entry.action)}</Badge>
            </div>
          </div>

          {/* Admin */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Performed By</Label>
            <p className="text-sm font-medium">{entry.admin_name || entry.admin_email}</p>
            {entry.admin_name && (
              <p className="text-xs text-muted-foreground">{entry.admin_email}</p>
            )}
          </div>

          {/* Target */}
          {entry.target_type && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Target</Label>
              <div>
                <Badge variant="outline" className="mb-1">
                  {getTargetTypeLabel(entry.target_type)}
                </Badge>
                {entry.target_email && (
                  <p className="text-sm">{entry.target_email}</p>
                )}
                {entry.target_id && (
                  <p className="text-xs text-muted-foreground font-mono">{entry.target_id}</p>
                )}
              </div>
            </div>
          )}

          {/* Details - Human Readable */}
          {hasDetails && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Details</Label>
              <div className="bg-muted/50 p-3 rounded-card">
                <DetailsList details={entry.details as Record<string, unknown>} />
              </div>
            </div>
          )}

          {/* Metadata & Related Activity */}
          <div className="space-y-4 pt-4 border-t border-border">
            {entry.ip_address && (
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">IP Address</Label>
                <span className="text-sm font-mono">{entry.ip_address}</span>
              </div>
            )}
            {entry.user_agent && (
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Browser</Label>
                <span className="text-sm">{parseUserAgent(entry.user_agent)}</span>
              </div>
            )}

            {/* Related Activity */}
            {entry.target_id && (
              <RelatedActivityLog
                targetId={entry.target_id}
                targetType={entry.target_type}
                excludeEntryId={entry.id}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
