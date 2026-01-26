/**
 * AdminSectionHeader Component
 * 
 * Section header for admin prompt editing pages with save button and status indicators.
 * 
 * @module components/admin/prompts/AdminSectionHeader
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  lastUpdated?: string;
  hasChanges?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  extra?: React.ReactNode;
}

export function AdminSectionHeader({
  title,
  description,
  lastUpdated,
  hasChanges = false,
  isSaving = false,
  onSave,
  extra,
}: AdminSectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {hasChanges && !isSaving && (
              <Badge variant="outline" size="sm" className="text-amber-600 border-amber-300 bg-amber-50">
                Unsaved
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <Button
              size="sm"
              onClick={onSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          {extra}
        </div>
      </div>
      {lastUpdated && (
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
