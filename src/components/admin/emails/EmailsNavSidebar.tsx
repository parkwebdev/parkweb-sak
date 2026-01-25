/**
 * Emails Navigation Sidebar
 * 
 * Secondary navigation sidebar for switching between Preview, Stats, 
 * Delivery Logs, and Announcements tabs.
 * 
 * @module components/admin/emails/EmailsNavSidebar
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Mail01, TrendUp01, File02, Announcement01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import type { EmailsTab } from './EmailsTabDropdown';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem = memo(function NavItem({ icon, label, isActive, onClick, badge }: NavItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition-colors duration-150',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      <span className={cn(isActive ? 'text-accent-foreground' : 'text-muted-foreground')}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-2xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
          {badge}
        </span>
      )}
    </motion.button>
  );
});

interface EmailsNavSidebarProps {
  activeTab: EmailsTab;
  onTabChange: (tab: EmailsTab) => void;
  /** Count of failed emails to show as badge on Delivery Logs */
  failedEmailCount?: number;
}

export const EMAILS_NAV_ITEMS: { id: EmailsTab; label: string; icon: typeof Mail01 }[] = [
  { id: 'preview', label: 'Preview', icon: Mail01 },
  { id: 'stats', label: 'Stats', icon: TrendUp01 },
  { id: 'logs', label: 'Delivery Logs', icon: File02 },
  { id: 'announcements', label: 'Announcements', icon: Announcement01 },
];

/**
 * Secondary navigation sidebar for the Admin Emails page.
 * Provides navigation between Preview, Stats, Delivery Logs, and Announcements.
 */
export function EmailsNavSidebar({ activeTab, onTabChange, failedEmailCount }: EmailsNavSidebarProps) {
  return (
    <aside className="w-48 shrink-0 border-r border-border bg-background flex flex-col">
      {/* Navigation Items */}
      <nav className="p-2 pt-4 space-y-0.5">
        {EMAILS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavItem
              key={item.id}
              icon={<Icon size={16} />}
              label={item.label}
              isActive={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              badge={item.id === 'logs' ? failedEmailCount : undefined}
            />
          );
        })}
      </nav>
    </aside>
  );
}
