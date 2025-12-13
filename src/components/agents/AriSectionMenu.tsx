/**
 * AriSectionMenu Component
 * 
 * Vertical section menu for the Ari configurator.
 * Displays all configuration sections in a flat, scannable list.
 * 
 * @module components/agents/AriSectionMenu
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import {
  Settings01,
  MessageTextSquare01,
  Palette,
  MessageSmileCircle,
  User01,
  Database01,
  MarkerPin01,
  BookOpen01,
  Announcement01,
  File06,
  Tool02,
  Link03,
  Key01,
  Code01,
} from '@untitledui/icons';

export type AriSection = 
  | 'model-behavior'
  | 'system-prompt'
  | 'appearance'
  | 'welcome-messages'
  | 'lead-capture'
  | 'knowledge'
  | 'locations'
  | 'help-articles'
  | 'announcements'
  | 'news'
  | 'custom-tools'
  | 'webhooks'
  | 'integrations'
  | 'api-access'
  | 'installation';

interface SectionItem {
  id: AriSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group?: string;
}

const SECTIONS: SectionItem[] = [
  // AI Configuration
  { id: 'model-behavior', label: 'Model & Behavior', icon: Settings01, group: 'AI' },
  { id: 'system-prompt', label: 'System Prompt', icon: MessageTextSquare01, group: 'AI' },
  
  // Widget Appearance
  { id: 'appearance', label: 'Appearance', icon: Palette, group: 'Widget' },
  { id: 'welcome-messages', label: 'Welcome & Messages', icon: MessageSmileCircle, group: 'Widget' },
  { id: 'lead-capture', label: 'Lead Capture', icon: User01, group: 'Widget' },
  
  // Knowledge
  { id: 'knowledge', label: 'Knowledge', icon: Database01, group: 'Knowledge' },
  { id: 'locations', label: 'Locations', icon: MarkerPin01, group: 'Knowledge' },
  { id: 'help-articles', label: 'Help Articles', icon: BookOpen01, group: 'Knowledge' },
  
  // Content
  { id: 'announcements', label: 'Announcements', icon: Announcement01, group: 'Content' },
  { id: 'news', label: 'News', icon: File06, group: 'Content' },
  
  // Tools & API
  { id: 'custom-tools', label: 'Custom Tools', icon: Tool02, group: 'Tools' },
  { id: 'webhooks', label: 'Webhooks', icon: Link03, group: 'Tools' },
  { id: 'integrations', label: 'Integrations', icon: Link03, group: 'Tools' },
  { id: 'api-access', label: 'API Access', icon: Key01, group: 'Tools' },
  
  // Installation
  { id: 'installation', label: 'Installation', icon: Code01, group: 'Deploy' },
];

interface AriSectionMenuProps {
  activeSection: AriSection;
  onSectionChange: (section: AriSection) => void;
}

export const AriSectionMenu: React.FC<AriSectionMenuProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Group sections for visual organization
  const groupedSections = SECTIONS.reduce((acc, section) => {
    const group = section.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(section);
    return acc;
  }, {} as Record<string, SectionItem[]>);

  return (
    <nav className="w-[200px] flex-shrink-0 border-r h-full overflow-y-auto py-4 px-3">
      {Object.entries(groupedSections).map(([group, items], groupIndex) => (
        <div key={group} className={cn(groupIndex > 0 && 'mt-4 pt-4 border-t')}>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-2">
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
};
