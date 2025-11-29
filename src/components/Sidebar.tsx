import React from 'react';
import { Grid01 as Grid, MessageChatSquare, Users01 as Users, Cube01 as Bot, BarChart03, Settings01 as Settings } from '@untitledui/icons';
import { Link, useLocation } from 'react-router-dom';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useSidebar } from '@/components/ui/sidebar';
import { useConversations } from '@/hooks/useConversations';
import chatpadLogo from '@/assets/chatpad-logo.png';
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
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
    icon: MessageChatSquare,
    path: '/conversations'
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Users,
    path: '/leads'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart03,
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

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { open } = useSidebar();
  const { conversations } = useConversations();
  
  // Count new conversations (active status, created in last 24 hours)
  const newConversationsCount = conversations.filter(conv => {
    const isRecent = new Date(conv.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
    return conv.status === 'active' && isRecent;
  }).length;

  const isCollapsed = !open;

  return (
    <SidebarRoot className="border-r" collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="space-y-3">
          {!isCollapsed && (
            <img 
              src={chatpadLogo} 
              alt="ChatPad Logo" 
              className="h-6 w-6 object-contain"
            />
          )}
          
          <WorkspaceSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.path} className="flex items-center gap-2">
                        <item.icon size={18} />
                        {!isCollapsed && (
                          <span className="flex-1">{item.label}</span>
                        )}
                        {!isCollapsed && item.id === 'conversations' && newConversationsCount > 0 && (
                          <div className="bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                            {newConversationsCount}
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.path} className="flex items-center gap-2">
                        <item.icon size={18} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        {/* Footer content can go here if needed */}
      </SidebarFooter>
    </SidebarRoot>
  );
};
