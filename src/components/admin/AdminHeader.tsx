/**
 * AdminHeader Component
 * 
 * Header component for admin pages with title and optional actions.
 * 
 * @module components/admin/AdminHeader
 */

import { ReactNode } from 'react';

interface AdminHeaderProps {
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action buttons */
  actions?: ReactNode;
}

/**
 * Header component for admin pages.
 */
export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
