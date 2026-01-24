/**
 * RevenueSectionMenu Component
 * 
 * Vertical section menu for the Revenue Analytics page.
 * Displays all revenue sections in grouped categories.
 * 
 * @module components/admin/revenue/RevenueSectionMenu
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { type RevenueSection } from '@/lib/admin/revenue-constants';
import {
  LayoutAlt01,
  PieChart01,
  CreditCard01,
  TrendDown01,
  Users01,
} from '@untitledui/icons';
import { AnalyticsFilled } from '@/components/icons/SidebarIcons';
import { OverviewFilled as AdminOverviewFilled, AccountsFilled as AdminAccountsFilled } from '@/components/icons/AdminSidebarIcons';
import { CreditCardIconFilled } from '@/components/ui/settings-icon';
import { ChurnFilled } from './RevenueSectionIcons';

interface SectionItem {
  id: RevenueSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  activeIcon: React.ComponentType<{ size?: number; className?: string }>;
  group: string;
}

const SECTIONS: SectionItem[] = [
  // Summary
  { id: 'overview', label: 'Overview', icon: LayoutAlt01, activeIcon: AdminOverviewFilled, group: 'Summary' },
  
  // Revenue
  { id: 'mrr-breakdown', label: 'MRR Breakdown', icon: PieChart01, activeIcon: AnalyticsFilled, group: 'Revenue' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard01, activeIcon: CreditCardIconFilled, group: 'Revenue' },
  
  // Retention
  { id: 'churn', label: 'Churn Analysis', icon: TrendDown01, activeIcon: ChurnFilled, group: 'Retention' },
  
  // Accounts
  { id: 'accounts', label: 'Top Accounts', icon: Users01, activeIcon: AdminAccountsFilled, group: 'Accounts' },
];

interface RevenueSectionMenuProps {
  activeSection: RevenueSection;
  onSectionChange: (section: RevenueSection) => void;
}

export function RevenueSectionMenu({
  activeSection,
  onSectionChange,
}: RevenueSectionMenuProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Group sections for visual organization
  const groupedSections = SECTIONS.reduce((acc, section) => {
    const group = section.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(section);
    return acc;
  }, {} as Record<string, SectionItem[]>);

  return (
    <nav className="w-[240px] flex-shrink-0 border-r bg-background h-full min-h-0 overflow-y-auto overscroll-contain py-4 px-3">
      {Object.entries(groupedSections).map(([group, items], groupIndex) => (
        <div key={group} className={cn(groupIndex > 0 && 'mt-4 pt-4 border-t')}>
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-2">
            {group}
          </h3>
          <div className="space-y-0.5">
            {items.map((item, index) => {
              const isActive = activeSection === item.id;
              const Icon = isActive ? item.activeIcon : item.icon;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (groupIndex * 4 + index) * 0.02, ...springs.smooth }}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
