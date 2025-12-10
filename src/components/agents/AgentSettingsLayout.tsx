import React from 'react';
import { Menu01 as Menu } from '@untitledui/icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AgentSettingsLayoutProps {
  children: React.ReactNode;
}

export type AgentSettingsTab = 'knowledge-sources' | 'help-articles' | 'api-access' | 'custom-tools';

interface AgentSettingsMenuItemProps<T extends string = string> {
  id: T;
  label: string;
  active: boolean;
  onClick: (id: T) => void;
}

const AgentSettingsMenuItem = <T extends string = string>({
  id,
  label,
  active,
  onClick,
}: AgentSettingsMenuItemProps<T>) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      {label}
    </button>
  );
};

interface AgentSettingsLayoutContentProps<T extends string = string> {
  activeTab: T;
  onTabChange: (tab: T) => void;
  children: React.ReactNode;
  onMenuClick?: () => void;
  menuItems: Array<{ id: T; label: string }>;
  title: string;
  description: string;
  headerExtra?: React.ReactNode;
}

export const AgentSettingsLayout = <T extends string = string>({
  activeTab,
  onTabChange,
  children,
  onMenuClick,
  menuItems,
  title,
  description,
  headerExtra,
}: AgentSettingsLayoutContentProps<T>) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full h-full min-h-0 flex-1">
      {/* Mobile header with menu button and tabs */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <AnimatePresence mode="wait">
              <motion.p 
                key={description}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-muted-foreground"
              >
                {description}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Mobile tab navigation */}
        <div className="flex overflow-x-auto gap-1 mb-6 pb-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                activeTab === item.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Desktop Left Sidebar Menu */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-8">
          <div className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              {headerExtra}
            </div>
            <AnimatePresence mode="wait">
              <motion.p 
                key={description}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-muted-foreground"
              >
                {description}
              </motion.p>
            </AnimatePresence>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <AgentSettingsMenuItem
                key={item.id}
                id={item.id}
                label={item.label}
                active={activeTab === item.id}
                onClick={onTabChange}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 h-full min-h-0 overflow-y-auto pl-2 lg:pl-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};