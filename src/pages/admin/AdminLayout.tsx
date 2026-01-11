/**
 * Admin Layout Component
 * 
 * Layout wrapper for all Super Admin Dashboard pages.
 * Includes admin-specific sidebar navigation and header.
 * 
 * @module pages/admin/AdminLayout
 */

import { Outlet, useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ADMIN_SECTIONS } from '@/config/routes';
import { 
  LayoutAlt01, 
  Users01, 
  FileCode01, 
  CreditCard01, 
  BookOpen01, 
  Mail01, 
  TrendUp01, 
  ClipboardCheck,
  Shield01 
} from '@untitledui/icons';

// Icon mapping for admin sections
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutAlt01,
  Users01,
  FileCode01,
  CreditCard01,
  UserGroup: Users01, // Map UserGroup to Users01
  BookOpen01,
  Mail01,
  TrendUp01,
  ClipboardCheck,
};

/**
 * Admin layout with sidebar navigation for Super Admin Dashboard.
 */
export function AdminLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex h-full">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Shield01 size={16} className="text-destructive" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Super Admin</h1>
              <p className="text-2xs text-muted-foreground">Platform Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {ADMIN_SECTIONS.map((section) => {
            const Icon = iconMap[section.iconName];
            const isActive = section.path === '/admin' 
              ? currentPath === '/admin' 
              : currentPath.startsWith(section.path);
            
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
                {Icon && <Icon size={18} className={isActive ? 'text-foreground' : 'text-muted-foreground'} />}
                <span>{section.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Link 
            to="/dashboard" 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
