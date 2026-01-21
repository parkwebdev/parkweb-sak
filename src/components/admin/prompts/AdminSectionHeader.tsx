/**
 * AdminSectionHeader Component
 * 
 * Consistent header for Admin prompt sections with status indicators.
 * Matches the AriSectionHeader pattern.
 * 
 * @module components/admin/prompts/AdminSectionHeader
 */

import { motion } from 'motion/react';
import { Check } from '@untitledui/icons';
import { Badge } from '@/components/ui/badge';

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  version?: number;
  lastUpdated?: string;
  status?: SaveStatus;
  hasChanges?: boolean;
  extra?: React.ReactNode;
}

export function AdminSectionHeader({
  title,
  description,
  version,
  status,
  hasChanges,
  extra,
}: AdminSectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            {version !== undefined && (
              <Badge variant="secondary" size="sm">v{version}</Badge>
            )}
            {hasChanges && status !== 'saving' && (
              <Badge variant="outline" size="sm" className="text-amber-600 border-amber-300">
                Unsaved
              </Badge>
            )}
            {status === 'saving' && (
              <Badge variant="outline" size="sm" className="text-blue-600 border-blue-300">
                Saving...
              </Badge>
            )}
            {status === 'saved' && !hasChanges && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Check size={16} className="text-status-active" aria-hidden="true" />
              </motion.span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {extra && (
          <div className="flex items-center gap-3">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}
