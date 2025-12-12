/**
 * Sidebar Navigation Component
 * 
 * Main navigation sidebar with collapsible behavior.
 * Expands on hover and shows unread conversation badges.
 * 
 * @module components/Sidebar
 */

import React from 'react';
import { X, Settings04 as Settings, Grid01 as Grid, MessageSquare01, User03, PieChart01, Calendar } from '@untitledui/icons';
import AriAgentsIcon from './icons/AriAgentsIcon';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserAccountCard } from './UserAccountCard';
import { useSidebar } from '@/hooks/use-sidebar';
import { useConversations } from '@/hooks/useConversations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
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
  /** Icon component */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Route path */
  path: string;
  /** Optional badge text */
  badge?: string;
}

/** Main navigation items */
const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid, path: '/' },
  { id: 'agents', label: 'Ari Agents', icon: AriAgentsIcon, path: '/agents' },
  { id: 'conversations', label: 'Inbox', icon: MessageSquare01, path: '/conversations' },
  { id: 'planner', label: 'Planner', icon: Calendar, path: '/planner' },
  { id: 'leads', label: 'Leads', icon: User03, path: '/leads' },
  { id: 'analytics', label: 'Analytics', icon: PieChart01, path: '/analytics' }
];

/** Bottom navigation items (settings, etc.) */
const bottomItems: NavigationItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
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
      className="flex h-screen bg-sidebar"
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={prefersReducedMotion ? { duration: 0 } : springs.smooth}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <nav className="w-full flex flex-col pt-6 px-3 pb-4">
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
                    className={`items-center flex w-full p-[11px] rounded-md transition-colors text-sm ${
                      isActive 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <div className="items-center flex gap-2 my-auto w-full">
                      <div className="items-center flex my-auto w-[18px] flex-shrink-0 relative">
                        <item.icon size={14} className="self-stretch my-auto" />
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
                            className="bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center ml-auto"
                            initial={prefersReducedMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springs.bouncy}
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

          {/* Bottom navigation (settings) */}
          {bottomItems.length > 0 && (
            <section className="w-full mt-4 pt-4 border-t border-border">
              {bottomItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div 
                    key={item.id} 
                    className="items-center flex w-full py-0.5"
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navigationItems.length + index) * 0.03, ...springs.smooth }}
                  >
                    <Link 
                      to={item.path}
                      className={`items-center flex w-full p-[11px] rounded-md transition-colors text-sm ${
                        isActive 
                          ? 'bg-accent text-accent-foreground' 
                          : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <div className="items-center flex gap-2 my-auto w-full overflow-hidden">
                        <div className="items-center flex my-auto w-[18px] flex-shrink-0">
                          <item.icon size={14} className="self-stretch my-auto" />
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
                );
              })}
            </section>
          )}
        </div>

        {/* Footer with user account */}
        <div className="pt-4 border-t border-border">
          <UserAccountCard isCollapsed={isCollapsed} />
        </div>
      </nav>
    </motion.aside>
  );
};