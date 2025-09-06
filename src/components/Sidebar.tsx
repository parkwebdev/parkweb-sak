import React, { useState } from 'react';
import { Home01 as Home, Grid01 as Grid, File02 as FileText, Users01 as Users, X } from '@untitledui/icons';
import { Link, useLocation } from 'react-router-dom';
import { SearchInput } from './SearchInput';
import { Badge } from './Badge';
import { UserAccountCard } from './UserAccountCard';
import { ThemeToggle } from './ThemeToggle';

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
    id: 'onboarding',
    label: 'Onboarding',
    icon: Users,
    path: '/onboarding'
  },
  {
    id: 'scope-of-works',
    label: 'Scope of Works',
    icon: FileText,
    path: '/scope-of-works'
  }
];

const bottomItems: NavigationItem[] = [];

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const searchResults = navigationItems.map(item => ({
    id: item.id,
    title: item.label,
    description: `Navigate to ${item.label}`,
    category: 'Navigation',
    action: () => window.location.href = item.path
  }));

  return (
    <aside className="items-stretch flex w-[280px] h-screen bg-muted/30 p-1">
      <div className="border shadow-sm w-full flex-1 bg-card rounded-xl border-border">
        <nav className="w-full gap-4 pt-4">
          <header className="w-full whitespace-nowrap gap-4 px-4 py-0">
            <div className="flex min-h-[24px] w-full max-w-full items-center justify-between">
              <div className="text-base font-semibold text-foreground">Agency</div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
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
            <div className="w-full gap-2 mt-4">
              <SearchInput
                placeholder="Search"
                value={searchTerm}
                onChange={setSearchTerm}
                searchResults={searchResults}
              />
            </div>
          </header>

          <div className="w-full mt-4">
            <section className="w-full px-3 py-0">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
                    <Link 
                      to={item.path}
                      className={`items-center flex w-full gap-2.5 flex-1 shrink basis-[0%] my-auto px-2.5 py-1.5 rounded-md transition-colors text-sm ${
                        isActive ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="items-center flex w-full gap-2 flex-1 shrink basis-[0%] my-auto">
                        <div className="items-center flex w-[18px] my-auto pr-0.5">
                          <item.icon size={14} className="self-stretch my-auto" />
                        </div>
                        <div className={`text-sm font-medium leading-4 self-stretch my-auto ${
                          isActive ? 'text-accent-foreground' : ''
                        }`}>
                          {item.label}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </section>
          </div>
        </nav>

        <footer className="absolute bottom-0 left-0 right-0 gap-3 pt-0 pb-3 px-3">
          <UserAccountCard />
        </footer>
      </div>
    </aside>
  );
};
