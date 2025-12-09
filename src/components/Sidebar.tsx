import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Settings01 as Settings, Grid01 as Grid, MessageCircle02, User03, Cube01 as Bot, PieChart01, ChevronDown } from '@untitledui/icons';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserAccountCard } from './UserAccountCard';
import { useSidebar } from '@/hooks/use-sidebar';
import { useConversations } from '@/hooks/useConversations';
import { useAgents } from '@/hooks/useAgents';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ChatPadLogo from './ChatPadLogo';
import { springs } from '@/lib/motion-variants';
import type { ConversationMetadata } from '@/types/metadata';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Grid,
    path: '/'
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot,
    path: '/agents'
  },
  {
    id: 'conversations',
    label: 'Conversations',
    icon: MessageCircle02,
    path: '/conversations'
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: User03,
    path: '/leads'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: PieChart01,
    path: '/analytics'
  }
];

const bottomItems: NavigationItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  }
];

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { isCollapsed, toggle } = useSidebar();
  const { conversations } = useConversations();
  const { agents } = useAgents();
  const prefersReducedMotion = useReducedMotion();
  
  // Count unread conversations for admin
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

  // Check if we're on an agents page to keep accordion open
  const isOnAgentsPage = location.pathname.startsWith('/agents');
  const [agentsOpen, setAgentsOpen] = useState(isOnAgentsPage);

  return (
    <motion.aside 
      className="flex h-screen bg-sidebar"
      animate={{ 
        width: isCollapsed ? 72 : 240 
      }}
      transition={prefersReducedMotion ? { duration: 0 } : springs.smooth}
    >
      <nav className="w-full flex flex-col pt-6 px-3 pb-4">
        <header className="w-full px-2 mb-6">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={springs.snappy}
                >
                  <ChatPadLogo className="h-6 w-6 text-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className={`flex items-center gap-2 ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}>
              <motion.button
                onClick={toggle}
                className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 0 : 180 }}
                  transition={prefersReducedMotion ? { duration: 0 } : springs.snappy}
                >
                  <ChevronRight size={16} />
                </motion.div>
              </motion.button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="lg:hidden p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <section className="w-full">
              {navigationItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                
                // Special handling for Agents with accordion
                if (item.id === 'agents' && !isCollapsed) {
                  const activeAgents = agents.filter(a => a.status === 'active');
                  return (
                    <Collapsible
                      key={item.id}
                      open={agentsOpen}
                      onOpenChange={setAgentsOpen}
                      className="w-full"
                    >
                      <motion.div 
                        className="items-center flex w-full overflow-hidden px-0 py-0.5"
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, ...springs.smooth }}
                      >
                        <div className={`flex items-center w-full rounded-md ${
                          isOnAgentsPage 
                            ? 'bg-accent text-accent-foreground' 
                            : 'bg-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }`}>
                          <Link 
                            to="/agents"
                            className="items-center flex gap-2.5 flex-1 text-sm px-2.5 py-1.5"
                          >
                            <div className="items-center flex my-auto w-[18px] pr-0.5">
                              <item.icon size={14} className="self-stretch my-auto" />
                            </div>
                            <div className={`text-sm font-normal leading-4 self-stretch my-auto ${
                              isOnAgentsPage ? 'font-medium' : ''
                            }`}>
                              {item.label}
                            </div>
                          </Link>
                          
                          <CollapsibleTrigger className="p-1.5">
                            <motion.div
                              animate={{ rotate: agentsOpen ? 180 : 0 }}
                              transition={prefersReducedMotion ? { duration: 0 } : springs.snappy}
                            >
                              <ChevronDown size={14} />
                            </motion.div>
                          </CollapsibleTrigger>
                        </div>
                      </motion.div>
                      <CollapsibleContent>
                        {activeAgents.length > 0 ? (
                          <div className="ml-6 mt-1 space-y-0.5">
                            {activeAgents.map((agent, agentIndex) => {
                              const isAgentActive = location.pathname === `/agents/${agent.id}`;
                              return (
                                <motion.div
                                  key={agent.id}
                                  initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: agentIndex * 0.03, ...springs.smooth }}
                                >
                                  <Link
                                    to={`/agents/${agent.id}`}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                                      isAgentActive 
                                        ? 'bg-accent/50 text-accent-foreground font-medium' 
                                        : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
                                    }`}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                                    <span className="truncate">{agent.name}</span>
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : null}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }
                
                // Regular navigation items
                return (
                  <motion.div 
                    key={item.id} 
                    className="items-center flex w-full overflow-hidden px-0 py-0.5"
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, ...springs.smooth }}
                  >
                    <Link 
                      to={item.path}
                      className={`items-center flex w-full gap-2.5 flex-1 shrink basis-[0%] my-auto transition-colors text-sm ${
                        isCollapsed 
                          ? `px-2.5 py-2.5 rounded-md justify-center ${isActive ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'}`
                          : `px-2.5 py-1.5 rounded-md ${isActive ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'}`
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <div className={`items-center flex gap-2 my-auto ${isCollapsed ? 'justify-center' : 'w-full flex-1 shrink basis-[0%]'}`}>
                        <div className={`items-center flex my-auto relative ${isCollapsed ? '' : 'w-[18px] pr-0.5'}`}>
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
                        <AnimatePresence mode="wait">
                          {!isCollapsed && (
                            <motion.div 
                              className="flex items-center justify-between flex-1"
                              initial={prefersReducedMotion ? false : { opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={springs.snappy}
                            >
                              <div className={`text-sm font-normal leading-4 self-stretch my-auto whitespace-nowrap ${
                                isActive ? 'text-accent-foreground font-medium' : ''
                              }`}>
                                {item.label}
                              </div>
                              {item.id === 'conversations' && unreadConversationsCount > 0 && (
                                <motion.div 
                                  className="bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center"
                                  initial={prefersReducedMotion ? false : { scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={springs.bouncy}
                                >
                                  {unreadConversationsCount}
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </section>

          {/* Bottom Navigation Items */}
          {bottomItems.length > 0 && (
            <section className="w-full mt-4 pt-4 border-t border-border">
                {bottomItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.div 
                      key={item.id} 
                      className="items-center flex w-full overflow-hidden px-0 py-0.5"
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (navigationItems.length + index) * 0.03, ...springs.smooth }}
                    >
                      <Link 
                        to={item.path}
                        className={`items-center flex w-full gap-2.5 flex-1 shrink basis-[0%] my-auto transition-colors text-sm ${
                          isCollapsed 
                            ? `px-2.5 py-2.5 rounded-md justify-center ${isActive ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'}`
                            : `px-2.5 py-1.5 rounded-md ${isActive ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'}`
                        }`}
                        title={isCollapsed ? item.label : ''}
                      >
                        <div className={`items-center flex gap-2 my-auto ${isCollapsed ? 'justify-center' : 'w-full flex-1 shrink basis-[0%]'}`}>
                          <div className={`items-center flex my-auto ${isCollapsed ? '' : 'w-[18px] pr-0.5'}`}>
                            <item.icon size={14} className="self-stretch my-auto" />
                          </div>
                          <AnimatePresence mode="wait">
                            {!isCollapsed && (
                              <motion.div
                                className={`text-sm font-normal leading-4 self-stretch my-auto whitespace-nowrap ${
                                  isActive ? 'text-accent-foreground font-medium' : ''
                                }`}
                                initial={prefersReducedMotion ? false : { opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={springs.snappy}
                              >
                                {item.label}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </Link>
                    </motion.div>
                  );
              })}
            </section>
          )}
        </div>

        {/* Footer with UserAccountCard */}
        <div className="pt-4 border-t border-border">
          <UserAccountCard isCollapsed={isCollapsed} />
        </div>
      </nav>
    </motion.aside>
  );
};
