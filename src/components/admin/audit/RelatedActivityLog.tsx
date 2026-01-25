/**
 * RelatedActivityLog Component
 * 
 * Displays a timeline of related audit activity for the same target.
 * 
 * @module components/admin/audit/RelatedActivityLog
 */

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatShortTime } from '@/lib/time-formatting';
import { useRelatedAuditActivity } from '@/hooks/admin/useRelatedAuditActivity';
import { getAuditActionLabel } from '@/lib/admin/audit-actions';
import type { AuditAction } from '@/types/admin';

interface RelatedActivityLogProps {
  /** The target ID to find related activity for */
  targetId: string;
  /** The target type (account, plan, etc.) */
  targetType: string | null;
  /** The entry ID to exclude from results */
  excludeEntryId: string;
}

/**
 * Timeline of related audit activity for the same target.
 */
export function RelatedActivityLog({
  targetId,
  targetType,
  excludeEntryId,
}: RelatedActivityLogProps) {
  const { entries, loading, error } = useRelatedAuditActivity({
    targetId,
    targetType,
    excludeEntryId,
  });

  if (error) {
    return null; // Silently fail - this is supplementary info
  }

  return (
    <div className="space-y-3 pt-2">
      <Label className="text-xs text-muted-foreground">Related Activity</Label>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-2 w-2 rounded-full mt-1.5 shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No related activity
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3">
              {/* Timeline dot */}
              <div className="h-2 w-2 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-2xs">
                    {getAuditActionLabel(entry.action as AuditAction)}
                  </Badge>
                  <span className="text-2xs text-muted-foreground">
                    {formatShortTime(new Date(entry.created_at))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  by {entry.admin_name || entry.admin_email}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
