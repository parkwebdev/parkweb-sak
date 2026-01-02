/**
 * AriSectionMenu Component
 * 
 * Vertical section menu for the Ari configurator.
 * Displays all configuration sections in a flat, scannable list.
 * Uses centralized ARI_SECTIONS config from routes.ts.
 * 
 * @module components/agents/AriSectionMenu
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useCanManageChecker } from '@/hooks/useCanManage';
import { springs } from '@/lib/motion-variants';
import { ARI_SECTIONS, type AriSectionConfig } from '@/config/routes';
import {
  Atom01,
  File02,
  Palette,
  User01,
  Database01,
  BookOpen01,
  Announcement01,
  File06,
  Key01,
} from '@untitledui/icons';
import { FileFilled, PaletteFilled, MessageSquare, MessageSquareFilled, UserFilled, DatabaseFilled, MarkerPin, MarkerPinFilled, BookOpenFilled, AnnouncementFilled, NewsFilled, CodeBrowser, CodeBrowserFilled, Webhook, WebhookFilled, DataFlow, DataFlowFilled, KeyFilled, Terminal, TerminalFilled } from '@/components/icons/AriMenuIcons';

// Re-export the section type from routes.ts
export type AriSection = typeof ARI_SECTIONS[number]['id'];

// Icon mapping from string names to components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Atom01,
  File02,
  Palette,
  User01,
  Database01,
  BookOpen01,
  Announcement01,
  File06,
  Key01,
  // Custom filled icons
  FileFilled,
  PaletteFilled,
  MessageSquare,
  MessageSquareFilled,
  UserFilled,
  DatabaseFilled,
  MarkerPin,
  MarkerPinFilled,
  BookOpenFilled,
  AnnouncementFilled,
  NewsFilled,
  CodeBrowser,
  CodeBrowserFilled,
  Webhook,
  WebhookFilled,
  DataFlow,
  DataFlowFilled,
  KeyFilled,
  Terminal,
  TerminalFilled,
};

function getIcon(iconName: string): React.ComponentType<{ size?: number; className?: string }> {
  return ICON_MAP[iconName] || Atom01;
}

interface AriSectionMenuProps {
  activeSection: AriSection;
  onSectionChange: (section: AriSection) => void;
}

export function AriSectionMenu({
  activeSection,
  onSectionChange,
}: AriSectionMenuProps) {
  const prefersReducedMotion = useReducedMotion();
  const canManage = useCanManageChecker();
  
  // Filter sections based on permissions using centralized config
  const visibleSections = ARI_SECTIONS.filter(section => {
    if (!section.requiredPermission) return true;
    return canManage(section.requiredPermission);
  });
  
  // Group sections for visual organization
  const groupedSections = visibleSections.reduce((acc, section) => {
    const group = section.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(section);
    return acc;
  }, {} as Record<string, AriSectionConfig[]>);

  return (
    <nav className="w-[240px] flex-shrink-0 border-r border-border bg-background h-full overflow-y-auto py-4 px-3">
      {Object.entries(groupedSections).map(([group, items], groupIndex) => (
        <div key={group} className={cn(groupIndex > 0 && 'mt-4 pt-4 border-t')}>
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-2">
            {group}
          </h3>
          <div className="space-y-0.5">
            {items.map((item, index) => {
              const isActive = activeSection === item.id;
              const Icon = getIcon(item.iconName);
              const ActiveIcon = item.activeIconName ? getIcon(item.activeIconName) : null;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onSectionChange(item.id as AriSection)}
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
                  {isActive && ActiveIcon ? (
                    <ActiveIcon size={15} className="flex-shrink-0" />
                  ) : (
                    <Icon size={15} className="flex-shrink-0" />
                  )}
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