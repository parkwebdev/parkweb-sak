import React from 'react';
import { X, ChevronLeft, ChevronRight, Settings01 as Settings, Grid01 as Grid, MessageChatSquare, Users01 as Users, Cube01 as Bot, BarChart03 } from '@untitledui/icons';
import { Link, useLocation } from 'react-router-dom';
import { SearchInput } from './SearchInput';
import { UserAccountCard } from './UserAccountCard';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './notifications/NotificationCenter';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { useSidebar } from '@/hooks/use-sidebar';
import chatpadLogo from '@/assets/chatpad-logo.png';

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

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside className={`items-stretch flex ${isCollapsed ? 'w-[72px]' : 'w-[280px]'} h-screen bg-muted/30 p-1 transition-all duration-300`}>
      <div className="border shadow-sm w-full flex-1 bg-card rounded-xl border-border">
        <nav className="w-full gap-4 pt-4">
          <header className="w-full whitespace-nowrap gap-4 px-4 py-0">
            <div className="flex min-h-[24px] w-full max-w-full items-center justify-between">
              {!isCollapsed && (
                <img 
                  src={chatpadLogo} 
                  alt="ChatPad Logo" 
                  className="h-6 w-6 object-contain"
                />
              )}
              <div className="flex items-center gap-2">
                {!isCollapsed && <NotificationCenter />}
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
            {!isCollapsed && (
              <div className="w-full gap-2 mt-4 space-y-2">
                <OrganizationSwitcher />
                <SearchInput placeholder="Search everything..." />
              </div>
            )}
          </header>

          <div className="w-full mt-4 flex-1">
            <section className="w-full px-3 py-0">
              {navigationItems.map((item) => {
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

            {/* Bottom Navigation Items */}
            {bottomItems.length > 0 && (
              <section className="w-full px-3 py-0 mt-4 pt-4 border-t border-border">
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
        </nav>

        <footer className="absolute bottom-0 left-0 right-0 gap-3 pt-0 pb-3 px-3">
          {!isCollapsed && (
            <>
              <div className="mb-3 px-2.5 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ThemeToggle isCollapsed={isCollapsed} />
              </div>
            </>
          )}
          {isCollapsed && (
            <>
              <div className="mb-3 flex justify-center">
                <ThemeToggle isCollapsed={isCollapsed} />
              </div>
            </>
          )}
          <UserAccountCard isCollapsed={isCollapsed} />
        </footer>
      </div>
    </aside>
  );
};
