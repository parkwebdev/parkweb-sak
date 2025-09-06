import React, { useState } from 'react';
import { Home, BarChart3, FileText, Users } from 'lucide-react';
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
    icon: BarChart3,
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

export const Sidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  return (
    <aside className="items-stretch flex w-[296px] h-screen bg-background p-1">
      <div className="border shadow-sm w-full flex-1 bg-card rounded-xl border-border">
        <nav className="w-full gap-5 pt-5">
          <header className="w-full whitespace-nowrap gap-5 px-5 py-0">
            <div className="flex min-h-[27px] w-full max-w-full items-center justify-between">
              <div className="text-lg font-semibold text-foreground">Agency</div>
              <ThemeToggle />
            </div>
            <div className="w-full gap-2 mt-5">
              <SearchInput
                placeholder="Search"
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
          </header>

          <div className="w-full mt-5">
            <section className="w-full px-4 py-0">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
                    <Link 
                      to={item.path}
                      className={`items-center flex w-full gap-3 flex-1 shrink basis-[0%] my-auto px-3 py-2 rounded-md transition-colors ${
                        isActive ? 'bg-accent' : 'bg-transparent hover:bg-accent/50'
                      }`}
                    >
                      <div className="items-center flex w-full gap-2 flex-1 shrink basis-[0%] my-auto">
                        <div className="items-center flex w-[22px] my-auto pr-0.5">
                          <item.icon size={16} className="self-stretch my-auto" />
                        </div>
                        <div className={`text-[14px] font-medium leading-5 self-stretch my-auto ${
                          isActive ? 'text-foreground' : 'text-muted-foreground'
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

        <footer className="absolute bottom-0 left-0 right-0 gap-4 pt-0 pb-4 px-4">
          <UserAccountCard />
        </footer>
      </div>
    </aside>
  );
};
