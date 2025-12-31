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
import { ThemeToggle } from '@/components/ThemeToggle';
import PilotLogo from './PilotLogo';
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
function SidebarComponent({ onClose }: SidebarProps) {
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
            <PilotLogo className="h-6 w-6 text-foreground flex-shrink-0" />
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
        <div className="pt-4">
          {/* Bottom navigation (get set up, search, settings) */}
          {bottomItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isGetSetUp = item.id === 'get-set-up';
            
            // Circular progress for "Get set up"
            const renderIcon = () => {
              if (isGetSetUp) {
                // Show completed badge when all steps done
                if (allComplete) {
                  return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-status-active">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.0315 12C2.0312 11.8662 2.00492 11.7325 1.95265 11.6065L1.23121 9.85975C1.07879 9.49188 1.00006 9.09699 1 8.69879C0.999936 8.30038 1.07838 7.90585 1.23084 7.53776C1.3833 7.16967 1.6068 6.83523 1.88856 6.55355C2.17025 6.27194 2.50465 6.04858 2.87267 5.89623L4.6166 5.17384C4.86916 5.06941 5.0706 4.86887 5.17575 4.61659L5.8983 2.87214C6.20608 2.12905 6.79645 1.53866 7.53953 1.23085C8.28261 0.923049 9.11753 0.923048 9.86061 1.23085L11.6037 1.9529C11.8567 2.05733 12.141 2.0572 12.3938 1.95231L12.3958 1.95149L14.1404 1.23192C14.8832 0.924529 15.7183 0.924429 16.4611 1.23209C17.204 1.53984 17.7943 2.13006 18.1021 2.87295L18.8073 4.57552C18.8136 4.58896 18.8196 4.60259 18.8253 4.61641C18.9298 4.86924 19.1304 5.07024 19.383 5.1753L21.1279 5.8981C21.871 6.20591 22.4614 6.7963 22.7692 7.53939C23.0769 8.28247 23.0769 9.11739 22.7692 9.86048L22.0468 11.6045C21.9943 11.7311 21.9681 11.8661 21.9681 12.0003C21.9681 12.1345 21.9943 12.2689 22.0468 12.3955L22.7692 14.1395C23.0769 14.8826 23.0769 15.7175 22.7692 16.4606C22.4614 17.2037 21.871 17.7941 21.1279 18.1019L19.383 18.8247C19.1304 18.9298 18.9298 19.1308 18.8253 19.3836C18.8196 19.3974 18.8136 19.411 18.8073 19.4245L18.1021 21.127C17.7943 21.8699 17.204 22.4602 16.4611 22.7679C15.7183 23.0756 14.8832 23.0755 14.1404 22.7681L12.3958 22.0485L12.3938 22.0477C12.141 21.9428 11.8567 21.9427 11.6037 22.0471L9.86061 22.7691C9.11753 23.077 8.28261 23.077 7.53953 22.7691C6.79645 22.4613 6.20608 21.8709 5.8983 21.1279L5.17575 19.3834C5.0706 19.1311 4.86916 18.9306 4.6166 18.8262L2.87267 18.1038C2.50465 17.9514 2.17025 17.7281 1.88856 17.4465C1.6068 17.1648 1.3833 16.8303 1.23084 16.4622C1.07838 16.0941 0.999936 15.6996 1 15.3012C1.00006 14.903 1.07879 14.5081 1.23121 14.1402L1.95265 12.3935C2.00492 12.2675 2.0312 12.1338 2.0315 12ZM16.2071 10.2071C16.5976 9.81658 16.5976 9.18342 16.2071 8.79289C15.8166 8.40237 15.1834 8.40237 14.7929 8.79289L11 12.5858L9.70711 11.2929C9.31658 10.9024 8.68342 10.9024 8.29289 11.2929C7.90237 11.6834 7.90237 12.3166 8.29289 12.7071L10.2929 14.7071C10.6834 15.0976 11.3166 15.0976 11.7071 14.7071L16.2071 10.2071Z"
                        fill="currentColor"
                      />
                    </svg>
                  );
                }
                
                // Show progress circle when incomplete
                const progress = totalCount > 0 ? (completedCount / totalCount) : 0;
                const circumference = 2 * Math.PI * 6;
                const strokeDashoffset = circumference * (1 - progress);
                
                return (
                  <svg width="14" height="14" viewBox="0 0 16 16" className="flex-shrink-0">
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground/30"
                    />
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
                          ? 'bg-background dark:bg-accent/40 border border-border text-muted-foreground hover:text-foreground hover:bg-accent/60'
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
                  <>
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
                    
                    {/* Theme toggle after Search */}
                    <motion.div 
                      className="items-center flex w-full py-0.5"
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (navigationItems.length + index + 0.6) * 0.03, ...springs.smooth }}
                    >
                      <ThemeToggle isCollapsed={isCollapsed} isSidebarItem />
                    </motion.div>
                  </>
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

/**
 * Memoized Sidebar component to prevent unnecessary re-renders on route changes.
 * The component only re-renders when its props change.
 */
export const Sidebar = React.memo(SidebarComponent);