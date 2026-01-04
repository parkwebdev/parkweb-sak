/**
 * AriSectionHeader Component
 * 
 * Consistent header for all Ari configuration sections.
 */

import { SavingIndicator } from '@/components/ui/saving-indicator';

interface AriSectionHeaderProps {
  title: string;
  description?: string;
  isSaving?: boolean;
  extra?: React.ReactNode;
}

export function AriSectionHeader({
  title,
  description,
  isSaving = false,
  extra,
}: AriSectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            <SavingIndicator isSaving={isSaving} />
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {extra}
        </div>
      </div>
    </div>
  );
}
