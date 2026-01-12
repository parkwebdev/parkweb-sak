/**
 * AdminSidebar Component
 * 
 * Navigation sidebar for admin pages.
 * Follows same patterns as main app Sidebar.
 * 
 * @module components/admin/AdminSidebar
 */

import { Link, useLocation } from 'react-router-dom';
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
 * Navigation sidebar for admin pages.
 */
export function AdminSidebar() {
  const location = useLocation();
  
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Shield01 size={16} className="text-destructive" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Super Admin</h1>
            <p className="text-2xs text-muted-foreground">Platform Management</p>
          </div>
        </div>
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Dashboard
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {ADMIN_SECTIONS.map((section) => {
          const Icon = iconMap[section.iconName];
          const isActive = section.path === '/admin' 
            ? location.pathname === '/admin' 
            : location.pathname.startsWith(section.path);
          
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
        Super Admin Access
      </div>
    </aside>
  );
}
