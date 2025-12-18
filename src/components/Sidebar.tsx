/**
 * Sidebar Navigation Component
 * 
 * Main navigation sidebar with collapsible behavior.
 * Expands on hover and shows unread conversation badges.
 * 
 * @module components/Sidebar
 */

import React from 'react';
import { X, Settings04 as Settings, Grid01 as Grid, User03, PieChart01, Calendar, CheckCircle, Circle, SearchMd } from '@untitledui/icons';
import AriAgentsIcon from './icons/AriAgentsIcon';
import { DashboardFilled, InboxOutline, InboxFilled, PlannerFilled, LeadsFilled, AnalyticsFilled, SettingsFilled } from './icons/SidebarIcons';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserAccountCard } from './UserAccountCard';
import { useSidebar } from '@/hooks/use-sidebar';
import { useConversations } from '@/hooks/useConversations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import ChatPadLogo from './ChatPadLogo';
import { springs } from '@/lib/motion-variants';
import type { ConversationMetadata } from '@/types/metadata';

/**
 * Navigation item configuration
 * @internal
 */
interface NavigationItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component (default state) */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Icon component for active state (optional) */
  activeIcon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Route path */
  path: string;
  /** Optional badge text */
  badge?: string;
}

/** Main navigation items */
const navigationItems: NavigationItem[] = [
  { id: 'ari', label: 'Ari', icon: AriAgentsIcon, path: '/ari' },
  { id: 'conversations', label: 'Inbox', icon: InboxOutline, activeIcon: InboxFilled, path: '/conversations' },
  { id: 'planner', label: 'Planner', icon: Calendar, activeIcon: PlannerFilled, path: '/planner' },
  { id: 'leads', label: 'Leads', icon: User03, activeIcon: LeadsFilled, path: '/leads' },
  { id: 'analytics', label: 'Analytics', icon: PieChart01, activeIcon: AnalyticsFilled, path: '/analytics' }
];

/** Bottom navigation items (settings, etc.) */
const bottomItems: NavigationItem[] = [
  { id: 'get-set-up', label: 'Get set up', icon: Circle, path: '/' },
  { id: 'settings', label: 'Settings', icon: Settings, activeIcon: SettingsFilled, path: '/settings' }
];

/**
 * Props for the Sidebar component
 */
interface SidebarProps {
  /** Optional callback when mobile close button is clicked */
  onClose?: () => void;
}

/**
 * Application sidebar with navigation links.
 * Features hover-to-expand behavior and unread message badges.
 * 
 * @example
 * <Sidebar />
 * 
 * @example
 * // Mobile with close button
 * <Sidebar onClose={() => setMobileMenuOpen(false)} />
 */
