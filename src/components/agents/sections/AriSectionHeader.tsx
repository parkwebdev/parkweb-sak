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

export function AriSectionHeader({
  title,
  description,
  showSaved = false,
  extra,
}: AriSectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
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
