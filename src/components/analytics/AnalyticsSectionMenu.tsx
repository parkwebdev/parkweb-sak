/**
 * AnalyticsSectionMenu Component
 * 
 * Vertical section menu for the Analytics page.
 * Displays all analytics sections in a flat, scannable list.
 * 
 * @module components/analytics/AnalyticsSectionMenu
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import {
  LayoutGrid01,
  LineChartUp01,
  FileSearch01,
  Calendar,
} from '@untitledui/icons';

export type AnalyticsSection = 'dashboard' | 'traffic' | 'reports' | 'schedule';

interface SectionItem {
  id: AnalyticsSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SECTIONS: SectionItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid01 },
  { id: 'traffic', label: 'Traffic', icon: LineChartUp01 },
  { id: 'reports', label: 'Reports', icon: FileSearch01 },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
];

interface AnalyticsSectionMenuProps {
  activeSection: AnalyticsSection;
  onSectionChange: (section: AnalyticsSection) => void;
}

export const AnalyticsSectionMenu: React.FC<AnalyticsSectionMenuProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav className="w-[240px] flex-shrink-0 border-r h-full overflow-y-auto py-4 px-3">
      <div className="space-y-0.5">
        {SECTIONS.map((item, index) => {
          const isActive = activeSection === item.id;
          
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
              transition={{ delay: index * 0.03, ...springs.smooth }}
            >
              <item.icon size={16} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