export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { isCollapsed, setCollapsed } = useSidebar();
  const { conversations } = useConversations();
  const prefersReducedMotion = useReducedMotion();
  const { allComplete, completedCount, totalCount } = useOnboardingProgress();
  const { setOpen: setSearchOpen } = useGlobalSearch();
  
  // Count unread conversations for admin notification badge
  const unreadConversationsCount = conversations.filter(conv => {
    const metadata = (conv.metadata || {}) as ConversationMetadata;
    const lastReadAt = metadata?.admin_last_read_at;
    const lastUserMessageAt = metadata?.last_user_message_at;
    const lastMessageAt = metadata?.last_message_at;
    const lastMessageRole = metadata?.last_message_role;
    
    const relevantMessageAt = lastUserMessageAt || 
      (lastMessageRole !== 'human' ? lastMessageAt : null);
    
    if (!relevantMessageAt) return false;
    if (!lastReadAt) return true;
    return new Date(relevantMessageAt) > new Date(lastReadAt);
  }).length;

  return (
    <motion.aside 
      className="flex h-screen bg-app-background"
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <nav className="w-full flex flex-col pt-6 px-3 pb-4" aria-label="Main navigation">
        {/* Header with logo */}
        <header className="w-full px-2 mb-6">
          <div className="flex items-center justify-start">
            <ChatPadLogo className="h-6 w-6 text-foreground flex-shrink-0" />
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground ml-auto"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {/* Main navigation */}
          <section className="w-full">
            {navigationItems.map((item, index) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <motion.div 
                  key={item.id} 
                  className="items-center flex w-full py-0.5"
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, ...springs.smooth }}
                >
                  <Link 
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`items-center flex w-full p-[11px] rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isActive 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <div className="items-center flex gap-2 my-auto w-full">
                      <div className="items-center flex my-auto w-[18px] flex-shrink-0 relative">
                        {isActive && item.activeIcon ? (
                          <item.activeIcon size={14} className="self-stretch my-auto" />
                        ) : (
                          <item.icon size={14} className="self-stretch my-auto" />
                        )}
                        {/* Collapsed state unread indicator */}
                        {isCollapsed && item.id === 'conversations' && unreadConversationsCount > 0 && (
                          <motion.span 
                            className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"
                            initial={prefersReducedMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springs.bouncy}
                          />
                        )}
                      </div>
                      <motion.div 
                        className="flex items-center justify-between flex-1 overflow-hidden"
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
                      >
                        <div className={`text-sm font-normal leading-4 my-auto whitespace-nowrap ${
                          isActive ? 'font-medium' : ''
                        }`}>
                          {item.label}
                        </div>
                        {item.id === 'conversations' && unreadConversationsCount > 0 && (
                          <motion.div 
                            className="bg-destructive text-destructive-foreground text-2xs font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center ml-auto"
                            initial={prefersReducedMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springs.bouncy}
                            role="status"
                            aria-label={`${unreadConversationsCount} unread conversations`}
                          >
                            {unreadConversationsCount}
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </section>

        </div>

        {/* Footer with get set up, search, settings and user account */}
        <div className="pt-4 space-y-1">
          {/* Bottom navigation (get set up, search, settings) */}
          {bottomItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isGetSetUp = item.id === 'get-set-up';
            
            // Circular progress for "Get set up"
            const renderIcon = () => {
              if (isGetSetUp) {
                const progress = totalCount > 0 ? (completedCount / totalCount) : 0;
                const circumference = 2 * Math.PI * 6; // radius = 6
                const strokeDashoffset = circumference * (1 - progress);
                
                return (
                  <svg width="14" height="14" viewBox="0 0 16 16" className="flex-shrink-0">
                    {/* Background circle */}
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground/30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-status-active"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 8 8)"
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                    {/* Checkmark when complete */}
                    {allComplete && (
                      <path
                        d="M5 8l2 2 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-status-active"
                      />
                    )}
                  </svg>
                );
              }
              if (isActive && item.activeIcon) {
                return <item.activeIcon size={14} className="self-stretch my-auto" />;
              }
              return <item.icon size={14} className="self-stretch my-auto" />;
            };
            
            return (
              <React.Fragment key={item.id}>
                <motion.div 
                  className="items-center flex w-full py-0.5"
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navigationItems.length + index) * 0.03, ...springs.smooth }}
                >
                  <Link 
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`items-center flex w-full p-[11px] rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isActive 
                        ? 'bg-accent text-accent-foreground' 
                        : isGetSetUp && !isCollapsed
                          ? 'bg-card text-muted-foreground hover:text-foreground'
                          : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <div className="items-center flex gap-2 my-auto w-full overflow-hidden">
                      <div className="items-center flex my-auto w-[18px] flex-shrink-0 justify-center">
                        {renderIcon()}
                      </div>
                      <motion.div
                        className={`text-sm font-normal leading-4 my-auto whitespace-nowrap ${
                          isActive ? 'font-medium' : ''
                        }`}
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
                      >
                        {item.label}
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
                
                {/* Insert Search button after Get set up */}
                {isGetSetUp && (
                  <motion.div 
                    className="items-center flex w-full py-0.5"
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navigationItems.length + index + 0.5) * 0.03, ...springs.smooth }}
                  >
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="items-center flex w-full p-[11px] rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                      title={isCollapsed ? 'Search' : ''}
                    >
                      <div className="items-center flex gap-2 my-auto w-full overflow-hidden">
                        <div className="items-center flex my-auto w-[18px] flex-shrink-0 justify-center">
                          <SearchMd size={14} className="self-stretch my-auto" />
                        </div>
                        <motion.div
                          className="flex items-center justify-between flex-1 text-sm font-normal leading-4 my-auto whitespace-nowrap"
                          initial={false}
                          animate={{ opacity: isCollapsed ? 0 : 1 }}
                          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
                        >
                          <span>Search</span>
                          <div className="flex items-center gap-0.5">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded border border-border bg-background px-1 font-mono text-2xs font-medium text-muted-foreground min-w-[20px]">
                              <span className="text-xs">⌘</span>
                            </kbd>
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded border border-border bg-background px-1 font-mono text-2xs font-medium text-muted-foreground min-w-[20px]">
                              K
                            </kbd>
                          </div>
                        </motion.div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
          
          {/* User account card */}
          <div className="pt-2">
            <UserAccountCard isCollapsed={isCollapsed} />
          </div>
        </div>
      </nav>
    </motion.aside>
  );
};