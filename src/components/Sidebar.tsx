import React, { useState } from 'react';
import { Home, BarChart3, FileText, Users } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { Badge } from './Badge';
import { UserAccountCard } from './UserAccountCard';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  isActive?: boolean;
  badge?: string;
  hasDropdown?: boolean;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    isActive: false
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    isActive: true
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    icon: Users,
    isActive: false
  },
  {
    id: 'scope-of-works',
    label: 'Scope of Works',
    icon: FileText,
    isActive: false
  }
];

const bottomItems: NavigationItem[] = [];

export const Sidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <aside className="items-stretch flex w-[296px] h-screen bg-muted/20 p-1">
      <div className="border shadow-sm w-full flex-1 bg-card rounded-xl border-border">
        <nav className="w-full gap-5 pt-5">
          <header className="w-full whitespace-nowrap gap-5 px-5 py-0">
            <div className="flex min-h-[27px] w-[139px] max-w-full" />
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
              {navigationItems.map((item) => (
                <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
                  <button className={`items-center flex w-full gap-3 flex-1 shrink basis-[0%] my-auto px-3 py-2 rounded-md ${
                    item.isActive ? 'bg-accent' : 'bg-transparent hover:bg-accent/50'
                  }`}>
                    <div className="items-center flex w-full gap-2 flex-1 shrink basis-[0%] my-auto">
                      <div className="items-center flex w-[22px] my-auto pr-0.5">
                        <item.icon size={16} className="self-stretch my-auto" />
                      </div>
                      <div className={`text-[14px] font-medium leading-5 self-stretch my-auto ${
                        item.isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {item.label}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
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
