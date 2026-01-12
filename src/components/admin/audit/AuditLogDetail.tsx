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
import type { AuditLogEntry } from '@/types/admin';

interface AuditLogDetailProps {
  /** Selected audit log entry */
  entry: AuditLogEntry | null;
  /** Callback when sheet is closed */
  onClose: () => void;
}

/**
 * Audit log detail view.
 */
export function AuditLogDetail({ entry, onClose }: AuditLogDetailProps) {
  if (!entry) return null;

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

          {/* Details */}
          {Object.keys(entry.details).length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Details</Label>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(entry.details, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3 pt-4 border-t border-border">
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
