/**
 * AriSectionHeader Component
 * 
 * Consistent header for all Ari configuration sections.
 */

import React from 'react';
import { SavedIndicator } from '@/components/settings/SavedIndicator';

interface AriSectionHeaderProps {
  title: string;
  description?: string;
  showSaved?: boolean;
  extra?: React.ReactNode;
}

export const AriSectionHeader: React.FC<AriSectionHeaderProps> = ({
  title,
  description,
  showSaved = false,
  extra,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SavedIndicator show={showSaved} />
          {extra}
        </div>
      </div>
    </div>
  );
};
