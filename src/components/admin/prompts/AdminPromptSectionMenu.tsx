/**
 * AdminPromptSectionMenu Component
 * 
 * Vertical section menu for the Admin Prompts page.
 * Matches the AriSectionMenu design pattern with active icon states.
 * 
 * @module components/admin/prompts/AdminPromptSectionMenu
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import {
  User01,
  MessageTextSquare01,
  ShieldTick,
  Globe01,
} from '@untitledui/icons';
import {
  UserFilled,
  MessageFilled,
  ShieldFilled,
  GlobeFilled,
} from '@/components/icons/AdminPromptIcons';

export type PromptSection = 'identity' | 'formatting' | 'security' | 'language';

interface PromptSectionConfig {
  id: PromptSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  activeIcon: React.ComponentType<{ size?: number; className?: string }>;
  group: string;
}

const PROMPT_SECTIONS: PromptSectionConfig[] = [
  {
    id: 'identity',
    label: 'Identity & Role',
    icon: User01,
    activeIcon: UserFilled,
    group: 'Core Prompts',
  },
  {
    id: 'formatting',
    label: 'Response Formatting',
    icon: MessageTextSquare01,
    activeIcon: MessageFilled,
    group: 'Core Prompts',
  },
  {
    id: 'security',
    label: 'Security Guardrails',
    icon: ShieldTick,
    activeIcon: ShieldFilled,
    group: 'Security',
  },
  {
    id: 'language',
    label: 'Language Instruction',
    icon: Globe01,
    activeIcon: GlobeFilled,
    group: 'Behavior',
  },
];

interface AdminPromptSectionMenuProps {
  activeSection: PromptSection;
  onSectionChange: (section: PromptSection) => void;
}

export function AdminPromptSectionMenu({
  activeSection,
  onSectionChange,
}: AdminPromptSectionMenuProps) {
  const prefersReducedMotion = useReducedMotion();

  // Group sections for visual organization
  const groupedSections = PROMPT_SECTIONS.reduce((acc, section) => {
    const group = section.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(section);
    return acc;
  }, {} as Record<string, PromptSectionConfig[]>);

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
                  <Icon size={15} className="flex-shrink-0" aria-hidden="true" />
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
