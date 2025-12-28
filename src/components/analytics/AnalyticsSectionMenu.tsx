/**
 * AnalyticsSectionMenu Component
 * 
 * Vertical section menu for the Analytics page.
 * Displays all analytics sections in grouped categories.
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
  MessageChatCircle,
  Users01,
  Calendar,
  Zap,
  Share07,
  File02,
  Globe01,
} from '@untitledui/icons';

export type AnalyticsSection = 
  | 'dashboard'
  | 'conversations'
  | 'leads'
  | 'bookings'
  | 'ai-performance'
  | 'sources'
  | 'pages'
  | 'geography'
  | 'reports';

interface SectionItem {
  id: AnalyticsSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group: string;
}

const SECTIONS: SectionItem[] = [
  // Overview
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid01, group: 'Overview' },
  
  // Engagement
  { id: 'conversations', label: 'Conversations', icon: MessageChatCircle, group: 'Engagement' },
  { id: 'leads', label: 'Leads', icon: Users01, group: 'Engagement' },
  
  // Performance
  { id: 'bookings', label: 'Bookings', icon: Calendar, group: 'Performance' },
  { id: 'ai-performance', label: 'Ari Performance', icon: Zap, group: 'Performance' },
  
  // Traffic
  { id: 'sources', label: 'Sources', icon: Share07, group: 'Traffic' },
  { id: 'pages', label: 'Pages', icon: File02, group: 'Traffic' },
  { id: 'geography', label: 'Geography', icon: Globe01, group: 'Traffic' },
  
  // Reporting
  { id: 'reports', label: 'Reports', icon: File02, group: 'Reporting' },
];

interface AnalyticsSectionMenuProps {
  activeSection: AnalyticsSection;
  onSectionChange: (section: AnalyticsSection) => void;
}

export function AnalyticsSectionMenu({
  activeSection,
  onSectionChange,
}: AnalyticsSectionMenuProps) {
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
                  <item.icon size={15} className="flex-shrink-0" />
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
