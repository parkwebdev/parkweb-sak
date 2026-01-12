/**
 * AdminPageContainer Component
 * 
 * Consistent page wrapper for all admin pages.
 * Provides title, description, breadcrumbs, and actions slot.
 * 
 * @module components/admin/AdminPageContainer
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from '@untitledui/icons';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminPageContainerProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Breadcrumb navigation */
  breadcrumbs?: Breadcrumb[];
  /** Action buttons slot */
  actions?: ReactNode;
  /** Page content */
  children: ReactNode;
}

/**
 * Container component for admin pages with consistent layout.
 */
export function AdminPageContainer({
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: AdminPageContainerProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/admin" className="hover:text-foreground transition-colors">
            Admin
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight size={14} aria-hidden="true" />
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
