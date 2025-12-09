import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Settings01 as Settings, Grid01 as Grid, MessageCircle02, User03, Cube01 as Bot, PieChart01, ChevronDown } from '@untitledui/icons';
import { Link, useLocation } from 'react-router-dom';
import { UserAccountCard } from './UserAccountCard';
import { useSidebar } from '@/hooks/use-sidebar';
import { useConversations } from '@/hooks/useConversations';
import { useAgents } from '@/hooks/useAgents';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ChatPadLogo from './ChatPadLogo';
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
  
  // Count unread conversations for admin
  const unreadConversationsCount = conversations.filter(conv => {
    const metadata = (conv.metadata || {}) as ConversationMetadata;
    const lastReadAt = metadata?.admin_last_read_at;
    const lastUserMessageAt = metadata?.last_user_message_at;
    const lastMessageAt = metadata?.last_message_at;
    const lastMessageRole = metadata?.last_message_role;
    
    // Prefer last_user_message_at if available
    // Fallback to last_message_at only if last message wasn't from human team member
    const relevantMessageAt = lastUserMessageAt || 
      (lastMessageRole !== 'human' ? lastMessageAt : null);
    
    if (!relevantMessageAt) return false;
    
    // Never read by admin - unread
    if (!lastReadAt) return true;
    
    // New user messages since last read
    return new Date(relevantMessageAt) > new Date(lastReadAt);
  }).length;

  // Check if we're on an agents page to keep accordion open
  const isOnAgentsPage = location.pathname.startsWith('/agents');
  const [agentsOpen, setAgentsOpen] = useState(isOnAgentsPage);

  return (
    <aside className={`flex ${isCollapsed ? 'w-[72px]' : 'w-[240px]'} h-screen bg-sidebar transition-all duration-300`}>
      <nav className="w-full flex flex-col pt-6 px-3 pb-4">
        <header className="w-full px-2 mb-6">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <ChatPadLogo className="h-6 w-6 text-foreground" />
            )}
            
            <div className={`flex items-center gap-2 ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}>
              <button
                onClick={toggle}
                className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
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
              {navigationItems.map((item) => {
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
                      <div className="items-center flex w-full overflow-hidden px-0 py-0.5">
                        <div className={`flex items-center w-full rounded-md ${
                          isOnAgentsPage 
                            ? 'bg-accent text-accent-foreground' 
                            : 'bg-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }`}>
                          {/* Left side: Link to /agents (icon + label) */}
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
                          
                          {/* Right side: Chevron toggle for dropdown */}
                          <CollapsibleTrigger className="p-1.5">
                            <ChevronDown size={14} />
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      <CollapsibleContent>
                        {activeAgents.length > 0 ? (
                          <div className="ml-6 mt-1 space-y-0.5">
                            {activeAgents.map((agent) => {
                              const isAgentActive = location.pathname === `/agents/${agent.id}`;
                              return (
                                <Link
                                  key={agent.id}
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
                  <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
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
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                          )}
                        </div>
                        {!isCollapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <div className={`text-sm font-normal leading-4 self-stretch my-auto ${
                              isActive ? 'text-accent-foreground font-medium' : ''
                            }`}>
                              {item.label}
                            </div>
                            {item.id === 'conversations' && unreadConversationsCount > 0 && (
                              <div className="bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                                {unreadConversationsCount}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </section>

          {/* Bottom Navigation Items */}
          {bottomItems.length > 0 && (
            <section className="w-full mt-4 pt-4 border-t border-border">
                {bottomItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
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
                          {!isCollapsed && (
                            <div className={`text-sm font-normal leading-4 self-stretch my-auto ${
                              isActive ? 'text-accent-foreground font-medium' : ''
                            }`}>
                              {item.label}
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
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
    </aside>
  );
};
