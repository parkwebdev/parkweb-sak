/**
 * AdminSidebar Component
 * 
 * Navigation sidebar for admin pages.
 * Filters sections based on user's admin_permissions.
 * 
 * @module components/admin/AdminSidebar
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ADMIN_SECTIONS } from '@/config/routes';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import type { AdminPermission } from '@/types/admin';
import { 
  LayoutAlt01, 
  Users01, 
  FileCode01, 
  CreditCard01, 
  BookOpen01, 
  Mail01, 
  TrendUp01, 
  ClipboardCheck,
  ArrowLeft,
  Shield01
} from '@untitledui/icons';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutAlt01,
  Users01,
  FileCode01,
  CreditCard01,
  UserGroup: Users01,
  BookOpen01,
  Mail01,
  TrendUp01,
  ClipboardCheck,
};

/**
 * Map admin section IDs to required permissions.
 * null = accessible to all pilot team members.
 */
const SECTION_PERMISSIONS: Record<string, AdminPermission | null> = {
  'overview': null,
  'accounts': 'view_accounts',
  'prompts': 'manage_settings',
  'plans': 'view_revenue',
  'team': 'view_team',
  'knowledge': 'view_content',
  'emails': 'view_content',
  'analytics': 'view_revenue',
  'audit': null,
};

/**
 * Navigation sidebar for admin pages.
 * Filters sections based on user's admin_permissions.
 */
export function AdminSidebar() {
  const location = useLocation();
  const { isSuperAdmin, hasAdminPermission } = useRoleAuthorization();
  
  // Filter sections based on permissions
  const visibleSections = ADMIN_SECTIONS.filter(section => {
    const required = SECTION_PERMISSIONS[section.id];
    if (!required) return true; // No permission required
    if (isSuperAdmin) return true; // Super admins see everything
    return hasAdminPermission(required);
  });
  
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Shield01 size={16} className="text-destructive" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </h1>
            <p className="text-2xs text-muted-foreground">Platform Management</p>
          </div>
        </div>
        <Link 
          to="/settings" 
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Settings
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleSections.map((section) => {
          const Icon = iconMap[section.iconName];
          // Overview (/admin) should only be active on exact match
          // Other sections should match if path starts with their path
          // Normalize pathname by removing trailing slash for comparison
          const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
          const isActive = section.id === 'overview'
            ? normalizedPath === '/admin'
            : normalizedPath.startsWith(section.path) && section.path !== '/admin';
          
          return (
            <Link
              key={section.id}
              to={section.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive 
                  ? 'bg-accent text-accent-foreground font-medium' 
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {Icon && <Icon size={18} aria-hidden="true" className={isActive ? 'text-foreground' : 'text-muted-foreground'} />}
              {section.label}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        {isSuperAdmin ? 'Super Admin Access' : 'Admin Access'}
      </div>
    </aside>
  );
}
